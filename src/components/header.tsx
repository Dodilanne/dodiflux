import { css } from "hono/css";

export type HeaderProps = {
  nav?: {
    name: string;
    href?: string;
    class?: string | Promise<string>;
  }[];
};

export const Header = ({ nav }: HeaderProps) => {
  return (
    <header
      class={css`
          --pico-nav-link-spacing-vertical: 0rem;
          --pico-nav-element-spacing-vertical: 0rem;
          padding-bottom: var(--pico-block-spacing-vertical);
          display: flex;
        `}
    >
      <img
        src="/static/favicon.png"
        alt="dodiflux"
        class={css`width: 1.5em; height: 1.5em; margin-right: 0.5rem;`}
      />
      <nav aria-label="breadcrumb" class={css`min-width: 0;`}>
        <ul class={css`min-width: 0;`}>
          <li>{nav ? <a href="/">dodiflux</a> : "dodiflux"}</li>
          {nav?.map(({ name, href, class: className }) => (
            <li class={className}>{href ? <a href={href}>{name}</a> : name}</li>
          ))}
        </ul>
      </nav>
    </header>
  );
};
