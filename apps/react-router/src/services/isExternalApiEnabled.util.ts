/**
 * Build-time switch (Vite folds `import.meta.env.VITE_API_URL`); setting it at serve time
 * against a bundle built without it does nothing.
 * Empty counts as unset, matching `getApiBaseUrl`'s truthiness check.
 */
export const isExternalApiEnabled = () => {
  const externalApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  return externalApiUrl !== undefined && externalApiUrl !== '';
};
