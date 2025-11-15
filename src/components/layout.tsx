import { Fragment, type PropsWithChildren } from "hono/jsx";
import { Footer, type FooterProps } from "./footer";
import { Header, type HeaderProps } from "./header";

export const Layout = ({
  children,
  header = {},
  footer = {},
}: PropsWithChildren<{ header?: HeaderProps; footer?: FooterProps }>) => {
  return (
    <Fragment>
      <Header {...header} />
      <main class="container">{children}</main>
      <Footer {...footer} />
    </Fragment>
  );
};
