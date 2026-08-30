import { css, cx } from "hono/css";
import { Fragment, type PropsWithChildren } from "hono/jsx";
import { Footer, type FooterProps } from "./footer";
import { Header, type HeaderProps } from "./header";

export const Layout = ({
  children,
  header = {},
  footer = {},
}: PropsWithChildren<{
  header?: HeaderProps;
  footer?: FooterProps;
}>) => {
  return (
    <Fragment>
      <main class={cx("container", css`height: 100%; padding-bottom: 0;`)}>
        <Header {...header} />
        {children}
        <Footer {...footer} />
      </main>
    </Fragment>
  );
};
