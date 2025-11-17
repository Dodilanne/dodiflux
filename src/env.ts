import z from "zod";

export const $env = z
  .object({
    WALLABAG_API_URL: z.string(),
    WALLABAG_CLIENT_ID: z.string(),
    WALLABAG_CLIENT_SECRET: z.string(),
    WALLABAG_USERNAME: z.string(),
    WALLABAG_PASSWORD: z.string(),
    MINIFLUX_API_URL: z.string(),
    MINIFLUX_API_KEY: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_OAUTH_REDIRECT: z.string(),
  })
  .parse(Bun.env);
