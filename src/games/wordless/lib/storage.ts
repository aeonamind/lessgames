import { createGameStorage } from "@/shared/lib/storage";
import type { SavedWordlessGame } from "./types";

export const wordlessStorage =
  createGameStorage<SavedWordlessGame>("wordless");
