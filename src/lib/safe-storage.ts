const memory = new Map<string, string>();
let preferMemory = false;

function migrateLocalStorageToMemory() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) memory.set(key, value);
      }
    }
  } catch {
    // ignore
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (preferMemory) {
      return memory.get(key) ?? null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      preferMemory = true;
      migrateLocalStorageToMemory();
      return memory.get(key) ?? null;
    }
  },

  setItem(key: string, value: string) {
    if (preferMemory) {
      memory.set(key, value);
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
      preferMemory = true;
      migrateLocalStorageToMemory();
      memory.set(key, value);
    }
  },

  removeItem(key: string) {
    memory.delete(key);
    if (preferMemory) return;

    try {
      localStorage.removeItem(key);
    } catch {
      preferMemory = true;
    }
  },
};

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // HTTP on a LAN IP is not a secure context — fall through.
    }
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function storageErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Photo is too large to save in demo mode. Try a smaller photo or connect Supabase for production.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not save bike. Please try again.";
}
