import { Hono } from "hono";
import { css, cx } from "hono/css";
import { Fragment, Suspense } from "hono/jsx";
import { isErr, type Result, wrap } from "trynot";
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

  const entries = wrap(
    c.var.ctx.wallabag.request("entries", {
      params: { archive: 0 },
      schema: c.var.ctx.wallabag.schemas.entries,
    }),
  );

  return c.render(
    <Layout footer={{ promises: [categories, entries] }}>
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
      {/* <Suspense fallback={<article>saved</article>}> */}
      {/*   <Saved entries={entries} /> */}
      {/* </Suspense> */}
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

const _Saved = async (props: {
  entries: Promise<Result<z.infer<typeof wallabagSchemas.entries>>>;
}) => {
  const entries = await props.entries;

  if (isErr(entries)) {
    return <Fragment />;
  }

  return (
    <article
      class={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      <a class={cx("contrast", css`text-decoration: none;`)} href="/saved">
        <span>saved</span>
      </a>
      <span>{entries.total}</span>
    </article>
  );
};
