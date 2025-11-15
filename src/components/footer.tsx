import { type PropsWithChildren, Suspense } from "hono/jsx";
import { isErr, type Result } from "trynot";

export type FooterProps = PropsWithChildren<AlertsProps>;

export const Footer = ({ children, promises }: FooterProps) => {
  return (
    <footer>
      {children}
      <Suspense fallback="">
        <Alerts promises={promises} />
      </Suspense>
    </footer>
  );
};

export type AlertsProps = {
  promises?: Promise<Result<unknown>>[];
};

const Alerts = async ({ promises }: AlertsProps) => {
  const results = promises ? await Promise.all(promises) : [];
  return (
    <article id="alerts" class="alert-container">
      <ol>
        {results.map(
          (result) =>
            isErr(result) && (
              <li class="error">
                <p>{result.message}</p>
                <button
                  type="button"
                  aria-label="Close"
                  onclick="this.closest('li').remove()"
                />
              </li>
            ),
        )}
      </ol>
    </article>
  );
};
