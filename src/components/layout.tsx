import { css, cx } from "hono/css";
import { Fragment, type PropsWithChildren } from "hono/jsx";
import { Footer, type FooterProps } from "./footer";
import { Header, type HeaderProps } from "./header";
import { Secret } from "./secret";

export const Layout = ({
  children,
  header = {},
  footer = {},
  secret = false,
}: PropsWithChildren<{
  header?: HeaderProps;
  footer?: FooterProps;
  secret?: boolean;
}>) => {
  return (
    <Fragment>
      <main class={cx("container", css`height: 100%; padding-bottom: 0;`)}>
        <Header {...header} />
        {children}
        <Footer {...footer} />
      </main>
      {secret && <Secret />}
    </Fragment>
  );
};
