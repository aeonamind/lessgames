/** Datamuse returns metadata in tags — there is no API param to filter by frequency or POS. */

export type DatamuseEntry = {
  word: string;
  tags?: string[];
};

const ALLOWED_POS = new Set(["n", "v", "adj"]);

export function parseFrequency(tags: string[] | undefined): number | null {
  const tag = tags?.find((entry) => entry.startsWith("f:"));
  if (!tag) return null;
  const value = Number(tag.slice(2));
  return Number.isFinite(value) ? value : null;
}

export function parsePartsOfSpeech(tags: string[] | undefined): string[] {
  if (!tags) return [];

  return tags.filter(
    (tag) =>
      tag !== "query" &&
      !tag.startsWith("f:") &&
      !tag.startsWith("pron:"),
  );
}

/** Daily answers must be a noun, verb, or adjective — not adverb-only. */
export function hasAllowedPartOfSpeech(tags: string[] | undefined): boolean {
  const parts = parsePartsOfSpeech(tags);
  return parts.some((part) => ALLOWED_POS.has(part));
}

export function isAlphaWord(word: string, minLength: number, maxLength: number): boolean {
  return (
    word.length >= minLength &&
    word.length <= maxLength &&
    /^[a-zA-Z]+$/.test(word)
  );
}
