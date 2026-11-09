/**
 * The query string a browser builds when it submits a form with method GET, read from the form's own entries.
 */

export const getFormQuery = (form: HTMLFormElement) =>
  new URLSearchParams(
    [...new FormData(form)].map(([name, value]) => [
      name,
      typeof value === 'string' ? value : value.name,
    ]),
  ).toString();
