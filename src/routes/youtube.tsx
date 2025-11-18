import { Hono } from "hono";
import { isErr, wrap } from "trynot";

export const youtubeRoute = new Hono();

youtubeRoute.get("playlists", async (c) => {
  const playlists = await c.var.ctx.youtube.client.playlists.list({
    mine: true,
    part: ["snippet"],
    maxResults: 50,
  });
  return c.json(playlists.data.items?.map((item) => item.snippet?.title));
});

youtubeRoute.post("like/:videoId", async (c) => {
  const videoId = c.req.param("videoId");
  const res = await wrap(
    c.var.ctx.youtube.client.videos.rate({
      id: videoId,
      rating: "like",
    }),
  );
  if (isErr(res)) {
    console.log("res", res);
    return c.text(res.message, 500);
  }
  return c.html(
    <button type="button" style="display: block; margin-bottom: 0;">
      liked
    </button>,
  );
});
