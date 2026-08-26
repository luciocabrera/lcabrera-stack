/**
 * Build-time switch (Vite folds `import.meta.env.VITE_API_URL`); setting it at serve time
 * against a bundle built without it does nothing. Empty counts as unset, matching
 * `getApiBaseUrl`'s truthiness check.
 *
 * Re-derive which way a given bundle folded (#708):
 *
 * `grep -n -A2 '^var isExternalApiEnabled' apps/showcase/build/server/index.js`
 *
 * The `^` is load-bearing: the bundler preserves this comment, including the command, so
 * dropping the anchor matches the documentation before the code.
 */
export const isExternalApiEnabled = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl !== undefined && externalApiUrl !== '';
};
