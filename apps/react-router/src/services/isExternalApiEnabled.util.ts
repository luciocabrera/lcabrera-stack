/**
 * Whether this app should read its table pages from an external API server
 * rather than serving them itself.
 *
 * Self-hosting is the default: every table route reads Postgres through its own
 * `.server` service and its own resource route, so the showcase renders with
 * nothing running but the database (#687). `VITE_API_URL` opts back into the
 * cross-process path — the same routes, fetched from the API host.
 *
 * This decides **whether** the external path is taken. **Where** it goes is
 * `@lcabrera/api`'s `getApiBaseUrl`, which since #705 ranks `VITE_API_URL`
 * above the SSR `requestUrl` — so the loader and the browser resolve the same
 * host, and this app no longer inverts that order for itself.
 *
 * **An empty value counts as unset, and that is what keeps the two questions in
 * agreement.** A shell exporting the variable bare would otherwise switch every
 * route to the external branch, which `getApiBaseUrl` would then resolve
 * against something that is not external at all — its own check is a
 * truthiness one, so `''` falls through to the derived host. Both sides must
 * treat a bare variable as no override or the branch and the origin disagree.
 *
 * **This is a build-time switch, not a runtime one**, and the difference is the
 * trap. Vite substitutes `import.meta.env.VITE_API_URL` when the bundle is
 * produced, so a production build folds this whole function to a constant and
 * eliminates the losing branch. Setting the variable for `react-router-serve`
 * against a bundle that was built without it therefore does nothing at all —
 * silently, because the self-hosted path still works. The variable has to be
 * set **for the build**. In dev there is no prebuilt bundle, so exporting it
 * before `react-router dev` is enough — which is what `vp run dev:external-api`
 * does.
 *
 * Reading per call rather than capturing at module scope is what keeps the two
 * paths distinguishable **in dev and under test**, where `import.meta.env` is
 * evaluated live and `vi.stubEnv` can move it between assertions. In a build
 * that reasoning does not apply: both spellings fold to the same constant, and
 * the per-call form simply costs nothing.
 *
 * Re-derive which way a given bundle folded (#708):
 *
 * `grep -n -A2 '^var isExternalApiEnabled' apps/react-router/build/server/index.js`
 *
 * Both halves of that are load-bearing. **The path is repo-root-relative**,
 * which is where the surrounding docs tell you to run everything; the bare
 * `build/server/index.js` the earlier form named does not exist from there.
 * **The `^` anchor is what makes it a probe rather than an echo**: the bundler
 * preserves this comment verbatim into the output, including the line you are
 * reading, so dropping the anchor matches the documentation before it matches
 * the code — and would report the same first line whichever way the fold went.
 *
 * Byte-identical to the copy in `docs/data-sources.md`, deliberately: the same
 * command written two ways is one of them being wrong.
 */
export const isExternalApiEnabled = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl !== undefined && externalApiUrl !== '';
};
