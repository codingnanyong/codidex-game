import Phaser from "phaser";
import { isCommonPathComplete } from "@codigdex/game-content/domain/chapters";
import {
  EMPTY_CAREER_DEX_STATE,
  isCareerId,
  normalizeCareerDexState,
  reconcileCareerDex,
  selectCareer,
  type CareerDexState,
  type CareerId,
} from "@codigdex/game-content/domain/careerDex";
import { capturedIds, DexState, EMPTY_DEX_STATE } from "@codigdex/game-core/domain/dex/capture";
import { CAPTURABLE_MONSTERS } from "@codigdex/game-content/domain/chapters";
import {
  completedSecondaryJobIds,
  findJob,
  findSecondaryJob,
  findTertiaryJob,
  JOB_REGISTRY_KEY,
  SECONDARY_JOB_REGISTRY_KEY,
  SECONDARY_JOB_SELECTION_ENABLED,
  TERTIARY_JOB_REGISTRY_KEY,
} from "@codigdex/game-content/domain/player/jobs";
import { DEFAULT_LOCALE, detectLocale, isLocale, type Locale } from "@codigdex/game-core/i18n/locale";
import { createSave, parseSave } from "@codigdex/game-core/save/schema";
import { SAVE_STORAGE_KEYS } from "@codigdex/game-core/save/storage";
import { completedCareerPathIds } from "./worldMap/careerPaths";

const CARDS_KEY = "cards";
const CAREER_DEX_KEY = "careerDex";
export const TUTORIAL_ONBOARDING_SEEN_KEY = "tutorialOnboardingSeen";
export const LOCALE_REGISTRY_KEY = "locale";
export const SAVE_STORAGE_KEY = SAVE_STORAGE_KEYS.current;
export const PREVIOUS_SAVE_STORAGE_KEY = SAVE_STORAGE_KEYS.previous;
export const LEGACY_SAVE_STORAGE_KEY = SAVE_STORAGE_KEYS.legacy;

function preferredLanguages(): readonly string[] | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

/** The interface language. Falls back to the default when the registry holds nothing valid. */
export function readLocale(registry: Phaser.Data.DataManager): Locale {
  const value = registry.get(LOCALE_REGISTRY_KEY);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function browserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Restores saved ids against today's monster definitions, so content edits don't stale the dex. */
export function hydrateRegistry(
  registry: Phaser.Data.DataManager,
  storage = browserStorage(),
  browserLanguages = preferredLanguages()
) {
  // A first visit has no saved language, so start in the browser's language.
  registry.set(LOCALE_REGISTRY_KEY, detectLocale(browserLanguages));
  if (!storage) return;
  try {
    const currentRaw = storage.getItem(SAVE_STORAGE_KEY);
    const previousRaw = storage.getItem(PREVIOUS_SAVE_STORAGE_KEY);
    const legacyRaw = storage.getItem(LEGACY_SAVE_STORAGE_KEY);
    const currentSave = currentRaw ? parseSave(currentRaw) : undefined;
    const previousSave = previousRaw ? parseSave(previousRaw) : undefined;
    const save = currentSave ?? previousSave ?? (legacyRaw ? parseSave(legacyRaw) : undefined);
    if (!save) return;

    const capturedAtById = new Map(
      save.progress.captures
        .map((entry) => [entry.id, entry.capturedAt])
    );
    const cards = CAPTURABLE_MONSTERS.filter((monster) => capturedAtById.has(monster.id)).map((monster) => ({
      id: monster.id,
      dexNumber: monster.dexNumber,
      name: monster.name,
      classification: monster.classification,
      trait: monster.trait,
      description: monster.description,
      snippet: monster.snippet,
      capturedAt: capturedAtById.get(monster.id)!,
    }));

    registry.set(CARDS_KEY, cards);
    registry.set(
      CAREER_DEX_KEY,
      normalizeCareerDexState({
        careers: save.progress.careers.flatMap((record) =>
          isCareerId(record.id) ? [{ ...record, id: record.id }] : []
        ),
      })
    );
    registry.set(JOB_REGISTRY_KEY, findJob(save.player.primaryJobId).id);
    registry.set(SECONDARY_JOB_REGISTRY_KEY, findSecondaryJob(save.player.secondaryJobId)?.id ?? null);
    registry.set(TERTIARY_JOB_REGISTRY_KEY, findTertiaryJob(save.player.tertiaryJobId)?.id ?? null);
    registry.set(TUTORIAL_ONBOARDING_SEEN_KEY, save.ui.tutorialOnboardingSeen);
    if (save.ui.locale) registry.set(LOCALE_REGISTRY_KEY, save.ui.locale);

    // Copy a valid legacy save into the current slot without deleting the fallback.
    if (!currentSave) persistRegistry(registry, storage);
  } catch {
    // A malformed or unavailable save must never prevent the game from booting.
  }
}

export function persistRegistry(registry: Phaser.Data.DataManager, storage = browserStorage()) {
  if (!storage) return;
  const state = readDexState(registry);
  const save = createSave({
    captures: state.cards.map(({ id, capturedAt }) => ({ id, capturedAt })),
    careers: readCareerDexState(registry).careers,
    primaryJobId: findJob(registry.get(JOB_REGISTRY_KEY) as string | undefined).id,
    secondaryJobId:
      findSecondaryJob(registry.get(SECONDARY_JOB_REGISTRY_KEY) as string | null | undefined)?.id ?? null,
    tertiaryJobId:
      findTertiaryJob(registry.get(TERTIARY_JOB_REGISTRY_KEY) as string | null | undefined)?.id ?? null,
    tutorialOnboardingSeen: registry.get(TUTORIAL_ONBOARDING_SEEN_KEY) === true,
    locale: readLocale(registry),
  });
  try {
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Private browsing and full storage can reject writes; play can continue in memory.
  }
}

/** Hydrates once, then mirrors every registry mutation to browser storage. */
export function initializeRegistryPersistence(registry: Phaser.Data.DataManager) {
  hydrateRegistry(registry);
  const save = () => persistRegistry(registry);
  registry.events.on(Phaser.Data.Events.SET_DATA, save);
  registry.events.on(Phaser.Data.Events.CHANGE_DATA, save);
}

export function hasSavedProgress(registry: Phaser.Data.DataManager): boolean {
  const careerProgress = readCareerDexState(registry).careers.some(
    (career) => career.id !== "junior" || Boolean(career.masteredAt)
  );
  return (
    readDexState(registry).cards.length > 0 ||
    careerProgress ||
    registry.get(TUTORIAL_ONBOARDING_SEEN_KEY) === true
  );
}

/** Clears the current adventure while leaving the game's code and asset cache intact. */
export function resetGameProgress(registry: Phaser.Data.DataManager, storage = browserStorage()) {
  try {
    storage?.removeItem(SAVE_STORAGE_KEY);
    storage?.removeItem(PREVIOUS_SAVE_STORAGE_KEY);
    storage?.removeItem(LEGACY_SAVE_STORAGE_KEY);
  } catch {
    // Registry reset still works when browser storage is unavailable.
  }
  registry.set(CARDS_KEY, EMPTY_DEX_STATE.cards);
  registry.set(CAREER_DEX_KEY, EMPTY_CAREER_DEX_STATE);
  registry.set(JOB_REGISTRY_KEY, "junior");
  registry.set(SECONDARY_JOB_REGISTRY_KEY, null);
  registry.set(TERTIARY_JOB_REGISTRY_KEY, null);
  registry.set(TUTORIAL_ONBOARDING_SEEN_KEY, false);
  persistRegistry(registry, storage);
}

export function ensureDexDefaults(registry: Phaser.Data.DataManager) {
  if (registry.get(CARDS_KEY) === undefined) {
    registry.set(CARDS_KEY, EMPTY_DEX_STATE.cards);
  }
  if (registry.get(CAREER_DEX_KEY) === undefined) {
    registry.set(CAREER_DEX_KEY, EMPTY_CAREER_DEX_STATE);
  }
}

export function readDexState(registry: Phaser.Data.DataManager): DexState {
  return {
    cards: (registry.get(CARDS_KEY) as DexState["cards"]) ?? EMPTY_DEX_STATE.cards,
  };
}

export function writeDexState(registry: Phaser.Data.DataManager, state: DexState) {
  registry.set(CARDS_KEY, state.cards);
}

export function readCareerDexState(registry: Phaser.Data.DataManager): CareerDexState {
  return normalizeCareerDexState(
    (registry.get(CAREER_DEX_KEY) as CareerDexState | undefined) ?? EMPTY_CAREER_DEX_STATE
  );
}

export function activateCareerInRegistry(registry: Phaser.Data.DataManager, id: CareerId) {
  registry.set(CAREER_DEX_KEY, selectCareer(readCareerDexState(registry), id));
}

/** Reconciles capture-based completion once, then lets lineage screens read career milestones. */
export function reconcileCareerDexRegistry(registry: Phaser.Data.DataManager): CareerDexState {
  const captured = capturedIds(readDexState(registry));
  const completedPrimaryJobs = completedCareerPathIds(captured);
  const primary = findJob(registry.get(JOB_REGISTRY_KEY) as string | undefined).id;
  const secondary = SECONDARY_JOB_SELECTION_ENABLED
    ? findSecondaryJob(
        registry.get(SECONDARY_JOB_REGISTRY_KEY) as string | null | undefined
      )?.id
    : undefined;
  const tertiary = SECONDARY_JOB_SELECTION_ENABLED
    ? findTertiaryJob(
        registry.get(TERTIARY_JOB_REGISTRY_KEY) as string | null | undefined
      )?.id
    : undefined;
  const current = readCareerDexState(registry);
  const next = reconcileCareerDex(current, {
    commonPathComplete: isCommonPathComplete(captured),
    completedPrimaryJobs,
    completedSecondaryJobs: completedSecondaryJobIds(captured),
    activePrimaryJob: primary,
    activeSecondaryJob: secondary,
    activeTertiaryJob: tertiary,
  });
  if (JSON.stringify(next) !== JSON.stringify(current)) registry.set(CAREER_DEX_KEY, next);
  return next;
}
