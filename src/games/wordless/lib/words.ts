import answers from "@/games/wordless/data/answers.json";
import validWords from "@/games/wordless/data/valid.json";

const answerSet = new Set(answers as string[]);
const validSet = new Set(validWords as string[]);

export const ANSWERS = answers as string[];
export const VALID_WORDS = validWords as string[];

export function isValidGuess(word: string): boolean {
  return validSet.has(word.toUpperCase());
}

export function isAnswerWord(word: string): boolean {
  return answerSet.has(word.toUpperCase());
}
