import { Hono } from "hono";
import { isErr, wrap } from "trynot";

export const secretRoute = new Hono();

secretRoute.post("/", async (c) => {
  const value = Number(c.req.query("value"));
  if (Number.isNaN(value) || value < 1 || value > 10) {
    return c.html(<ErrorAlert>{new Error("invalid secret")}</ErrorAlert>, 500);
  }

  const db = c.var.ctx.db;
  const result = await wrap(db.client.insert(db.records).values({ value }));
  if (isErr(result)) {
    return c.html(<ErrorAlert>{result}</ErrorAlert>, 500);
  }

  return c.html(
    <div hx-on:htmx-load="setTimeout(() => htmx.remove(document.querySelector('#secret-container')), 500)">
      recorded!
    </div>,
  );
});

const ErrorAlert = ({ children }: { children: Error }) => {
  return (
    <li class="error">
      <p>{children.message}</p>
      <button
        type="button"
        arial-label="Close"
        onclick="this.closest('li').remove()"
      />
    </li>
  );
};
