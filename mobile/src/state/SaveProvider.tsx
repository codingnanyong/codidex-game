import type { Locale } from "@codigdex/game-core/i18n/locale";
import { createEmptySave, type StoredGameStateV3 } from "@codigdex/game-core/save/schema";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { mobileSaveStorage } from "@/storage/asyncStorage";

interface SaveContextValue {
  capture(monsterId: string): void;
  clearProgress(): void;
  hydrated: boolean;
  locale: Locale;
  save: StoredGameStateV3;
  setLocale(locale: Locale): void;
}

const SaveContext = createContext<SaveContextValue | undefined>(undefined);

export function SaveProvider({ children }: PropsWithChildren) {
  const [save, setSave] = useState<StoredGameStateV3>(() => createEmptySave("ko"));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void mobileSaveStorage.load().then((stored) => {
      if (!active) return;
      setSave(stored);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  const update = (produce: (current: StoredGameStateV3) => StoredGameStateV3) => {
    setSave((current) => {
      const next = produce(current);
      void mobileSaveStorage.save(next).catch(() => undefined);
      return next;
    });
  };

  const value = useMemo<SaveContextValue>(() => ({
    capture(monsterId) {
      update((current) => current.progress.captures.some(({ id }) => id === monsterId)
        ? current
        : {
            ...current,
            progress: {
              ...current.progress,
              captures: [...current.progress.captures, { id: monsterId, capturedAt: new Date().toISOString() }],
            },
          });
    },
    clearProgress() {
      const empty = createEmptySave(save.ui.locale ?? "ko");
      setSave(empty);
      void mobileSaveStorage.save(empty).catch(() => undefined);
    },
    hydrated,
    locale: save.ui.locale ?? "ko",
    save,
    setLocale(locale) {
      update((current) => ({ ...current, ui: { ...current.ui, locale } }));
    },
  }), [hydrated, save]);

  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>;
}

export function useSave(): SaveContextValue {
  const value = useContext(SaveContext);
  if (!value) throw new Error("useSave must be rendered inside SaveProvider");
  return value;
}
