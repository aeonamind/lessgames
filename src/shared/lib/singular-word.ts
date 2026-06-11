/** Word ends with "s" but is unlikely to be a plural noun (glass, bus, crisis). */
export function hasPluralSurfaceForm(word: string): boolean {
  const w = word.toLowerCase();
  if (!w.endsWith("s") || w.length < 4) return false;
  if (/(?:ss|us|is|ous|ness|less)$/i.test(w)) return false;
  return true;
}

export function singularCandidates(word: string): string[] {
  const w = word.toLowerCase();
  const candidates: string[] = [];

  if (w.endsWith("ies") && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}y`);
  }
  if (w.endsWith("ves") && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}f`, `${w.slice(0, -3)}fe`);
  }
  if (w.endsWith("es") && w.length > 4) {
    candidates.push(w.slice(0, -2), w.slice(0, -1));
  }
  if (w.endsWith("s")) {
    candidates.push(w.slice(0, -1));
  }

  return [...new Set(candidates)].filter(
    (candidate) => candidate.length >= 2 && candidate !== w,
  );
}

/** True when the word is not an obvious plural of another valid English word. */
export async function isSingularWord(
  word: string,
  isValidWord: (candidate: string) => Promise<boolean>,
): Promise<boolean> {
  if (!hasPluralSurfaceForm(word)) return true;

  for (const candidate of singularCandidates(word)) {
    if (await isValidWord(candidate)) {
      return false;
    }
  }

  return true;
}
