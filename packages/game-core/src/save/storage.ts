import type { StoredGameStateV3 } from "./schema";

export const SAVE_STORAGE_KEYS = {
  current: "codigdex:save:v3",
  previous: "codigdex:save:v2",
  legacy: "codigdex:save:v1",
} as const;

export interface SaveStorage {
  load(): Promise<StoredGameStateV3>;
  save(value: StoredGameStateV3): Promise<void>;
  clear(): Promise<void>;
}
