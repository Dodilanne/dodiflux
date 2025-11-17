import { Hono } from "hono";

export const youtubeRoute = new Hono();

youtubeRoute.get("playlists", async (c) => {
  const playlists = await c.var.ctx.youtube.client.playlists.list({
    mine: true,
    part: ["snippet"],
    maxResults: 50,
  });
  return c.json(playlists.data.items?.map((item) => item.snippet?.title));
});
