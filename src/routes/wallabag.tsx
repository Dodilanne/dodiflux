import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
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

  c.header("datastar-mode", "remove");
  c.header("datastar-selector", `#entry-${entryId}`);
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
      class="primary"
      style="margin-bottom: 0;"
      id={`entry-${entryId}-star`}
      data-on:click={`@post("/wallabag/entries/${entryId}/unstar")`}
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
      class="secondary"
      style="margin-bottom: 0;"
      id={`entry-${entryId}-star`}
      data-on:click={`@post("/wallabag/entries/${entryId}/star")`}
    >
      star
    </button>,
  );
});

wallabagRoute.post(
  "/entries",
  zValidator(
    "json",
    z.object({
      targetId: z.string(),
      url: z.string(),
    }),
  ),
  async (c) => {
    const { url, targetId } = c.req.valid("json");

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

    return c.html(
      <span id={targetId} class="save-btn saved">
        ✦
      </span>,
    );
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

  c.header("datastar-mode", "remove");
  c.header("datastar-selector", `#entry-${entryId}`);
  return c.html(<div>ok</div>);
});
