/**
 * Deciding whether a packed tarball is one a consumer could actually use.
 *
 * The failure this guards is narrow and quiet: a bin, an export or an asset that
 * resolves from the workspace and is absent from the tarball. Everything in this
 * repository consumes these packages as `workspace:*`, which resolves the source
 * directory and ignores `files` entirely — so the whole `files` list is exercised
 * by nothing here, and a wrong one is invisible until someone installs the
 * package. `@lcabrera/devkit` shipped its entire test suite that way until a pack
 * showed it.
 *
 * Pure: callers hand in manifests and file lists. The packing, installing and
 * executing live in the CLI.
 *
 * npm always includes the files in `ALWAYS_PACKED` regardless of `files`, so
 * their absence is a real fault rather than a packaging choice.
 */

const ALWAYS_PACKED = ['package.json'];

const stripLeadingDot = (path) => path.replace(/^\.\//, '');

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

export const missingFromTarball = ({ manifest, packedPaths }) => {
  const packed = new Set(packedPaths.map(stripLeadingDot));
  return promisedPaths(manifest).filter(
    (path) => !path.includes('*') && !packed.has(path),
  );
};

export const strayFromTarball = (packedPaths) =>
  packedPaths.filter(
    (path) =>
      /(^|\/)[^/]*\.test\.[cm]?[jt]s$/.test(path) ||
      /(^|\/)(eslint\.config|vite\.config)\./.test(path) ||
      /(^|\/)tsconfig(\.\w+)?\.json$/.test(path),
  );

export const declaredBins = (manifest) =>
  Object.entries(manifest.bin ?? {}).map(([name, target]) => ({
    name,
    target: stripLeadingDot(target),
  }));

export const binsWithoutShebang = ({ manifest, readPackedFile }) =>
  declaredBins(manifest)
    .filter(({ target }) => !(readPackedFile(target) ?? '').startsWith('#!'))
    .map(
      ({ name, target }) =>
        `${manifest.name}: \`${name}\` (${target}) has no shebang, so an npm install hands it to the shell`,
    );

const STARTUP_FAILURES = [
  'ERR_MODULE_NOT_FOUND',
  'Cannot find module',
  'Cannot find package',
  'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
  'ERR_UNKNOWN_FILE_EXTENSION',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
];

const NODE_ERROR_MARKERS = ['node:internal/', 'imported from', 'Error ['];

export const binStartupFailure = ({ name, output, spawned }) => {
  if (!spawned) return `\`${name}\` is declared but did not execute at all`;

  const signature = STARTUP_FAILURES.find((marker) => output.includes(marker));
  const fromNode = NODE_ERROR_MARKERS.some((marker) => output.includes(marker));
  return signature === undefined || !fromNode
    ? undefined
    : `\`${name}\` started and could not resolve its own code (${signature})`;
};

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

export const failureLine = (output) => {
  const lines = output.split('\n').filter((line) => line.trim() !== '');
  return (
    lines.find((line) => line.trimStart().startsWith('Error')) ??
    lines.at(0) ??
    'no output'
  );
};

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
 * Whether a packed manifest that declares bins says which Node they need.
 *
 * A bin is executed by the consumer's Node straight out of `node_modules/.bin`,
 * with none of this repository's toolchain in front of it, so the runtime it was
 * written for is a precondition an installer can act on and prose cannot
 * (ADR-110). Without `engines.node` the first sign of a mismatch is the bin
 * failing after it is already installed.
 *
 * The packed manifest is what is read, not the workspace one: `files` and
 * `publishConfig` differ between them, and only the packed one reaches an
 * installer.
 *
 * A package declaring no bins is not asked, because nothing of it is executed.
 *
 * @param {{ bin?: Record<string, string>, engines?: { node?: string }, name: string }} manifest
 */
export const binsWithoutNodeFloor = (manifest) =>
  declaredBins(manifest).length === 0 || manifest.engines?.node !== undefined
    ? []
    : [
        `${manifest.name} declares ${declaredBins(manifest).length} bin(s) and no \`engines.node\` in the packed manifest, so nothing holds a consumer to the Node they were written for`,
      ];

export const noCommandsDeclared = (manifest) =>
  declaredBins(manifest).length === 0
    ? `${manifest.name} declares no bins in the packed manifest, so there is nothing for a consumer to run`
    : undefined;

/**
 * Whether `init` left the consumer with gate tasks they can actually run.
 *
 * Two failures, and the first is the one this kit keeps shipping: `init`
 * reporting that it added tasks over a manifest it wrote none into. The count is
 * asserted rather than printed, because "13 task(s) added" and "0 task(s) added"
 * are the same clean exit otherwise.
 *
 * The second is a task naming a binary that is not there. That is what a
 * consumer meets as `command not found` on their first run, and it is invisible
 * from any workspace, where every binary resolves whether or not the package
 * declaring it was installed.
 *
 * @param {{ availableBins: Iterable<string>, scripts?: Record<string, string> }} args
 */
export const taskFindings = ({ availableBins, scripts = {} }) => {
  const known = new Set(availableBins);
  const written = Object.entries(scripts).filter(([, command]) =>
    known.has(command.split(' ')[0]),
  );
  if (written.length === 0) {
    return [
      '`devkit init` left no runnable gate task in the consumer manifest, so nothing it set up can be invoked',
    ];
  }
  return Object.entries(scripts)
    .filter(([, command]) => !known.has(command.split(' ')[0]))
    .map(
      ([name, command]) =>
        `task \`${name}\` runs \`${command}\`, and no such binary was installed`,
    );
};

/**
 * Whether the tasks that should run bare are present, and what running them
 * found.
 *
 * "Runnable" was previously read as "the binary resolves", and that is not the
 * same claim: `configs:verify` resolved perfectly and exited 1 on a fresh
 * repository, because its gate refuses a roster nobody has written yet. The
 * count said 13 wired while one of them could not run — the same overstated
 * success this gate keeps having to close.
 *
 * The expected list is held here rather than read from the kit, so that a task
 * quietly disappearing from `init` is a finding instead of a smaller check. The
 * absent half is checked first for exactly that reason.
 *
 * @param {{ expected: string[], failures: { name: string, detail: string }[],
 *           scripts?: Record<string, string> }} args
 */
export const bareTaskFindings = ({ expected, failures, scripts = {} }) => [
  ...expected
    .filter((name) => !Object.hasOwn(scripts, name))
    .map(
      (name) =>
        `\`devkit init\` wrote no \`${name}\` task, so this gate no longer runs it`,
    ),
  ...failures.map(
    ({ detail, name }) =>
      `task \`${name}\` is wired but does not run on a freshly initialised repository: ${detail}`,
  ),
];

/**
 * Blocks of the shared config that a re-init destroyed.
 *
 * `devkit.config.json` is one file read by both distributed packages — devkit
 * takes `commands`, `paths` and `profile`, the gate runtime takes `conventions`,
 * `registers`, `gates` and `publishing`. A command that writes a freshly-built
 * object over it does not rewrite its own part; it deletes everyone else's, and
 * `--force` is documented for exactly the repository most likely to have
 * customised them.
 *
 * The empty case is a finding for the usual reason: comparing a config that was
 * never customised proves nothing and reads afterwards as a config that
 * survived.
 *
 * @param {{ after: object, before: object }} args
 */
export const clobberedConfigKeys = ({ after, before }) => {
  const owned = new Set(['commands', 'profile']);
  const checked = Object.keys(before).filter((key) => !owned.has(key));
  if (checked.length === 0) {
    return [
      'the scratch config carried no block for `devkit init --force` to preserve, so nothing about it was checked',
    ];
  }
  return checked
    .filter((key) => !Object.hasOwn(after, key))
    .map(
      (key) =>
        `\`devkit init --force\` deleted \`${key}\` from devkit.config.json — that file is shared with the gate runtime, which reads it`,
    );
};

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

/**
 * What running a gate bin inside the consumer proved.
 *
 * A bin that resolves and exits 0 on a fresh repository has shown it can load
 * its own modules from the install, and nothing else: a gate that reads no
 * file passes exactly like one that read every file. So the same bin is run
 * again over a planted violation, and only a failure that names the planted
 * file counts as the gate having run.
 *
 * @param {{ clean: { output: string, spawned: boolean, status: number | null },
 *           name: string, planted: { output: string, status: number | null },
 *           plantedFile: string }} args
 */
export const gateProbeFindings = ({ clean, name, planted, plantedFile }) => {
  if (!clean.spawned) {
    return [
      `\`${name}\` is not installed in the consumer, so no gate ran through it`,
    ];
  }
  if (clean.status !== 0) {
    return [
      `\`${name}\` failed on a clean consumer: ${failureLine(clean.output)}`,
    ];
  }
  if (planted.status === 0 || !planted.output.includes(plantedFile)) {
    return [
      `\`${name}\` passed a planted violation in \`${plantedFile}\`, so its run proved nothing`,
    ];
  }
  return [];
};
