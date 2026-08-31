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

export const DEFAULT_CONFIG = {
  ci: { setup: [] },
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

const ciSetupLines = (ci) => {
  if (ci === undefined) return [];
  if (!isPlainObject(ci)) {
    throw new TypeError(`${CONFIG_FILE_NAME}: "ci" must be a JSON object`);
  }
  if (ci.setup === undefined) return [];
  if (!Array.isArray(ci.setup)) {
    throw new TypeError(
      `${CONFIG_FILE_NAME}: "ci.setup" must be an array of strings — verbatim YAML lines, not step objects`,
    );
  }
  const wrong = ci.setup.findIndex((line) => typeof line !== 'string');
  if (wrong !== -1) {
    throw new TypeError(
      `${CONFIG_FILE_NAME}: "ci.setup[${wrong}]" must be a string — the steps are verbatim YAML lines, so a step is written as the lines that spell it, not as an object`,
    );
  }
  return ci.setup;
};

export const resolveConfig = (raw) => {
  if (raw === undefined) return DEFAULT_CONFIG;
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new TypeError(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  const profile = withProfile({
    config: DEFAULT_CONFIG,
    profile: parsed.profile ?? DEFAULT_CONFIG.profile,
    source: CONFIG_FILE_NAME,
  }).profile;
  return {
    ci: { setup: ciSetupLines(parsed.ci) },
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

const ROOT_BASES = new Set(['', '.', './']);

export const targetPathFor = ({ assetPath, config }) => {
  const [group, ...rest] = assetPath.split('/');
  const base = config.paths[group];
  if (base === undefined || rest.length === 0) return undefined;
  return ROOT_BASES.has(base) ? rest.join('/') : [base, ...rest].join('/');
};

export const groupsFor = (config) => PROFILES[config.profile] ?? [];

const EXECUTABLE_GROUPS = new Set(['hooks']);

export const isExecutableAsset = (assetPath) =>
  EXECUTABLE_GROUPS.has(assetPath.split('/')[0]);

export const configuredCommandWords = (config) =>
  Object.values(config.commands ?? {})
    .filter((command) => typeof command === 'string')
    .map((command) => command.trim().split(/\s+/)[0] ?? '')
    .filter((word) => word !== '');

const valueAt = ({ config, path }) =>
  path.split('.').reduce((cursor, segment) => {
    if (!isPlainObject(cursor) || !Object.hasOwn(cursor, segment)) {
      return undefined;
    }
    return cursor[segment];
  }, config);

export const hasConfigKey = ({ config, path }) => {
  const value = valueAt({ config, path });
  return value !== undefined && value !== null && value !== '';
};

export const allowedConfigKeys = (config) => [
  'profile',
  ...Object.keys(config.paths ?? {}).map((key) => `paths.${key}`),
  ...Object.entries(config.commands ?? {})
    .filter(([, command]) => typeof command === 'string' && command !== '')
    .map(([key]) => `commands.${key}`),
];
