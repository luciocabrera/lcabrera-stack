/**
 * Deciding whether a packed tarball is one a consumer could actually use.
 *
 * The failure this guards is narrow and quiet: a bin, an export or an asset that
 * resolves from the workspace and is absent from the tarball. Everything in this
 * repository consumes these packages as `workspace:*`, which resolves the source
 * directory and ignores `files` entirely — so the whole `files` list is exercised
 * by nothing here, and a wrong one is invisible until someone installs the
 * package. `@repo/devkit` shipped its entire test suite that way until a pack
 * showed it.
 *
 * Pure: callers hand in manifests and file lists. The packing, installing and
 * executing live in the CLI.
 */

/** npm always includes these regardless of `files`, so their absence is a real fault. */
const ALWAYS_PACKED = ['package.json'];

const stripLeadingDot = (path) => path.replace(/^\.\//, '');

/** Every path a manifest promises: its bins, its exports, and the entry points. */
export const promisedPaths = (manifest) => [
  ...new Set(
    [
      ...Object.values(manifest.bin ?? {}),
      ...Object.values(manifest.exports ?? {}).flatMap((target) =>
        typeof target === 'string'
          ? [target]
          : Object.values(target).filter((value) => typeof value === 'string'),
      ),
      ...ALWAYS_PACKED,
    ].map(stripLeadingDot),
  ),
];

/**
 * What the manifest promises and the tarball does not hold.
 *
 * A wildcard target is left alone: `exports` may name `./scripts/*`, which is a
 * pattern rather than a file, and reporting it as missing would be a finding
 * about the check rather than about the package.
 */
export const missingFromTarball = ({ manifest, packedPaths }) => {
  const packed = new Set(packedPaths.map(stripLeadingDot));
  return promisedPaths(manifest).filter(
    (path) => !path.includes('*') && !packed.has(path),
  );
};

/**
 * Paths a tarball holds that no consumer should receive.
 *
 * Tests are the ones that actually shipped. They are not merely noise: they
 * import fixtures and dev-only modules, so a consumer's tooling can be led into
 * resolving things the package never declared.
 */
export const strayFromTarball = (packedPaths) =>
  packedPaths.filter(
    (path) =>
      /(^|\/)[^/]*\.test\.[cm]?[jt]s$/.test(path) ||
      /(^|\/)(eslint\.config|vite\.config)\./.test(path) ||
      /(^|\/)tsconfig(\.\w+)?\.json$/.test(path),
  );

/**
 * Every bin a manifest declares, as `{ name, target }`, so the CLI can execute
 * each one by name rather than by guessing at a directory listing.
 */
export const declaredBins = (manifest) =>
  Object.entries(manifest.bin ?? {}).map(([name, target]) => ({
    name,
    target: stripLeadingDot(target),
  }));

/**
 * Signatures of a bin that could not START, as opposed to one that ran and
 * reported a finding.
 *
 * The distinction is the whole difficulty. These bins are gates: exiting
 * non-zero is them answering, not failing, so "did it exit 0" is the wrong
 * question. What must be caught is the bin whose own file, or a module it
 * imports, did not make it into the tarball — and that surfaces as a resolution
 * error on stderr, which a naive check reads as "it produced output, so it ran".
 */
const STARTUP_FAILURES = [
  'ERR_MODULE_NOT_FOUND',
  'Cannot find module',
  'Cannot find package',
  'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
  'ERR_UNKNOWN_FILE_EXTENSION',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
];

/**
 * Why a bin is unusable, or undefined when it ran.
 *
 * `spawned` is false when the executable itself was not there — the bin was
 * declared and never packed, which produces no output at all and would otherwise
 * be indistinguishable from a silent success.
 */
export const binStartupFailure = ({ name, output, spawned }) => {
  if (!spawned) return `\`${name}\` is declared but did not execute at all`;

  const signature = STARTUP_FAILURES.find((marker) => output.includes(marker));
  return signature === undefined
    ? undefined
    : `\`${name}\` started and could not resolve its own code (${signature})`;
};

/**
 * A one-line verdict per package, ordered so the report reads the same on every
 * run regardless of how the filesystem enumerated anything.
 */
export const tarballFindings = ({ manifest, packedPaths }) => {
  const missing = missingFromTarball({ manifest, packedPaths });
  const stray = strayFromTarball(packedPaths);

  return [
    ...missing
      .toSorted((left, right) => left.localeCompare(right))
      .map((path) => ({
        detail: `${manifest.name} promises \`${path}\` and the tarball does not hold it`,
        kind: 'missing',
      })),
    ...stray
      .toSorted((left, right) => left.localeCompare(right))
      .map((path) => ({
        detail: `${manifest.name} ships \`${path}\`, which no consumer should receive`,
        kind: 'stray',
      })),
  ];
};
