import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { css, cx } from "hono/css";
import { isErr, wrap } from "trynot";
import z from "zod";

export const wallabagRoute = new Hono();

wallabagRoute.post("/entries/:entryId/read", async (c) => {
  const entryId = Number(c.req.param("entryId"));

  const result = await wrap(
    c.var.ctx.wallabag.request(`entries/${entryId}`, {
      method: "PATCH",
      body: {
        archive: 1,
      },
    }),
  );

  if (isErr(result)) {
    return c.html(
      <li class="error">
        <p>{result.message}</p>
        <button
          type="button"
          arial-label="Close"
          onclick="this.closest('li').remove()"
        />
      </li>,
      500,
    );
  }

  return c.html(<div>ok</div>);
});

wallabagRoute.post("/entries/:entryId/star", async (c) => {
  const entryId = Number(c.req.param("entryId"));

  const result = await wrap(
    c.var.ctx.wallabag.request(`entries/${entryId}`, {
      method: "PATCH",
      body: {
        starred: 1,
      },
    }),
  );

  if (isErr(result)) {
    return c.html(
      <li class="error">
        <p>{result.message}</p>
        <button
          type="button"
          arial-label="Close"
          onclick="this.closest('li').remove()"
        />
      </li>,
      500,
    );
  }

  return c.html(
    <button
      type="button"
      class={cx("primary", css`margin-bottom: 0;`)}
      hx-post={`/wallabag/entries/${entryId}/unstar`}
      hx-swap="outerHTML"
    >
      star
    </button>,
  );
});

wallabagRoute.post("/entries/:entryId/unstar", async (c) => {
  const entryId = Number(c.req.param("entryId"));

  const result = await wrap(
    c.var.ctx.wallabag.request(`entries/${entryId}`, {
      method: "PATCH",
      body: {
        starred: 0,
      },
    }),
  );

  if (isErr(result)) {
    return c.html(
      <li class="error">
        <p>{result.message}</p>
        <button
          type="button"
          arial-label="Close"
          onclick="this.closest('li').remove()"
        />
      </li>,
      500,
    );
  }

  return c.html(
    <button
      type="button"
      class={cx("secondary", css`margin-bottom: 0;`)}
      hx-post={`/wallabag/entries/${entryId}/star`}
      hx-swap="outerHTML"
    >
      star
    </button>,
  );
});

wallabagRoute.post(
  "/entries",
  zValidator("form", z.object({ url: z.string() })),
  async (c) => {
    const { url } = c.req.valid("form");

    const result = await wrap(
      c.var.ctx.wallabag.request("entries", {
        method: "POST",
        body: {
          url,
        },
      }),
    );

    if (isErr(result)) {
      return c.html(
        <li class="error">
          <p>{result.message}</p>
          <button
            type="button"
            arial-label="Close"
            onclick="this.closest('li').remove()"
          />
        </li>,
        500,
      );
    }

    return c.html(<span class="save-btn saved">✦</span>);
  },
);

wallabagRoute.delete("/entries/:entryId", async (c) => {
  const entryId = Number(c.req.param("entryId"));

  const result = await wrap(
    c.var.ctx.wallabag.request(`entries/${entryId}`, {
      method: "DELETE",
    }),
  );

  if (isErr(result)) {
    return c.html(
      <li class="error">
        <p>{result.message}</p>
        <button
          type="button"
          arial-label="Close"
          onclick="this.closest('li').remove()"
        />
      </li>,
      500,
    );
  }

  return c.html(<div>ok</div>);
});
