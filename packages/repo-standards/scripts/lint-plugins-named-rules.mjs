/**
 * Which Oxlint rules a lint config turns on by name, and where a planted probe
 * for each has to sit so the config entry naming the rule applies to it. A
 * named rule can go quiet while the config still loads — its plugin is not
 * loaded for the files an override matches, a later entry turns it off, or an
 * upgrade changes what it reports — and only a probe that must fire shows it.
 * Pure; `./lint-plugins.mjs` re-exports these for `../verify-lint-plugins.mjs`.
 */
const OFF = new Set([0, 'allow', 'off']);

const severityOf = (value) => (Array.isArray(value) ? value[0] : value);

const isEnabled = (value) => !OFF.has(severityOf(value));

const enabledIds = (rules = {}) =>
  Object.entries(rules)
    .filter(([, value]) => isEnabled(value))
    .map(([id]) => id);

export const namedRules = ({ overrides = [], rules } = {}) => [
  ...enabledIds(rules).map((id) => ({ entry: 'rules', id })),
  ...overrides.flatMap((override, index) =>
    enabledIds(override.rules).map((id) => ({
      entry: `overrides[${index}]`,
      files: override.files ?? [],
      id,
      label: `override-${index}`,
    })),
  ),
];

const PLUGIN_ALIASES = new Map([
  ['@typescript-eslint', 'typescript'],
  ['import-x', 'import'],
  ['jsx-a11y-x', 'jsx-a11y'],
  ['react-hooks', 'react'],
]);

const canonicalPlugin = (plugin) => PLUGIN_ALIASES.get(plugin) ?? plugin;

const splitRuleId = (id) => {
  const slash = id.lastIndexOf('/');
  return slash === -1
    ? { rule: id }
    : {
        plugin: canonicalPlugin(id.slice(0, slash)),
        rule: id.slice(slash + 1),
      };
};

const isProbeFor = (probe, plugin, rule) =>
  probe.rule === rule && canonicalPlugin(probe.plugin) === plugin;

const probeForBareRule = (probes, rule) => {
  const candidates = probes.filter((probe) => probe.rule === rule);
  return candidates.find((probe) => probe.plugin === 'eslint') ?? candidates[0];
};

const probeForRule = (probes, id) => {
  const { plugin, rule } = splitRuleId(id);
  return plugin === undefined
    ? probeForBareRule(probes, rule)
    : probes.find((probe) => isProbeFor(probe, plugin, rule));
};

const GLOB_CHARACTERS = /[!*?[\]{}]/u;

const UNSAFE_SEGMENTS = new Set(['', '.', '..']);

const directorySegment = (segment, dir) => {
  if (segment === '**' || segment === '*') return dir;
  return GLOB_CHARACTERS.test(segment) || UNSAFE_SEGMENTS.has(segment)
    ? undefined
    : segment;
};

const fileSegment = ({ ext, pattern, stem }) => {
  if (pattern === '**' || pattern === '*') return `${stem}.${ext}`;
  const rest = pattern.split('*');
  if (rest.length !== 2 || GLOB_CHARACTERS.test(rest.join(''))) return;
  const name = rest.join(stem);
  return name.endsWith(`.${ext}`) ? name : undefined;
};

const anchoredGlob = (glob) => {
  const relative = glob.replace(/^\.\//u, '');
  return relative === '**' || relative.includes('/')
    ? relative
    : `**/${relative}`;
};

export const probePath = ({ dir, ext, glob, stem }) => {
  const segments = anchoredGlob(glob).split('/');
  const last = segments.at(-1);
  const parents = segments.slice(0, -1);
  const directories = [...parents, ...(last === '**' ? ['**'] : [])].map(
    (segment) => directorySegment(segment, dir),
  );
  const file = fileSegment({ ext, pattern: last, stem });
  const fresh = directories.indexOf(dir);
  if (fresh === -1 || file === undefined || directories.includes(undefined))
    return;
  return {
    path: [...directories, file].join('/'),
    root: directories.slice(0, fresh + 1).join('/'),
  };
};

export const probeFilename = ({ ext = 'ts', plugin, rule, scope = plugin }) =>
  `${scope}.${rule}.probe.${ext}`;

const ruleStem = ({ plugin, rule, scope = plugin }, label) =>
  `${scope}.${rule}.${label}.probe`;

const overridePlacement = ({ dir, named, probe }) =>
  named.files
    .map((glob) =>
      probePath({
        dir,
        ext: probe.ext ?? 'ts',
        glob,
        stem: ruleStem(probe, named.label),
      }),
    )
    .find((placed) => placed !== undefined);

export const placeRuleProbes = ({ dir, probes, rules }) =>
  rules.reduce(
    (result, named) => {
      const probe = probeForRule(probes, named.id);
      if (probe === undefined)
        return { ...result, missing: [...result.missing, named] };
      const placed =
        named.files === undefined
          ? { path: `${dir}/${probeFilename(probe)}`, root: dir }
          : overridePlacement({ dir, named, probe });
      if (placed === undefined)
        return { ...result, unplaceable: [...result.unplaceable, named] };
      return {
        ...result,
        placed: [...result.placed, { ...placed, named, probe }],
      };
    },
    { missing: [], placed: [], unplaceable: [] },
  );

export const malformedProbes = (probes) =>
  probes.filter(
    (probe) =>
      typeof probe?.code !== 'string' ||
      typeof probe.plugin !== 'string' ||
      typeof probe.rule !== 'string',
  );
