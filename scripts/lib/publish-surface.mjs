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
 * A `src` entry is not always TypeScript: `@lcabrera/vite-config` ships its
 * ESLint flat configs as `.mjs`, because flat config is JavaScript. tsdown
 * builds those too (with `allowJs`, so their declarations are emitted), and
 * strips the extension the same way — so the rule is "drop the source
 * extension", not "drop `.ts`". Getting that wrong produced `x.mjs.d.mts`,
 * which resolves for nobody.
 *
 * Key order matters on the way out: Node matches export conditions in the order
 * they are written, so `types` must come first or a resolver can take `default`
 * and never look for the declarations. `--write` serialises this object straight
 * into the manifest, so the order here is the order that ships.
 */
export const toBuiltPaths = (sourceTarget) => {
  const built = sourceTarget
    .replace(/^\.\/src\//, './dist/')
    .replace(/\.(?:tsx?|mts|mjs|js)$/, '');
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

/** Every file path an export entry can resolve to, conditions flattened. */
export const collectTargets = (target) => {
  if (typeof target === 'string') {
    return [target];
  }
  if (target === null || typeof target !== 'object') {
    return [];
  }
  return Object.values(target).flatMap((value) => collectTargets(value));
};

/** The path a `./`-relative export target has inside the tarball. */
const toTarballPath = (target) =>
  target.startsWith('./') ? target.slice(2) : target;

/**
 * True for a target a consumer cannot load out of `node_modules`: Node refuses
 * to strip types there, so a `.ts` file is unreachable however present it is
 * (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). This is the exact state the
 * `publishConfig.exports` swap exists to prevent, and the state an
 * `npm pack`-produced tarball is in, since the swap is a pnpm extension.
 */
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

/**
 * What is wrong with the artifact itself: the manifest and file list read back
 * out of the tarball, checked against the subpaths the source manifest
 * promises. Pure, so the rules are unit-tested without packing anything.
 */
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
