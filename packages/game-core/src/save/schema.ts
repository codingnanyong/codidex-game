import { isLocale, type Locale } from "../i18n/locale";

export interface StoredCapture {
  id: string;
  capturedAt: string;
}

export interface StoredCareerMilestone {
  id: string;
  unlockedAt: string;
  selectedAt?: string;
  masteredAt?: string;
}

interface StoredGameStateV1 {
  version: 1;
  captures: StoredCapture[];
  selectedJob?: string;
  tutorialOnboardingSeen?: boolean;
}

export interface StoredGameStateV3 {
  version: 3;
  progress: {
    captures: StoredCapture[];
    careers: StoredCareerMilestone[];
  };
  player: {
    primaryJobId: string;
    secondaryJobId: string | null;
    tertiaryJobId: string | null;
  };
  ui: {
    tutorialOnboardingSeen: boolean;
    /** Chosen in settings; absent until the player (or their browser) picks one. */
    locale?: Locale;
  };
}

export interface SaveSnapshot {
  captures: StoredCapture[];
  careers: StoredCareerMilestone[];
  primaryJobId: string;
  secondaryJobId: string | null;
  tertiaryJobId: string | null;
  tutorialOnboardingSeen: boolean;
  locale?: Locale;
}

export function createEmptySave(locale?: Locale): StoredGameStateV3 {
  return createSave({
    captures: [],
    careers: [],
    primaryJobId: "junior",
    secondaryJobId: null,
    tertiaryJobId: null,
    tutorialOnboardingSeen: false,
    locale,
  });
}

export function createSave(snapshot: SaveSnapshot): StoredGameStateV3 {
  return {
    version: 3,
    progress: { captures: snapshot.captures, careers: snapshot.careers },
    player: {
      primaryJobId: snapshot.primaryJobId,
      secondaryJobId: snapshot.secondaryJobId,
      tertiaryJobId: snapshot.tertiaryJobId,
    },
    ui: {
      tutorialOnboardingSeen: snapshot.tutorialOnboardingSeen,
      ...(snapshot.locale ? { locale: snapshot.locale } : {}),
    },
  };
}

/** Accepts the current save and migrates both earlier save layouts. */
export function parseSave(raw: string): StoredGameStateV3 | undefined {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(value)) return undefined;

  if (value.version === 1) return migrateV1(value);
  if (value.version === 2) return migrateV2(value);
  if (value.version !== 3 || !isRecord(value.progress) || !isRecord(value.player) || !isRecord(value.ui)) {
    return undefined;
  }
  if (!Array.isArray(value.progress.captures) || !Array.isArray(value.progress.careers)) return undefined;

  return createSave({
    captures: validCaptures(value.progress.captures),
    careers: validCareers(value.progress.careers),
    primaryJobId: typeof value.player.primaryJobId === "string" ? value.player.primaryJobId : "junior",
    secondaryJobId: typeof value.player.secondaryJobId === "string" ? value.player.secondaryJobId : null,
    tertiaryJobId: typeof value.player.tertiaryJobId === "string" ? value.player.tertiaryJobId : null,
    tutorialOnboardingSeen: value.ui.tutorialOnboardingSeen === true,
    locale: isLocale(value.ui.locale) ? value.ui.locale : undefined,
  });
}

function migrateV1(value: Record<string, unknown>): StoredGameStateV3 | undefined {
  if (!Array.isArray(value.captures)) return undefined;
  const old = value as unknown as StoredGameStateV1;
  const captures = validCaptures(old.captures);
  const primaryJobId = typeof old.selectedJob === "string" ? old.selectedJob : "junior";
  return createSave({
    captures,
    careers: migratedCareers(captures, primaryJobId, null, null),
    primaryJobId,
    secondaryJobId: null,
    tertiaryJobId: null,
    tutorialOnboardingSeen: old.tutorialOnboardingSeen === true,
  });
}

function migrateV2(value: Record<string, unknown>): StoredGameStateV3 | undefined {
  if (!isRecord(value.progress) || !isRecord(value.player) || !isRecord(value.ui)) return undefined;
  if (!Array.isArray(value.progress.captures)) return undefined;
  const captures = validCaptures(value.progress.captures);
  const primaryJobId = typeof value.player.primaryJobId === "string" ? value.player.primaryJobId : "junior";
  const secondaryJobId = typeof value.player.secondaryJobId === "string" ? value.player.secondaryJobId : null;
  const tertiaryJobId = typeof value.player.tertiaryJobId === "string" ? value.player.tertiaryJobId : null;
  return createSave({
    captures,
    careers: migratedCareers(captures, primaryJobId, secondaryJobId, tertiaryJobId),
    primaryJobId,
    secondaryJobId,
    tertiaryJobId,
    tutorialOnboardingSeen: value.ui.tutorialOnboardingSeen === true,
  });
}

function migratedCareers(
  captures: StoredCapture[],
  primaryJobId: string,
  secondaryJobId: string | null,
  tertiaryJobId: string | null
): StoredCareerMilestone[] {
  const migratedAt = captures.at(-1)?.capturedAt ?? "1970-01-01T00:00:00.000Z";
  const careers: StoredCareerMilestone[] = [
    {
      id: "junior",
      unlockedAt: migratedAt,
      ...(primaryJobId !== "junior" ? { masteredAt: migratedAt } : {}),
    },
  ];
  if (primaryJobId !== "junior") {
    careers.push({ id: primaryJobId, unlockedAt: migratedAt, selectedAt: migratedAt });
  }
  if (secondaryJobId) {
    careers.push({ id: secondaryJobId, unlockedAt: migratedAt, selectedAt: migratedAt });
  }
  if (tertiaryJobId) {
    careers.push({ id: tertiaryJobId, unlockedAt: migratedAt, selectedAt: migratedAt });
  }
  return careers;
}

function validCaptures(value: unknown[]): StoredCapture[] {
  return value.filter(
    (entry): entry is StoredCapture =>
      isRecord(entry) && typeof entry.id === "string" && typeof entry.capturedAt === "string"
  );
}

function validCareers(value: unknown[]): StoredCareerMilestone[] {
  return value.filter(
    (entry): entry is StoredCareerMilestone =>
      isRecord(entry) &&
      typeof entry.id === "string" &&
      typeof entry.unlockedAt === "string" &&
      (entry.selectedAt === undefined || typeof entry.selectedAt === "string") &&
      (entry.masteredAt === undefined || typeof entry.masteredAt === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
