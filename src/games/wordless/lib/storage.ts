import { createGameStorage } from "@/shared/lib/storage";
import type { SavedWordlessSession } from "./types";

export const wordlessStorage =
  createGameStorage<SavedWordlessSession>("wordless");
