const STORAGE_PREFIX = "lessgames";

export interface GameStorage<T> {
  load: () => T | null;
  save: (data: T) => void;
  clear: () => void;
}

export function createGameStorage<T>(gameId: string): GameStorage<T> {
  const key = `${STORAGE_PREFIX}:${gameId}`;

  return {
    load(): T | null {
      if (typeof window === "undefined") return null;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    save(data: T): void {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, JSON.stringify(data));
    },

    clear(): void {
      if (typeof window === "undefined") return;
      localStorage.removeItem(key);
    },
  };
}
