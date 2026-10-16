export const versionLabel = (version: unknown) =>
  version === undefined ? 'missing' : JSON.stringify(version);
