import { createEmptySave, parseSave, type StoredGameStateV3 } from "@codigdex/game-core/save/schema";
import { SAVE_STORAGE_KEYS, type SaveStorage } from "@codigdex/game-core/save/storage";

export interface AsyncStringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const readableKeys = [SAVE_STORAGE_KEYS.current, SAVE_STORAGE_KEYS.previous, SAVE_STORAGE_KEYS.legacy] as const;

export function createAsyncSaveStorage(storage: AsyncStringStorage): SaveStorage {
  return {
    async load() {
      for (const key of readableKeys) {
        let raw: string | null;
        try {
          raw = await storage.getItem(key);
        } catch {
          return createEmptySave();
        }
        const save = raw ? parseSave(raw) : undefined;
        if (!save) continue;
        if (key !== SAVE_STORAGE_KEYS.current) {
          await storage.setItem(SAVE_STORAGE_KEYS.current, JSON.stringify(save)).catch(() => undefined);
        }
        return save;
      }
      return createEmptySave();
    },
    async save(value: StoredGameStateV3) {
      await storage.setItem(SAVE_STORAGE_KEYS.current, JSON.stringify(value));
    },
    async clear() {
      await Promise.all(readableKeys.map((key) => storage.removeItem(key)));
    },
  };
}
