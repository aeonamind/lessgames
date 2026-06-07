import {
  DAILY_RESET_HOUR,
  GAME_TIMEZONE_OFFSET_HOURS,
} from "@/shared/config/site";

const GMT7_OFFSET_MS = GAME_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
const RESET_OFFSET_MS = DAILY_RESET_HOUR * 60 * 60 * 1000;

/** Game day key — rolls over at 03:00 GMT+7 */
export function getGameDay(now = new Date()): string {
  const shifted = new Date(now.getTime() + GMT7_OFFSET_MS - RESET_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Deterministic daily pick — salt keeps each game on a different schedule */
export function getDailyIndex(
  gameDay: string,
  poolSize: number,
  salt: string,
): number {
  return hashString(`${salt}:${gameDay}`) % poolSize;
}

export function getDailyItem<T>(items: T[], salt: string, now = new Date()): T {
  const day = getGameDay(now);
  return items[getDailyIndex(day, items.length, salt)];
}

/** Milliseconds until the next shuffle at 03:00 GMT+7 */
export function getMsUntilNextShuffle(now = new Date()): number {
  const shifted = new Date(now.getTime() + GMT7_OFFSET_MS - RESET_OFFSET_MS);
  const dayStartShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  const nextShuffle =
    dayStartShifted + 24 * 60 * 60 * 1000 - GMT7_OFFSET_MS + RESET_OFFSET_MS;
  return Math.max(0, nextShuffle - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
