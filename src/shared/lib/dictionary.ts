const validationCache = new Map<string, boolean>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function validateEnglishWord(word: string): Promise<boolean> {
  const normalized = word.trim().toLowerCase();
  if (!/^[a-z]+$/.test(normalized)) {
    return false;
  }

  const cached = validationCache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
      { next: { revalidate: 604_800 } },
    );

    if (response.status === 404) {
      validationCache.set(normalized, false);
      return false;
    }

    if (response.ok) {
      validationCache.set(normalized, true);
      return true;
    }

    if (response.status === 429 || response.status >= 500) {
      await sleep(250 * (attempt + 1));
      continue;
    }

    return false;
  }

  return false;
}

export function clearDictionaryCache(): void {
  validationCache.clear();
}
