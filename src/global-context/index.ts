import { createMinifluxClient } from "./miniflux";
import { createWallabagClient } from "./wallabag";

export function createGlobalContext() {
  return {
    miniflux: createMinifluxClient(),
    wallabag: createWallabagClient(),
  };
}

export type GlobalContext = ReturnType<typeof createGlobalContext>;
