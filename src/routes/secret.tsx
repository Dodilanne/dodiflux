import { Hono } from "hono";

export const secretRoute = new Hono();

secretRoute.post("/", async (c) => {
  const secret = Number(c.req.query("secret"));
  if (Number.isNaN(secret) || secret < 1 || secret > 10) {
    return c.html(
      <li class="error">
        <p>invalid secret</p>
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
    <div hx-on:htmx-load="setTimeout(() => htmx.remove(document.querySelector('#secret-container')), 500)">
      recorded!
    </div>,
  );
});
