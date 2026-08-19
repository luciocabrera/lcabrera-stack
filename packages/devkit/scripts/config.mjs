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
 */
export const DEFAULT_CONFIG = {
  commands: {},
  paths: {
    agents: '.claude/agents',
    coordination: 'docs/coordination',
    docs: 'docs/agents',
    rules: '.claude/rules',
    skills: '.github/skills',
  },
  profile: 'agent',
};

/** Which asset groups a profile materialises. */
/**
 * `docs` and `coordination` are in the agent profile because the skills cannot
 * run without them: an orchestration contract or a claim protocol that does not
 * arrive leaves a skill whose first instruction is to read a missing file.
 */
export const PROFILES = {
  agent: ['skills', 'rules', 'agents', 'docs', 'coordination'],
  full: ['skills', 'rules', 'agents', 'docs', 'coordination'],
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
  const profile = parsed.profile ?? DEFAULT_CONFIG.profile;
  if (!Object.hasOwn(PROFILES, profile)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: unknown profile "${profile}" — expected one of ${Object.keys(PROFILES).join(', ')}`,
    );
  }
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
 * Where one asset lands. Assets are stored under a group directory whose name
 * is the config key that places it, so adding a group is a data change rather
 * than a code change.
 */
export const targetPathFor = ({ assetPath, config }) => {
  const [group, ...rest] = assetPath.split('/');
  const base = config.paths[group];
  if (base === undefined || rest.length === 0) return undefined;
  return [base, ...rest].join('/');
};

export const groupsFor = (config) => PROFILES[config.profile] ?? [];
