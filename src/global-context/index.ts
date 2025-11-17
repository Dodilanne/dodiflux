import { createMinifluxClient } from "./miniflux";
import { createWallabagClient } from "./wallabag";
import { createYoutubeClient } from "./youtube";

export function createGlobalContext() {
  return {
    miniflux: createMinifluxClient(),
    wallabag: createWallabagClient(),
    youtube: createYoutubeClient(),
  };
}

export type GlobalContext = ReturnType<typeof createGlobalContext>;
