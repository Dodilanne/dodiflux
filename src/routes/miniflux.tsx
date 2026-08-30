import { Hono } from "hono";
import { isErr, wrap } from "trynot";

export const minifluxRoute = new Hono();

minifluxRoute.post("/entries/:entryId/read", async (c) => {
  const entryId = Number(c.req.param("entryId"));

  const result = await wrap(
    c.var.ctx.miniflux.request("entries", {
      method: "PUT",
      body: {
        entry_ids: [entryId],
        status: "read",
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
