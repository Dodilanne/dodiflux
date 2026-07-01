import { css, cx } from "hono/css";

export const Secret = () => {
  return (
    <div
      id="secret-container"
      class={cx(
        "container",
        css`padding: var(--pico-block-spacing-vertical) 0;`,
      )}
    >
      <div
        id="secret"
        class={css`display: flex; gap: calc(var(--pico-spacing) / 3); justify-content: flex-end; font-family: monospace;`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <button
            type="button"
            key={i}
            class={cx("outline", css`margin-bottom: 0;`)}
            hx-post={`/secret?secret=${i}`}
            hx-target="#secret"
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
