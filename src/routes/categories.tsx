import { formatRelative } from "date-fns/formatRelative";
import { Hono } from "hono";
import { css, cx } from "hono/css";
import { Fragment, memo, Suspense } from "hono/jsx";
import { JSDOM } from "jsdom";
import { isErr, type Result, wrap } from "trynot";
import z from "zod";
import { Layout } from "../components/layout";
import type { minifluxSchemas } from "../global-context/miniflux";

export const categoriesRoute = new Hono();

const idAndTitleRegex = "([0-9]+)-(.+)";
const idAndTitleSchema = z
  .string()
  .transform((str) => str.split("-"))
  .pipe(
    z.array(z.string()).transform(([id, ...titleChunks]) => ({
      id: Number(id),
      title: titleChunks.join("-"),
    })),
  );

categoriesRoute.get(`/:category{${idAndTitleRegex}}/entries`, async (c) => {
  const category = idAndTitleSchema.parse(c.req.param("category"));

  const categoryEntries = wrap(
    c.var.ctx.miniflux.request(`/categories/${category.id}/entries`, {
      params: { status: "unread", direction: "desc" },
      schema: c.var.ctx.miniflux.schemas.entries,
    }),
  );

  return c.render(
    <Layout
      header={{
        nav: [{ name: category.title }],
      }}
      footer={{
        promises: [categoryEntries],
      }}
    >
      <Suspense
        fallback={
          <Fragment>
            {Array.from({ length: 4 }, () => (
              <article class={css`color: transparent;`}>
                <hgroup style={{ marginBottom: 0 }}>
                  entry
                  <p>
                    <small class={css`color: transparent;`}>feed</small>
                  </p>
                </hgroup>
              </article>
            ))}
          </Fragment>
        }
      >
        <CategoryEntries categoryEntries={categoryEntries} />
      </Suspense>
    </Layout>,
  );
});

const CategoryEntries = async ({
  categoryEntries,
}: {
  categoryEntries: Promise<Result<z.infer<typeof minifluxSchemas.entries>>>;
}) => {
  const result = await categoryEntries;

  if (isErr(result)) {
    return <Fragment />;
  }

  if (result.entries.length === 0) {
    return (
      <article class={css`color: var(--pico-muted-color)`}>No entries</article>
    );
  }

  return (
    <Fragment>
      {result.entries.map((entry) => (
        <article>
          <hgroup style={{ marginBottom: 0 }}>
            <a
              class={cx("contrast", css`text-decoration: none;`)}
              href={`/categories/${entry.feed.category.id}-${entry.feed.category.title}/entries/${entry.id}-${encodeURIComponent(entry.title)}`}
            >
              {entry.title}
            </a>
            <div
              class={css`display: flex; align-items: flex-end; justify-content: space-between; gap: calc(var(--pico-spacing) * 0.5); flex-wrap: wrap;`}
            >
              <p class={css`margin: 0;`}>
                <small>
                  {entry.feed.title} •{" "}
                  {formatRelative(entry.published_at, new Date())
                    .toLowerCase()
                    .replace(/^last /, "")
                    .replace(/ at.*/, "")}
                </small>
              </p>
              <button
                type="button"
                class={cx(
                  "secondary",
                  css`margin-left: auto; margin-bottom: 0;`,
                )}
                hx-post={`/miniflux/entries/${entry.id}/read`}
                hx-target="closest article"
                hx-swap="delete"
              >
                read
              </button>
            </div>
          </hgroup>
        </article>
      ))}
    </Fragment>
  );
};

categoriesRoute.get(
  `/:category{${idAndTitleRegex}}/entries/:entry{${idAndTitleRegex}}`,
  async (c) => {
    const category = idAndTitleSchema.parse(c.req.param("category"));
    const entry = idAndTitleSchema.parse(c.req.param("entry"));

    const content = wrap(
      c.var.ctx.miniflux
        .request(`/entries/${entry.id}`, {
          schema: c.var.ctx.miniflux.schemas.entry,
        })
        .then((entry) => sanitizeContent(entry.content)),
    );

    return c.render(
      <Layout
        header={{
          nav: [
            {
              name: category.title,
              href: `/categories/${category.id}-${category.title}/entries`,
            },
            {
              name: entry.title,
              class: css`
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `,
            },
          ],
        }}
        footer={{
          promises: [content],
        }}
      >
        <hgroup>
          <h1>{entry.title}</h1>
        </hgroup>
        <Suspense fallback="">
          <Entry content={content} />
        </Suspense>
      </Layout>,
    );
  },
);

const Entry = memo(async (props: { content: Promise<Result<string>> }) => {
  const content = await props.content;

  if (isErr(content)) {
    return <Fragment />;
  }

  return (
    <section
      class={css`
          td {
            padding: 0;
          }
          img[src="https://bytes.dev/images/bytes-icon.png"] {
            display: none;
          }
          img {
            max-width: 280px;
          }
          code {
            white-space: pre-wrap;
            word-break: break-word;
          }
          iframe {
            width: 100%;
            height: 100%;
            aspect-ratio: 16 / 9;
            max-width: 700px;
            margin-bottom: 1rem;
          }
          table {
            table,
            tr,
            td,
            th {
              border: none;
            }
          }
          .save-btn {
            padding: 0.5rem;
            cursor: pointer;
            color: var(--pico-secondary);

            &:hover {
              color: var(--pico-secondary-hover);
            }

            &:active,
            &:focus-within {
              color: var(--pico-secondary-focus);
            }

            &.saved {
              color: var(--pico-primary);

              &:hover {
                color: var(--pico-primary-hover);
              }

              &:active,
              &:focus-within {
                color: var(--pico-primary-focus);
              }
            }
          }
        `}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});

function sanitizeContent(rawContent: string) {
  const content = rawContent
    .replace(/\u034F/g, "") // Remove combining grapheme joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/<table><\/table>/g, "") // Remove empty tables
    .replace(/<a/g, "<a class='contrast'")
    .trim();
  const doc = new JSDOM(content).window.document;
  for (const img of Array.from(doc.querySelectorAll("img"))) {
    if (
      img.src.includes("braze-images.com/appboy/communication") ||
      img.height === 1 ||
      img.width === 1
    ) {
      img.remove();
    }
    if (
      img.src ===
      "https://d387o4essw7gm1.cloudfront.net/cdn/FIVE/10452/qvhuoXrYTqe4TLWMRseh_symboles.png"
    ) {
      img.closest("td")?.closest("td")?.remove();
    }
  }

  for (const anchor of Array.from(doc.querySelectorAll("a"))) {
    let firstChild = anchor.firstChild;
    if (firstChild?.nodeValue?.trim() === "") {
      firstChild = firstChild?.nextSibling;
    }
    if (
      firstChild?.nodeName !== "IMG" &&
      (firstChild?.nodeName !== "#text" || firstChild.nodeValue?.trim().length)
    ) {
      const span = doc.createElement("span");
      span.classList.add("save-btn");
      span.textContent = "✦";
      anchor.after(span);
    }
  }

  for (const iframe of Array.from(doc.querySelectorAll("iframe"))) {
    if (iframe.src.includes("youtube-nocookie.com/embed")) {
      const videoId = iframe.src.split("embed/")[1];
      if (!videoId) {
        continue;
      }
      const button = doc.createElement("button");
      button.textContent = "like";
      button.classList.add("secondary");
      button.style.display = "block";
      button.setAttribute("hx-post", `/youtube/like/${videoId}`);
      button.setAttribute("hx-swap", "outerHTML");
      iframe.after(button);
    }
  }

  return doc.documentElement.outerHTML;
}
