/**
 * Pure helpers for the published-surface gate (scripts/verify-publish-surface.mjs).
 *
 * Separated from the CLI so the mapping rules can be unit-tested without
 * touching the filesystem — `test:scripts` covers this file. The CLI keeps the
 * effects: reading manifests, checking `dist`, writing `package.json`.
 */

/**
 * A package is in scope when it is published publicly AND builds.
 *
 * Derived rather than listed, so adding a `build` script to a public package
 * enrols it automatically. `packages/ui` has no `build` script on purpose — its
 * StyleX theme identity is tied to the source path, so it ships source and is
 * gated by its own `check:public-api` instead.
 */
export const isBuiltPublicPackage = (manifest) =>
  manifest.scripts?.build !== undefined &&
  manifest.publishConfig?.access === 'public';

/**
 * Maps a source export target onto what the tarball must expose.
 *
 * tsdown emits ESM as `.mjs` with declarations beside it as `.d.mts`, and
 * `unbundle` keeps the `src` tree shape, so this is a pure path rewrite.
 *
 * Key order matters on the way out: Node matches export conditions in the order
 * they are written, so `types` must come first or a resolver can take `default`
 * and never look for the declarations. `--write` serialises this object straight
 * into the manifest, so the order here is the order that ships.
 */
export const toBuiltPaths = (sourceTarget) => {
  const built = sourceTarget
    .replace(/^\.\/src\//, './dist/')
    .replace(/\.tsx?$/, '');
  return { types: `${built}.d.mts`, default: `${built}.mjs` };
};

/** Subpaths in one map but not the other, in both directions. */
export const diffSubpaths = ({ published, source }) => ({
  extra: published.filter((subpath) => !source.includes(subpath)),
  missing: source.filter((subpath) => !published.includes(subpath)),
});

/** True when a published entry already matches what `toBuiltPaths` demands. */
export const isPublishedTargetCorrect = ({ published, sourceTarget }) => {
  const expected = toBuiltPaths(sourceTarget);
  return (
    published?.default === expected.default &&
    published?.types === expected.types
  );
};

/** Rebuilds `publishConfig.exports` from `exports`, preserving key order. */
export const buildPublishExports = (exports_) =>
  Object.fromEntries(
    Object.entries(exports_ ?? {}).map(([subpath, sourceTarget]) => [
      subpath,
      toBuiltPaths(sourceTarget),
    ]),
  );
