import { up } from "up-fetch";
import z from "zod";
import { $env } from "../env";
import type { GenericEntry } from "../types";

export const wallabagEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  domain_name: z.string(),
  content: z.string(),
  is_starred: z.coerce.boolean(),
  url: z.string().nullish(),
});

export const wallabagSchemas = {
  entries: z.object({
    total: z.number(),
    _embedded: z.object({
      items: z.array(wallabagEntrySchema),
    }),
  }),
  entry: wallabagEntrySchema,
};

export function wallabagToGenericEntry(
  entry: z.infer<typeof wallabagEntrySchema>,
): GenericEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: "saved",
    feed: entry.domain_name,
    content: entry.content,
    publishedAt: undefined,
    isStarred: entry.is_starred,
  };
}

export function createWallabagClient() {
  const auth = createWallabagAuthClient();
  return {
    request: up(fetch, async () => {
      return {
        baseUrl: `${$env.WALLABAG_API_URL}/api`,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${await auth.getAccessToken()}`,
        },
      };
    }),
    schemas: wallabagSchemas,
  };
}

function createWallabagAuthClient() {
  const stateSchema = z
    .object({
      access_token: z.string(),
      expires_in: z.coerce.number(),
      refresh_token: z.string(),
    })
    .transform((state) => {
      return {
        accessToken: state.access_token,
        refreshToken: state.refresh_token,
        expiresAt: Date.now() + 10 * 1000,
      };
    });

  const authRequest = up(fetch, () => {
    return {
      baseUrl: `${$env.WALLABAG_API_URL}/oauth/v2/token`,
      headers: { "content-type": "application/json" },
    };
  });

  const credentials = {
    client_id: $env.WALLABAG_CLIENT_ID,
    client_secret: $env.WALLABAG_CLIENT_SECRET,
  };

  let state: z.infer<typeof stateSchema> | undefined;

  return {
    getAccessToken: async () => {
      if (!state) {
        state = await authRequest("", {
          method: "POST",
          schema: stateSchema,
          body: {
            ...credentials,
            grant_type: "password",
            username: $env.WALLABAG_USERNAME,
            password: $env.WALLABAG_PASSWORD,
          },
        });
      }
      if (state.expiresAt < Date.now()) {
        state = await authRequest("", {
          method: "POST",
          schema: stateSchema,
          body: {
            ...credentials,
            grant_type: "refresh_token",
            refresh_token: state.refreshToken,
          },
        });
      }
      return state.accessToken;
    },
  };
}
