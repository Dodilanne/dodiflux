import type { Context } from "hono";

export const ErrorAlert = ({ error }: { error: Error }) => {
  return (
    <li class="error">
      <p>{error.message}</p>
      <button
        type="button"
        arial-label="Close"
        onclick="this.closest('li').remove()"
      />
    </li>
  );
};

export function errorAlert(c: Context, error: Error) {
  c.header("datastar-mode", "append");
  c.header("datastar-selector", "#alerts ol");
  return c.html(<ErrorAlert error={error} />);
}
