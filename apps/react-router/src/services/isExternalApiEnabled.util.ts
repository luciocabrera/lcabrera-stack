/**
 * Whether this app should read its table pages from an external API server
 * rather than serving them itself.
 *
 * Self-hosting is the default: every table route reads Postgres through its own
 * `.server` service and its own resource route, so the showcase renders with
 * nothing running but the database (#687). Setting `VITE_API_URL` opts back
 * into the cross-process path — the same routes, fetched from the API host —
 * which is what `vp run dev:external-api` exercises.
 *
 * The value is read per call rather than captured at module scope. Vite
 * substitutes `import.meta.env.VITE_API_URL` at build time, so a captured copy
 * would pin the branch for the whole process and leave the override with no
 * test that could tell the two paths apart.
 */
export const isExternalApiEnabled = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl !== undefined && externalApiUrl !== '';
};
