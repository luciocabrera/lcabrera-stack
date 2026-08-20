/*
 * The consumer's data, kept out of the files this kit ships.
 *
 * Why: the same split the toolchain packages already made (ADR-069). A skill's
 * procedure travels; the workspace names, directory layout and task commands
 * inside it do not. Everything a shipped file would otherwise hardcode about a
 * repository lives here instead, so this repository's values are configuration
 * rather than the thing being distributed.
 *
 * Absence is a normal state: a consumer who accepts every default writes no
 * config file at all.
 */

export const CONFIG_FILE_NAME = 'devkit.config.json';

/**
 * Directory layout is a default rather than a constant because a consumer may
 * legitimately keep skills elsewhere; the commands are empty because there is
 * no honest default for another repository's toolchain, and a wrong one would
 * be worse than an absent one.
 *
 * `hooks` defaults to `.githooks` rather than to any one toolchain's hook
 * directory: git runs whatever `core.hooksPath` names, so naming the directory a
 * particular runner owns would put the seeds where a consumer on another runner
 * never looks.
 */
export const DEFAULT_CONFIG = {
  commands: {},
  paths: {
    agents: '.claude/agents',
    coordination: 'docs/coordination',
    decisions: 'docs/decisions',
    docs: 'docs/agents',
    hooks: '.githooks',
    root: '.',
    rules: '.claude/rules',
    skills: '.github/skills',
    templates: '.github',
    workflows: '.github/workflows',
  },
  profile: 'agent',
};

/**
 * Which asset groups a profile materialises, split by who reads the result.
 *
 * `agent` is what an agent reads: the skills, the path rules, the subagent
 * definitions, and the contracts they bind to. `docs` and `coordination` are in
 * it because the skills cannot run without them — an orchestration contract or a
 * claim protocol that does not arrive leaves a skill whose first instruction is
 * to read a missing file.
 *
 * `full` adds what CI, git and the gates run: the workflows, the hooks, the
 * templates those gates check against, the ADR home the ADR gate reads, and the
 * command reference. A consumer who wants the prose and keeps their own process
 * takes `agent` and gets none of it.
 */
const AGENT_GROUPS = ['skills', 'rules', 'agents', 'docs', 'coordination'];

export const PROFILES = {
  agent: AGENT_GROUPS,
  full: [
    ...AGENT_GROUPS,
    'decisions',
    'templates',
    'workflows',
    'hooks',
    'root',
  ],
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The config with a profile applied, refusing one this package does not know.
 *
 * `groupsFor` answers `[]` for a name it has never heard of, so an unchecked
 * profile places nothing and every command reports success — the same clean run
 * as a repository with nothing left to materialise. Both routes a profile can
 * arrive by go through here: the config file, and the `--profile` flag that
 * overrides it.
 *
 * @param {{ config: object, profile: string, source?: string }} args
 */
export const withProfile = ({ config, profile, source = '--profile' }) => {
  if (!Object.hasOwn(PROFILES, profile)) {
    throw new Error(
      `${source}: unknown profile "${profile}" — expected one of ${Object.keys(PROFILES).join(', ')}`,
    );
  }
  return { ...config, profile };
};

/**
 * A malformed config is a failure, not a silent fallback: a consumer who wrote
 * one meant it, and quietly ignoring it would materialise into the wrong
 * directories while reporting success.
 */
export const resolveConfig = (raw) => {
  if (raw === undefined) return DEFAULT_CONFIG;
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  const profile = withProfile({
    config: DEFAULT_CONFIG,
    profile: parsed.profile ?? DEFAULT_CONFIG.profile,
    source: CONFIG_FILE_NAME,
  }).profile;
  return {
    commands: isPlainObject(parsed.commands)
      ? parsed.commands
      : DEFAULT_CONFIG.commands,
    paths: {
      ...DEFAULT_CONFIG.paths,
      ...(isPlainObject(parsed.paths) ? parsed.paths : {}),
    },
    profile,
  };
};

/**
 * The three ways a consumer writes "the repository root" — the default, and the
 * two an editor or a person would plausibly leave behind.
 *
 * Every one of them has to produce a bare `COMMANDS.md`, because the manifest
 * key, the acceptance key and closure's containment check are all string
 * comparisons. Joined naively they produce `./COMMANDS.md` and `/COMMANDS.md`,
 * which are two more spellings of one file — and the leading-slash form is the
 * silent one: `join` still writes it to the right place, while closure resolves
 * a link to it as `COMMANDS.md`, matches nothing in the shipped set, and reports
 * the page as an escape.
 */
const ROOT_BASES = new Set(['', '.', './']);

/**
 * Where one asset lands. Assets are stored under a group directory whose name
 * is the config key that places it, so adding a group is a data change rather
 * than a code change.
 */
export const targetPathFor = ({ assetPath, config }) => {
  const [group, ...rest] = assetPath.split('/');
  const base = config.paths[group];
  if (base === undefined || rest.length === 0) return undefined;
  return ROOT_BASES.has(base) ? rest.join('/') : [base, ...rest].join('/');
};

export const groupsFor = (config) => PROFILES[config.profile] ?? [];

/**
 * The tools the consumer's own command map invokes.
 *
 * A command reached through a placeholder is one of the reference forms a
 * shipped file is allowed to use, so closure must count it as answered. Without
 * this, parameterising a command — the very thing that makes a file portable —
 * would make the closure gate fail.
 */
export const configuredCommandWords = (config) =>
  Object.values(config.commands ?? {})
    .filter((command) => typeof command === 'string')
    .map((command) => command.trim().split(/\s+/)[0] ?? '')
    .filter((word) => word !== '');

/**
 * A dotted lookup that stops at the first segment the config does not own, so a
 * key never resolves through the prototype chain: `commands.constructor` names
 * nothing a consumer configured, and reading it as configured would let an asset
 * declaring it be written to a repository that has no commands at all.
 */
const valueAt = ({ config, path }) =>
  path.split('.').reduce((cursor, segment) => {
    if (!isPlainObject(cursor) || !Object.hasOwn(cursor, segment)) {
      return undefined;
    }
    return cursor[segment];
  }, config);

/**
 * Does THIS consumer have that key? The question `sync` asks before writing a
 * file that declares it needs one.
 *
 * A null or empty value counts as unset, matching what `substituteCommands`
 * already does with an empty command: a key present but blank leaves the shipped
 * file's instruction just as unfollowable as an absent one, and writing it
 * anyway is the failure this gate exists to stop.
 */
export const hasConfigKey = ({ config, path }) => {
  const value = valueAt({ config, path });
  return value !== undefined && value !== null && value !== '';
};

/**
 * The key SPACE this config defines — which is a different question from
 * whether one key is set, and the one `closure` needs: could ANY consumer
 * satisfy this declaration, or does it name something outside what
 * `devkit.config.json` is for? A consumer's file may carry blocks other tools
 * read, and a shipped asset binding to one of those is an escape however
 * reliably it resolves in the repository that wrote it.
 *
 * The command map is open-ended, exactly as `configuredCommandWords` treats it:
 * there is no fixed vocabulary of command names, so the space is whatever the
 * consumer configured rather than a list held here.
 */
export const allowedConfigKeys = (config) => [
  'profile',
  ...Object.keys(config.paths ?? {}).map((key) => `paths.${key}`),
  ...Object.entries(config.commands ?? {})
    .filter(([, command]) => typeof command === 'string' && command !== '')
    .map(([key]) => `commands.${key}`),
];
