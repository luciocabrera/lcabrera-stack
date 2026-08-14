/**
 * Whether this app should read its table pages from an external API server
 * rather than serving them itself.
 *
 * Self-hosting is the default: every table route reads Postgres through its own
 * `.server` service and its own resource route, so the showcase renders with
 * nothing running but the database (#687). `VITE_API_URL` opts back into the
 * cross-process path — the same routes, fetched from the API host.
 *
 * **This is a build-time switch, not a runtime one**, and the difference is the
 * trap. Vite substitutes `import.meta.env.VITE_API_URL` when the bundle is
 * produced, so a production build folds this whole function to `return false;`
 * or `return true;` and the losing branch is eliminated. Setting the variable
 * for `react-router-serve` against a bundle that was built without it therefore
 * does nothing at all — silently, because the self-hosted path still works. The
 * variable has to be set **for the build**. In dev there is no prebuilt bundle,
 * so exporting it before `react-router dev` is enough — which is what
 * `vp run dev:external-api` does.
 *
 * Reading per call rather than capturing at module scope is what keeps the two
 * paths distinguishable **in dev and under test**, where `import.meta.env` is
 * evaluated live and `vi.stubEnv` can move it between assertions. In a build
 * that reasoning does not apply: both spellings fold to the same constant, and
 * the per-call form simply costs nothing.
 *
 * Re-derive which way a given bundle folded:
 * `grep -A2 'isExternalApiEnabled = () => {' build/server/index.js`.
 */
export const isExternalApiEnabled = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl !== undefined && externalApiUrl !== '';
};
