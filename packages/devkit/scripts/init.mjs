/*
 * The decisions `devkit init` makes, with no filesystem in them.
 *
 * Why a separate module: `init` is the one command that runs when nothing is
 * set up yet, so it is also the one with the least to check its work against.
 * Keeping the judgement here — what to refuse, what to infer, which tasks to
 * write, and when the run failed — means every branch is reachable from a test
 * that passes it literal values, rather than only from a real empty repository.
 *
 * The effects live in `command-init.mjs`.
 */

/**
 * A repository that already holds a config was initialised before, and the
 * second run is the dangerous one: it would overwrite a consumer's command map
 * and their chosen profile with inferred guesses. Refusing is not caution for
 * its own sake — `sync` is the command for an already-initialised repository,
 * and it is the one that knows how to leave local edits alone.
 *
 * Not being a git repository is refused for a different reason: the manifest
 * and the acceptance record are tracked files, and the hooks the `full` profile
 * places are only ever run by git. Materialising them outside a repository
 * produces a directory that looks set up and is inert.
 *
 * @param {{ configExists: boolean, force?: boolean, isGitRepository: boolean,
 *           manifestExists: boolean }} args
 * @returns {string | undefined} the refusal, or `undefined` to proceed
 */
export const initRefusal = ({
  configExists,
  force = false,
  isGitRepository,
  manifestExists,
}) => {
  if (!isGitRepository) {
    return 'init: not a git repository — run `git init` first, or run init in the repository root.';
  }
  if (force) return undefined;
  if (configExists) {
    return 'init: devkit.config.json is already here — this repository is initialised. Run `devkit sync` to materialise, or pass --force to rewrite the config.';
  }
  if (manifestExists) {
    return 'init: a devkit manifest is already here — this repository is initialised. Run `devkit sync` to materialise, or pass --force to start over.';
  }
  return undefined;
};

/**
 * How a consumer's toolchain spells the four things a shipped workflow or hook
 * asks for. Ordered most specific first: a repository on Vite+ also has a pnpm
 * lockfile, and answering `pnpm install` there would work while ignoring the
 * runner the repository actually uses.
 *
 * `npm` is last and matches unconditionally, because every repository with a
 * manifest can run it. That is inference, not a default — the summary names
 * what was inferred so a consumer can correct a wrong guess, and a wrong guess
 * cannot pass silently: a command that resolves to nothing leaves the files
 * that need it unwritten, which `init` treats as a failed run.
 */
const RUNNERS = [
  {
    commands: {
      audit: 'vp run deps:audit',
      check: 'vp check',
      install: 'vp install',
      test: 'vp run test',
    },
    detect: ({ dependencies }) => dependencies.has('vite-plus'),
    name: 'vite-plus',
  },
  {
    commands: {
      audit: 'pnpm audit --audit-level moderate',
      check: 'pnpm run check',
      install: 'pnpm install --frozen-lockfile',
      test: 'pnpm run test',
    },
    detect: ({ files }) =>
      files.has('pnpm-lock.yaml') || files.has('pnpm-workspace.yaml'),
    name: 'pnpm',
  },
  {
    commands: {
      audit: 'yarn npm audit --severity moderate',
      check: 'yarn run check',
      install: 'yarn install --immutable',
      test: 'yarn run test',
    },
    detect: ({ files }) => files.has('yarn.lock'),
    name: 'yarn',
  },
  {
    commands: {
      audit: 'bun audit',
      check: 'bun run check',
      install: 'bun install --frozen-lockfile',
      test: 'bun test',
    },
    detect: ({ files }) => files.has('bun.lockb') || files.has('bun.lock'),
    name: 'bun',
  },
  {
    commands: {
      audit: 'npm audit --audit-level moderate',
      check: 'npm run check',
      install: 'npm ci',
      test: 'npm test',
    },
    detect: () => true,
    name: 'npm',
  },
];

/**
 * Both spellings of a dependency, because either one puts a bin on the path and
 * a runner is just as declared in one as in the other.
 *
 * Here rather than beside the manifest read it serves, so that the branches —
 * an absent manifest, an absent block, either block alone — are reachable from
 * a test that passes literal objects.
 */
export const declaredDependencies = (manifest) => [
  ...Object.keys(manifest?.dependencies ?? {}),
  ...Object.keys(manifest?.devDependencies ?? {}),
];

/**
 * @param {{ dependencies?: Iterable<string>, files?: Iterable<string> }} args
 * @returns {{ commands: Record<string, string>, name: string }}
 */
export const inferRunner = ({ dependencies = [], files = [] } = {}) => {
  const context = {
    dependencies: new Set(dependencies),
    files: new Set(files),
  };
  const runner = RUNNERS.find((candidate) => candidate.detect(context));
  return { commands: { ...runner.commands }, name: runner.name };
};

/**
 * The config `init` writes.
 *
 * The path layout is left out on purpose: every key in it already has a
 * default, and writing the defaults back out as if they were choices turns a
 * later change to one of them into a silent no-op for every repository init
 * ever touched.
 *
 * `conventions.defaultBranch` is the exception, and it is written **because**
 * it has a default. That default is `main`, and `git init` still produces
 * `master` unless `init.defaultBranch` says otherwise — so a consumer who took
 * the default failed the branch gate and the coordination gate on their own
 * trunk, on day one. Recording the branch that is actually there costs one line
 * and removes both.
 *
 * @param {{ commands: Record<string, string>, defaultBranch?: string,
 *           profile: string }} args
 */
export const initialConfig = ({ commands, defaultBranch, profile }) => ({
  commands: Object.fromEntries(
    Object.entries(commands).toSorted(([left], [right]) =>
      left.localeCompare(right),
    ),
  ),
  ...(defaultBranch === undefined || defaultBranch === ''
    ? {}
    : { conventions: { defaultBranch } }),
  profile,
});

/**
 * The tasks a consumer reaches the gates through, and the profile each one is
 * useful in.
 *
 * Profile-tagged because a task that cannot run is worse than an absent one: it
 * reads as an available gate, and the repository looks covered by a check that
 * has never passed. `adr:*` needs the decisions home, and `issue:verify` and
 * `pr:verify` need the templates they check against — all of which arrive with
 * the `full` profile and with nothing else.
 *
 * The release and publishing gates are deliberately absent. They are meaningful
 * only in a repository that publishes, and this command cannot tell whether
 * this is one.
 *
 * So are the two whose input is data no one can infer. `repo-verify-stray-configs`
 * needs the roster of config files your toolchain does not read, and
 * `repo-verify-docs-paths` needs a baseline; both refuse an empty roster rather
 * than pass over nothing, which is right, and which makes them a task that fails
 * on the day it is written. Add them once you have written the roster.
 *
 * Several of these take arguments — `commit:verify` wants a message file,
 * `pr:verify` a title and a body. Bare, they print usage and exit non-zero, and
 * that is correct: the hook and the workflow `init` also places are what invoke
 * them with the arguments.
 */
export const GATE_TASKS = {
  'adr:list': { args: ['--list'], bin: 'repo-verify-adrs', profiles: ['full'] },
  'adr:new': { bin: 'repo-adr', profiles: ['full'] },
  'adr:verify': { bin: 'repo-verify-adrs', profiles: ['full'] },
  'branch:verify': {
    bin: 'repo-verify-branch',
    profiles: ['agent', 'full'],
  },
  'commit:verify': {
    bin: 'repo-verify-commit',
    profiles: ['agent', 'full'],
  },
  'coordination:close': {
    bin: 'repo-close-claim',
    profiles: ['agent', 'full'],
  },
  'coordination:verify': {
    bin: 'repo-verify-claims',
    profiles: ['agent', 'full'],
  },
  'devkit:check': {
    args: ['doctor', '--check'],
    bin: 'devkit',
    profiles: ['agent', 'full'],
  },
  'devkit:sync': {
    args: ['sync'],
    bin: 'devkit',
    profiles: ['agent', 'full'],
  },
  'issue:verify': { bin: 'repo-verify-issue', profiles: ['full'] },
  'pr:verify': { bin: 'repo-verify-pr', profiles: ['full'] },
  'scripts:verify': {
    bin: 'repo-verify-script-size',
    profiles: ['full'],
  },
};

const commandLine = ({ args = [], bin }) => [bin, ...args].join(' ');

/**
 * The tasks to write, restricted to bins that are actually installed.
 *
 * A task naming a bin the consumer does not have is the same failure the
 * profile tagging avoids, arriving by a different route: `repo-standards` is an
 * optional half of this kit, and a repository that took only `devkit` would
 * otherwise be given a dozen tasks that all exit with a command-not-found.
 *
 * @param {{ availableBins: Iterable<string>, profile: string }} args
 * @returns {Record<string, string>}
 */
export const tasksFor = ({ availableBins, profile }) => {
  const available = new Set(availableBins);
  return Object.fromEntries(
    Object.entries(GATE_TASKS)
      .filter(
        ([, task]) =>
          task.profiles.includes(profile) && available.has(task.bin),
      )
      .map(([name, task]) => [name, commandLine(task)]),
  );
};

/**
 * The consumer's script block wins every collision.
 *
 * A repository being initialised may already have its own `test` or `check`,
 * and overwriting one would break a working repository in the name of setting
 * it up. The skipped names are reported rather than dropped, so a consumer can
 * see which gate they are not yet reaching and wire it up themselves.
 *
 * @param {{ existing?: Record<string, string>, tasks: Record<string, string> }} args
 * @returns {{ added: string[], scripts: Record<string, string>, skipped: string[] }}
 */
export const scriptsAfter = ({ existing = {}, tasks }) => {
  const names = Object.keys(tasks).toSorted((left, right) =>
    left.localeCompare(right),
  );
  const added = names.filter((name) => !Object.hasOwn(existing, name));
  return {
    added,
    scripts: Object.fromEntries(
      Object.entries({
        ...existing,
        ...Object.fromEntries(added.map((name) => [name, tasks[name]])),
      }).toSorted(([left], [right]) => left.localeCompare(right)),
    ),
    skipped: names.filter((name) => Object.hasOwn(existing, name)),
  };
};

/**
 * Every command key the selected profile's files ask for and this config does
 * not answer, taken from the plan rather than from a list held here — a list
 * would be a second place to update every time a shipped file starts asking for
 * a command, and the copy that nothing checks is the one that rots.
 */
export const unmetCommandKeys = (entries) =>
  [
    ...new Set(
      entries
        .filter((entry) => entry.state === 'unresolved')
        .flatMap((entry) => entry.missing),
    ),
  ].toSorted((left, right) => left.localeCompare(right));

/**
 * Why the run failed, or `undefined` if it did not.
 *
 * Both branches exist because both have already happened to a gate in this kit:
 * a command that packs and installs and asserts nothing passes on an empty
 * artifact, and a profile nobody validated materialises nothing while reporting
 * a clean run. An `init` that reports success over a repository it did not set
 * up is the same failure, and it is the one nobody would go back and check.
 *
 * The vacuous test is `planned`, not `written`, and the difference is a real
 * case rather than a nicety: on a `--force` re-init every file already matches,
 * so each entry classifies `current` and nothing is written. Reading that as
 * failure reported "this repository has not been set up" over one that is fully
 * set up — reachable straight from this command's own advice to create a
 * `package.json` and "re-run with --force". `planned` is zero only when the
 * profile placed nothing at all, which is the failure meant here.
 *
 * @param {{ planned: number, unmet: string[] }} args
 * @returns {string | undefined}
 */
export const initFailure = ({ planned, unmet }) => {
  if (unmet.length > 0) {
    return `init: ${unmet.length} command(s) the selected profile needs are not configured: ${unmet.join(', ')}.\nThe files that use them were not written. Add them to devkit.config.json under "commands", then run devkit sync.`;
  }
  if (planned === 0) {
    return 'init: nothing was materialised. The selected profile placed no files, so this repository has not been set up.';
  }
  return undefined;
};

/**
 * @param {{ added: string[], defaultBranch?: string, profile: string,
 *           runner: string, skipped: string[], written: number }} args
 */
/**
 * The hooks directory this plan actually placed files into, or `undefined`.
 *
 * Asked of the plan rather than of the profile, so a profile that carries hooks
 * but placed none — every one already `unresolved`, say — does not produce an
 * instruction about files that are not there.
 */
export const placedHooksPath = ({ entries, hooksPath }) =>
  entries.some((entry) => entry.path.startsWith(`${hooksPath}/`))
    ? hooksPath
    : undefined;

export const initSummary = ({
  added,
  defaultBranch,
  hooksPath,
  profile,
  runner,
  skipped,
  written,
}) => {
  const lines = [
    `Initialised for the "${profile}" profile: ${written} file(s) materialised, ${added.length} task(s) added.`,
    `Commands were inferred for ${runner} — check them in devkit.config.json and correct any that are wrong.`,
  ];
  // Said here because an unwired hook and a passing hook produce the identical
  // exit 0 — the same silent absence this kit had to fix in the executable bit.
  // The README documents the step and `COMMANDS.md` repeats it; neither is in
  // front of the person who just ran the command that placed them.
  if (hooksPath !== undefined) {
    lines.push(
      `The hooks are in \`${hooksPath}/\` and git will NOT run them until you point it there:\n  git config core.hooksPath ${hooksPath}\nUntil you do, they are silently skipped and the gates they carry are absent.`,
    );
  }
  if (defaultBranch !== undefined && defaultBranch !== '') {
    lines.push(
      `Recorded \`${defaultBranch}\` as this repository's trunk. If you initialised from a topic branch, fix conventions.defaultBranch before the branch gate runs.`,
    );
  }
  if (skipped.length > 0) {
    lines.push(
      `Left your own task(s) alone: ${skipped.join(', ')}. Wire them to the gates yourself if you want them checked.`,
    );
  }
  return lines.join('\n');
};
