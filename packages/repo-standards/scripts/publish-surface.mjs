/**
 * Pure helpers for the published-surface gate (verify-publish-surface.mjs).
 *
 * Separated from the CLI so the mapping rules can be unit-tested without
 * touching the filesystem — `test:scripts` covers this file. The CLI keeps the
 * effects: reading manifests, checking `dist`, writing `package.json`.
 */

/**
 * A package is in scope when it is published publicly AND builds.
 *
 * Derived rather than listed, so adding a `build` script to a public package
 * enrols it automatically. A package may omit `build` on purpose — one whose
 * identity is tied to its source path (StyleX themes are the case this was
 * written for) ships source and is gated by its own workspace check instead.
 */
export const isBuiltPublicPackage = (manifest) =>
  manifest.scripts?.build !== undefined &&
  manifest.publishConfig?.access === 'public';

export const toBuiltPaths = (sourceTarget) => {
  const built = sourceTarget
    .replace(/^\.\/src\//, './dist/')
    .replace(/\.(?:tsx?|mts|mjs|js)$/, '');
  return { types: `${built}.d.mts`, default: `${built}.mjs` };
};

export const diffSubpaths = ({ published, source }) => ({
  extra: published.filter((subpath) => !source.includes(subpath)),
  missing: source.filter((subpath) => !published.includes(subpath)),
});

export const isPublishedTargetCorrect = ({ published, sourceTarget }) => {
  const expected = toBuiltPaths(sourceTarget);
  return (
    published?.default === expected.default &&
    published?.types === expected.types
  );
};

export const buildPublishExports = (exports_) =>
  Object.fromEntries(
    Object.entries(exports_ ?? {}).map(([subpath, sourceTarget]) => [
      subpath,
      toBuiltPaths(sourceTarget),
    ]),
  );

export const collectTargets = (target) => {
  if (typeof target === 'string') {
    return [target];
  }
  if (target === null || typeof target !== 'object') {
    return [];
  }
  return Object.values(target).flatMap((value) => collectTargets(value));
};

const toTarballPath = (target) =>
  target.startsWith('./') ? target.slice(2) : target;

export const isSourceTarget = (target) =>
  target.startsWith('./src/') ||
  target.endsWith('.ts') ||
  target.endsWith('.tsx');

const targetProblems = ({ files, label, subpath, target }) => {
  const problems = collectTargets(target)
    .filter(isSourceTarget)
    .map(
      (path) =>
        `${label}: the packed tarball exports \`${subpath}\` as ${path} — a TypeScript source file, which Node refuses to load from node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). Only \`publishConfig.exports\` swaps src for dist, and only pnpm applies it.`,
    );
  const absent = collectTargets(target)
    .filter((path) => !isSourceTarget(path) && !path.includes('*'))
    .filter((path) => !files.includes(toTarballPath(path)))
    .map(
      (path) =>
        `${label}: the packed tarball exports \`${subpath}\` as ${path}, which is not in the tarball — \`files\` does not ship it, or the build did not produce it.`,
    );
  return [...problems, ...absent];
};

export const packedSurfaceProblems = ({
  files,
  label,
  packedExports,
  sourceExports,
}) => {
  const { extra, missing } = diffSubpaths({
    published: Object.keys(packedExports ?? {}),
    source: Object.keys(sourceExports ?? {}),
  });
  return [
    ...missing.map(
      (subpath) =>
        `${label}: \`${subpath}\` is in \`exports\` but absent from the packed tarball's \`exports\` — a consumer could not import it. Run with --write.`,
    ),
    ...extra.map(
      (subpath) =>
        `${label}: the packed tarball exports \`${subpath}\`, which \`exports\` no longer has — it was renamed or removed. Run with --write.`,
    ),
    ...Object.entries(packedExports ?? {}).flatMap(([subpath, target]) =>
      targetProblems({ files, label, subpath, target }),
    ),
  ];
};
