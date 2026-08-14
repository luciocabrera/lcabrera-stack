/**
 * The external API origin this app was built to talk to, or `undefined` when it
 * was not — the single read of `VITE_API_URL` in the app.
 *
 * An empty value counts as unset: a shell that exports the variable without one
 * would otherwise select the external path and then resolve every request
 * against an origin of `''`, producing a same-origin request that looks like
 * the override worked.
 *
 * It is a build-time value. Vite substitutes `import.meta.env.VITE_API_URL`
 * when the bundle is produced, so this folds to a literal in a build — see
 * `isExternalApiEnabled` for what that means for a running deployment.
 */
export const readExternalApiUrl = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl === undefined || externalApiUrl === ''
    ? undefined
    : externalApiUrl;
};
