import { formatRelative } from "date-fns/formatRelative";
import { Hono } from "hono";
import { css, cx } from "hono/css";
import { Fragment, memo, Suspense } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { JSDOM } from "jsdom";
import { isErr, parseError, type Result, wrap } from "trynot";
import z from "zod";
import type { HeaderProps } from "../components/header";
import { Layout } from "../components/layout";
import type { GlobalContext } from "../global-context";
import { minifluxToGenericEntry } from "../global-context/miniflux";
import { wallabagToGenericEntry } from "../global-context/wallabag";
import type { GenericEntry } from "../types";

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

categoriesRoute.get(`/saved/entries`, async (c) => {
  const categoryEntries = wrap(
    c.var.ctx.wallabag
      .request("entries", {
        params: { archive: 0 },
        schema: c.var.ctx.wallabag.schemas.entries,
      })
      .then(({ total, _embedded: { items: entries } }) => ({
        total,
        entries: entries.map(wallabagToGenericEntry),
      })),
  );

  return c.render(
    <Layout
      header={{
        nav: [{ name: "saved" }],
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
        <CategoryEntries
          categoryEntries={categoryEntries}
          actions={(entry) => [
            <button
              type="button"
              class={cx("secondary", css`margin-bottom: 0;`)}
              data-on:click={`@delete("/wallabag/entries/${entry.id}")`}
            >
              delete
            </button>,
            <button
              type="button"
              style="margin-bottom: 0;"
              class={entry.isStarred ? "primary" : "secondary"}
              id={`entry-${entry.id}-star`}
              data-on:click={`@post("/wallabag/entries/${entry.id}/${entry.isStarred ? "unstar" : "star"}")`}
            >
              star
            </button>,
            <button
              type="button"
              class={cx("secondary", css`margin-bottom: 0;`)}
              data-on:click={`@post("/wallabag/entries/${entry.id}/read")`}
            >
              read
            </button>,
          ]}
        />
      </Suspense>
    </Layout>,
  );
});

categoriesRoute.get(`/:category{${idAndTitleRegex}}/entries`, async (c) => {
  const category = idAndTitleSchema.parse(c.req.param("category"));
  const feed = idAndTitleSchema.optional().parse(c.req.query("feed"));

  let url = `/categories/${category.id}/entries`;
  if (feed) url = `/feeds/${feed.id}/entries`;

  const categoryEntries = wrap(
    c.var.ctx.miniflux
      .request(url, {
        params: { status: "unread", direction: "desc" },
        schema: c.var.ctx.miniflux.schemas.entries,
      })
      .then(({ total, entries }) => ({
        total,
        entries: entries.map(minifluxToGenericEntry),
      })),
  );

  let nav: NonNullable<HeaderProps["nav"]>;
  if (feed) {
    nav = [
      {
        name: category.title,
        href: `/categories/${category.id}-${category.title}/entries`,
      },
      { name: feed.title },
    ];
  } else {
    nav = [{ name: category.title }];
  }

  return c.render(
    <Layout header={{ nav }} footer={{ promises: [categoryEntries] }}>
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
        <CategoryEntries
          withFeedLinks={!feed}
          categoryEntries={categoryEntries}
          actions={(entry) => [
            <button
              type="button"
              class={cx("secondary", css` margin-bottom: 0;`)}
              data-on:click={`@post("/miniflux/entries/${entry.id}/read")`}
            >
              read
            </button>,
          ]}
        />
      </Suspense>
    </Layout>,
  );
});

const CategoryEntries = async ({
  withFeedLinks = false,
  categoryEntries,
  actions: createActions,
}: {
  withFeedLinks?: boolean;
  categoryEntries: Promise<Result<{ entries: GenericEntry[] }>>;
  actions?: (entry: GenericEntry) => JSX.Element[];
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
      {result.entries.map((entry) => {
        const actions = createActions?.(entry) ?? [];
        return (
          <article id={`entry-${entry.id}`}>
            <hgroup style={{ marginBottom: 0 }}>
              <a
                class={cx("contrast", css`text-decoration: none;`)}
                href={`/categories/${entry.category}/entries/${entry.id}-${encodeURIComponent(entry.title)}`}
              >
                {entry.title}
              </a>
              <div
                class={css`display: flex; align-items: flex-end; justify-content: space-between; gap: calc(var(--pico-spacing) * 0.5); flex-wrap: wrap;`}
              >
                <p class={css`margin: 0;`}>
                  <small>
                    {withFeedLinks ? (
                      <a
                        href={`/categories/${entry.category}/entries?feed=${entry.feedId}-${encodeURIComponent(entry.feed)}`}
                      >
                        {entry.feed}
                      </a>
                    ) : (
                      <Fragment>{entry.feed}</Fragment>
                    )}
                    {entry.publishedAt && " • "}
                    {entry.publishedAt &&
                      formatRelative(entry.publishedAt, new Date())
                        .toLowerCase()
                        .replace(/^last /, "")
                        .replace(/ at.*/, "")}
                  </small>
                </p>
                {actions.length > 0 && (
                  // biome-ignore lint/a11y/useSemanticElements: it's the pico way
                  <div role="group" class={css`margin-left: auto;`}>
                    {actions}
                  </div>
                )}
              </div>
            </hgroup>
          </article>
        );
      })}
    </Fragment>
  );
};

categoriesRoute.get(`/saved/entries/:entry{${idAndTitleRegex}}`, async (c) => {
  const query = idAndTitleSchema.parse(c.req.param("entry"));

  const entry = wrap(
    c.var.ctx.wallabag.request(`/entries/${query.id}`, {
      schema: c.var.ctx.wallabag.schemas.entry,
    }),
  );

  return c.render(
    <Layout
      header={{
        nav: [
          {
            name: "saved",
            href: `/categories/saved/entries`,
          },
          {
            name: query.title,
            class: css`
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `,
          },
        ],
      }}
      footer={{
        promises: [entry],
      }}
    >
      <hgroup>
        <h1>{query.title}</h1>
      </hgroup>
      <Suspense fallback="">
        <Entry entry={entry} />
      </Suspense>
    </Layout>,
  );
});

categoriesRoute.get(
  `/:category{${idAndTitleRegex}}/entries/:entry{${idAndTitleRegex}}`,
  async (c) => {
    const category = idAndTitleSchema.parse(c.req.param("category"));
    const query = idAndTitleSchema.parse(c.req.param("entry"));

    const entry = wrap(
      c.var.ctx.miniflux
        .request(`/entries/${query.id}`, {
          schema: c.var.ctx.miniflux.schemas.entry,
        })
        .then(async (entry) => ({
          content: await sanitizeContent(entry.content, c.var.ctx).catch(
            (error) => {
              return `Failed to sanitize content: ${parseError(error).message}`;
            },
          ),
        })),
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
              name: query.title,
              class: css`
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `,
            },
          ],
        }}
        footer={{
          promises: [entry],
        }}
      >
        <hgroup>
          <h1>{query.title}</h1>
        </hgroup>
        <Suspense fallback="">
          <Entry entry={entry} />
        </Suspense>
      </Layout>,
    );
  },
);

const Entry = memo(
  async (props: {
    entry: Promise<
      Result<{ content: string; url?: string | undefined | null }>
    >;
  }) => {
    const entry = await props.entry;

    if (isErr(entry)) {
      return <Fragment />;
    }

    return (
      <Fragment>
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer">
            original
          </a>
        )}
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
          table table table table table table table {
            margin-bottom: 0;
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
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      </Fragment>
    );
  },
);

async function sanitizeContent(rawContent: string, ctx: GlobalContext) {
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

  for (const [anchorIdx, anchor] of Array.from(
    doc.querySelectorAll("a").entries(),
  )) {
    let firstChild = anchor.firstChild;
    if (firstChild?.nodeValue?.trim() === "") {
      firstChild = firstChild?.nextSibling;
    }
    if (
      firstChild?.nodeName !== "IMG" &&
      (firstChild?.nodeName !== "#text" || firstChild.nodeValue?.trim().length)
    ) {
      try {
        let url = anchor.href;
        if (url.startsWith("https://click.kit-mail6.com")) {
          const base64 = url.split("/").pop();
          if (base64) {
            url = atob(base64);
          }
        } else if (url.startsWith("https://tracking.tldrnewsletter.com")) {
          const match = url.match(/CL0\/([^/]+)/);
          if (match?.[1]) {
            url = decodeURIComponent(match[1]);
          }
        }
        const span = doc.createElement("span");
        span.id = `save-btn-${anchorIdx}`;
        span.classList.add("save-btn");
        span.textContent = "✦";
        span.setAttribute(
          "data-on:click",
          `@post("/wallabag/entries", { payload: { targetId: "${span.id}", url: "${url}" } })`,
        );
        anchor.after(span);
      } catch {}
    }
  }

  for (const element of Array.from(doc.querySelectorAll("td"))) {
    let current: HTMLElement | null = element;
    while (
      current &&
      current.textContent?.trim().length === 0 &&
      current.children.length === 0
    ) {
      const parent: HTMLElement | null = current.parentElement;
      current.remove();
      current = parent;
    }
  }

  const youtubeVideos = Array.from(doc.querySelectorAll("iframe")).flatMap(
    (iframe) => {
      if (!iframe.src.includes("youtube-nocookie.com/embed")) {
        return [];
      }
      const videoId = iframe.src.split("embed/")[1];
      if (!videoId) {
        return [];
      }
      return { iframe, videoId };
    },
  );

  if (youtubeVideos.length > 0) {
    const isAuthenticated = await ctx.youtube.isAuthenticated();
    const ratings = isAuthenticated
      ? await ctx.youtube.client.videos
          .getRating({ id: youtubeVideos.map((video) => video.videoId) })
          .catch(() => undefined)
      : undefined;
    for (const { iframe, videoId } of youtubeVideos) {
      if (!isAuthenticated) {
        const anchor = doc.createElement("a");
        anchor.textContent = "login to like";
        anchor.classList.add("contrast");
        anchor.setAttribute("href", ctx.youtube.generateAuthUrl());
        anchor.setAttribute("role", "button");
        iframe.after(anchor);
        continue;
      }
      const rating = ratings?.data.items?.find(
        (i) => i.videoId === videoId,
      )?.rating;
      const isLiked = rating === "like";
      const button = doc.createElement("button");
      button.id = "button-like";
      button.style.display = "block";
      if (isLiked) {
        button.textContent = "liked";
      } else {
        button.textContent = "like";
        button.classList.add("secondary");
        button.setAttribute(
          "data-on:click",
          `@post("/youtube/like/${videoId}")`,
        );
      }
      iframe.after(button);
    }
  }

  return doc.documentElement.outerHTML;
}
