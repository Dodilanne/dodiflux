import { up } from "up-fetch";
import z from "zod";
import { $env } from "../env";
import type { GenericEntry } from "../types";

const minifluxEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  published_at: z.string(),
  content: z.string(),
  feed: z.object({
    id: z.number(),
    title: z.string(),
    category: z.object({
      id: z.number(),
      user_id: z.number(),
      title: z.string(),
    }),
  }),
});

export const minifluxSchemas = {
  category: z.object({
    title: z.string(),
    user_id: z.number(),
    id: z.number(),
    hide_globally: z.boolean(),
    feed_count: z.number(),
    total_unread: z.number(),
  }),
  entries: z.object({
    total: z.number(),
    entries: z.array(minifluxEntrySchema),
  }),
  entry: minifluxEntrySchema,
};

export function createMinifluxClient() {
  return {
    request: up(fetch, () => ({
      baseUrl: $env.MINIFLUX_API_URL,
      headers: {
        "content-type": "application/json",
        "x-auth-token": $env.MINIFLUX_API_KEY,
      },
    })),
    schemas: minifluxSchemas,
  };
}

export function minifluxToGenericEntry(
  entry: z.infer<typeof minifluxEntrySchema>,
): GenericEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: `${entry.feed.category.id}-${entry.feed.category.title}`,
    feed: entry.feed.title,
    feedId: entry.feed.id,
    publishedAt: entry.published_at,
    content: entry.content,
    isStarred: false,
  };
}
