import { Hono } from "hono";
import { isErr, wrap } from "trynot";

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

  console.log("result", result);

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
