import { Hono } from "hono";
import { css, cx } from "hono/css";
import { Fragment, Suspense } from "hono/jsx";
import { isErr, isOk, type Result, wrap } from "trynot";
import type z from "zod";
import { Layout } from "../components/layout";
import type { minifluxSchemas } from "../global-context/miniflux";
import type { wallabagSchemas } from "../global-context/wallabag";

export const homeRoute = new Hono();

homeRoute.get("/", (c) => {
  const categories = wrap(
    c.var.ctx.miniflux.request("categories", {
      params: { counts: true },
      schema: c.var.ctx.miniflux.schemas.category.array(),
    }),
  );

  const saved = wrap(
    c.var.ctx.wallabag.request("entries", {
      params: { archive: 0 },
      schema: c.var.ctx.wallabag.schemas.entries,
    }),
  );

  c.var.ctx.wallabag
    .request("entries", {
      params: { archive: 0 },
    })
    .then((res) => Bun.write("saved.json", JSON.stringify(res)))
    .catch(console.error);

  return c.render(
    <Layout footer={{ promises: [categories, saved] }}>
      <Suspense
        fallback={
          <Fragment>
            {["news", "podcast", "tech", "youtube"].map((category) => (
              <article>{category}</article>
            ))}
          </Fragment>
        }
      >
        <Categories categories={categories} />
      </Suspense>
      <Suspense fallback={<article>saved</article>}>
        <Saved saved={saved} />
      </Suspense>
    </Layout>,
  );
});

const Categories = async (props: {
  categories: Promise<Result<z.infer<typeof minifluxSchemas.category>[]>>;
}) => {
  const categories = await props.categories;

  if (isErr(categories)) {
    return <Fragment />;
  }

  return (
    <Fragment>
      {categories.map((category) => (
        <article
          class={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <a
            class={cx("contrast", css`text-decoration: none;`)}
            href={`/categories/${category.id}-${category.title}/entries`}
          >
            <span>{category.title}</span>
          </a>
          <span>{category.total_unread}</span>
        </article>
      ))}
    </Fragment>
  );
};

const Saved = async (props: {
  saved: Promise<Result<z.infer<typeof wallabagSchemas.entries>>>;
}) => {
  const saved = await props.saved;

  return (
    <article
      class={css`
            display: flex;
            justify-content: space-between;
          `}
    >
      <a
        class={cx("contrast", css`text-decoration: none;`)}
        href="/categories/saved/entries"
      >
        <span>saved</span>
      </a>
      <span>{isOk(saved) ? saved.total : -1}</span>
    </article>
  );
};
