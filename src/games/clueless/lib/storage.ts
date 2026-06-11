import type { SavedCluelessSession } from "@/games/clueless/lib/types";
import { createGameStorage } from "@/shared/lib/storage";

export const cluelessStorage =
  createGameStorage<SavedCluelessSession>("clueless");
