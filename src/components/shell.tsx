import { css, Style } from "hono/css";
import type { PropsWithChildren } from "hono/jsx";

export const Shell = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en" class={css`height: 100%;`}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta
          name="htmx-config"
          content='{
            "responseHandling":[
              {"code": "[23]..", "swap": true},
              {"code": "[45]..", "swap": true, "error": true, "target": "#alerts ol", "swapOverride": "beforeend"}
            ]
          }'
        />
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="icon" href="/static/favicon.png" />
        <Style>
          {css`
          :root {
            --pico-font-family: Georgia, 'Times New Roman', Times, serif;
          }
        `}
        </Style>
        <title>dodiflux</title>
      </head>
      <body class={css`height: 100%;`}>
        {children}
        <script src="/static/datastar.min.js" defer />
        <script src="/static/htmx.min.js" defer />
      </body>
    </html>
  );
};
