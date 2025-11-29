import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Fragment } from "hono/jsx";
import { jsxRenderer } from "hono/jsx-renderer";
import { Shell } from "./components/shell";
import { createGlobalContext, type GlobalContext } from "./global-context";
import { categoriesRoute } from "./routes/categories";
import { homeRoute } from "./routes/home";
import { minifluxRoute } from "./routes/miniflux";
import { wallabagRoute } from "./routes/wallabag";
import { youtubeRoute } from "./routes/youtube";

declare module "hono" {
  interface ContextVariableMap {
    ctx: GlobalContext;
  }
}

export const app = new Hono();

const globalContext = createGlobalContext();

app.use("*", async (c, next) => {
  c.set("ctx", globalContext);
  await next();
});

app.get("/google/oauth/redirect", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.text("Invalid code", 400);
  }
  const ctx = c.get("ctx");
  await ctx.youtube.authenticate({ code });
  return c.redirect("/");
});

app.use(
  "/static/htmx.js",
  serveStatic({
    path: "./node_modules/htmx.org/dist/htmx.min.js",
  }),
);

app.use(
  "/static/*",
  serveStatic({
    root: "./",
  }),
);

app.get(
  "*",
  jsxRenderer(
    ({ children }, c) => {
      const isBoosted = c.req.header("hx-boosted") === "true";
      const Container = isBoosted ? Fragment : Shell;
      return <Container>{children}</Container>;
    },
    {
      stream: true,
    },
  ),
);

app.route("/", homeRoute);
app.route("/categories", categoriesRoute);
app.route("/miniflux", minifluxRoute);
app.route("/wallabag", wallabagRoute);
app.route("/youtube", youtubeRoute);

export default {
  port: 3001,
  hostname: "0.0.0.0", // Bind to all interfaces
  fetch: app.fetch,
};
