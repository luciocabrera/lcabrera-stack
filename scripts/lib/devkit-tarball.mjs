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
 * Bins whose file does not begin with a shebang.
 *
 * Read statically rather than inferred from a failed run, because the runtime
 * symptom is misleading in both directions. Nothing in the file says what should
 * interpret it, so the kernel hands it to the shell — and `sh` reading a JSDoc
 * header emits a page of `command not found` and exits non-zero, which reads as
 * a gate that ran and found something. It can even match a startup signature by
 * coincidence, when the comment it is echoing happens to name one.
 *
 * Invisible in a workspace, which is why it survived: pnpm links a bin through a
 * wrapper that invokes node explicitly, while npm symlinks the target and relies
 * on the shebang. The failing path is exactly the one no in-repository run takes.
 *
 * Grepping each package's scripts directory for files lacking a leading `#!`
 * names any that regress.
 */
export const binsWithoutShebang = ({ manifest, readPackedFile }) =>
  declaredBins(manifest)
    .filter(({ target }) => !(readPackedFile(target) ?? '').startsWith('#!'))
    .map(
      ({ name, target }) =>
        `${manifest.name}: \`${name}\` (${target}) has no shebang, so an npm install hands it to the shell`,
    );

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
 * Markers that the text came from node itself rather than from a gate's report.
 *
 * Required alongside a signature, because these bins are allowed to TALK about
 * resolution: a publishing gate that finds a package cannot be imported says so
 * in its own words, and matching the words alone would fail the build for a gate
 * doing its job. Node's own failures carry a frame or a bracketed error code.
 */
const NODE_ERROR_MARKERS = ['node:internal/', 'imported from', 'Error ['];

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
  const fromNode = NODE_ERROR_MARKERS.some((marker) => output.includes(marker));
  return signature === undefined || !fromNode
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

/**
 * The line of a command's failure output worth printing.
 *
 * Not the last one, which is the obvious choice and wrong: node's crash output
 * ends with its own version banner, so taking the tail reports `Node.js v26.7.0`
 * as the reason a command failed. The `Error [...]` line is the one naming what
 * happened, and for a resolution failure it also names the module and the file
 * that imported it.
 */
export const failureLine = (output) => {
  const lines = output.split('\n').filter((line) => line.trim() !== '');
  return (
    lines.find((line) => line.trimStart().startsWith('Error')) ??
    lines.at(0) ??
    'no output'
  );
};

/**
 * Why the materialisation did not happen, or undefined when it did.
 *
 * Read from the kit's own record and checked against the tree, because the
 * commands cannot answer it: an empty plan is not an error, so `sync` returns 0
 * having written nothing and the closure probe reports a self-contained set of
 * none. Drop the assets directory from the package's `files` and every step of
 * this gate goes green while the artifact ships no kit at all — the same class
 * of mistake the gate exists for, in the direction that shipping too little
 * rather than too much.
 *
 * Both halves are needed. A record with no entries means nothing was placed; a
 * record naming a file the tree does not hold means the record is describing
 * writes that did not land.
 */
export const materialisationFailure = ({ manifestFiles, presentPaths }) => {
  const recorded = Object.keys(manifestFiles ?? {});
  if (recorded.length === 0) {
    return '`devkit sync` recorded no files — the package carries no assets a consumer would receive';
  }

  const present = new Set(presentPaths);
  const absent = recorded.filter((path) => !present.has(path));
  return absent.length === 0
    ? undefined
    : `\`devkit sync\` recorded ${absent.length} file(s) the tree does not hold, starting with \`${absent.toSorted((left, right) => left.localeCompare(right))[0]}\``;
};

/**
 * Why a distributed package exposes no commands, or undefined when it does.
 *
 * The same vacuous case `materialisationFailure` closes, in the other half: a
 * report that "every declared bin ran" is trivially true of a package that
 * declares none, and the gate would exit 0 having executed nothing.
 *
 * It is reachable rather than theoretical. pnpm substitutes `publishConfig` at
 * pack time and `bin` is one of the fields it substitutes, so an empty or
 * misspelled `publishConfig.bin` empties the packed map while the workspace
 * keeps working — pnpm links its bins from the on-disk manifest. Both of these
 * packages exist to be invoked by name, so none is never correct for them.
 */
export const noCommandsDeclared = (manifest) =>
  declaredBins(manifest).length === 0
    ? `${manifest.name} declares no bins in the packed manifest, so there is nothing for a consumer to run`
    : undefined;

/**
 * Hooks a consumer received without the executable bit.
 *
 * git skips a non-executable hook, and the skip is the failure mode this has to
 * catch: the repository still commits, still exits 0, and the gate the hook was
 * carrying is simply not there. Nothing in a workspace can observe it, because
 * `workspace:*` resolves the source directory where the bit is set — and
 * `pnpm pack` writes every entry 0644, so an installed copy has none.
 *
 * Checked by directory rather than by asking the kit which files it considers
 * executable: a gate that re-derives the answer from the thing it is checking
 * agrees with it by construction. What matters here is only what git will do.
 *
 * The empty case is a finding, not a pass. A run that found no hooks at all
 * checked nothing, and read afterwards as a consumer whose hooks were fine.
 *
 * @param {{ hooksPath: string, materialised: { executable: boolean, path: string }[] }} args
 */
export const inertHooks = ({ hooksPath, materialised }) => {
  const hooks = materialised.filter((file) =>
    file.path.startsWith(`${hooksPath}/`),
  );
  if (hooks.length === 0) {
    return [
      `no hooks were materialised under \`${hooksPath}/\`, so their executability was never checked`,
    ];
  }
  return hooks
    .filter((file) => !file.executable)
    .map(
      (file) =>
        `\`${file.path}\` arrived without the executable bit — git skips it silently, so the gate it carries is absent`,
    );
};
