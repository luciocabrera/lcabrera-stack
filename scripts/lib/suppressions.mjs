/**
 * Finds every mechanism that can silence a finding inside the public packages,
 * so AGENTS.md §1's "never silenced" is checked rather than claimed.
 *
 * Pure functions; `verify-suppressions.mjs` owns the filesystem and diffs these
 * findings against the register. Rationale and protocol:
 * `docs/agents/public-package-suppressions.md`.
 *
 * The package list is resolved by `publicPackageDirs`, not hardcoded, so a new
 * public package is covered the day it is added. `vp run suppressions:packages`
 * prints the roster; nothing restates it.
 *
 * The TypeScript escape hatches are included even though they are type
 * assertions rather than lint suppressions: each silences a compiler
 * diagnostic, which is the property under test, and the file-level one
 * silences every diagnostic at once. The list is ordered longest-prefix-first
 * so `eslint-disable-next-line` is not reported as a bare `eslint-disable`.
 */

const INLINE_DIRECTIVES = [
  'eslint-disable-next-line',
  'eslint-disable',
  'oxlint-disable-next-line',
  'oxlint-disable',
  'biome-ignore-all',
  'biome-ignore',
  // React Doctor's three spellings, taken from the published package rather
  // than its docs, which only show the `-next-line` form. The bare
  // `react-doctor-disable` is a prefix of the other two, so it must stay last
  // or it would swallow them (see the ordering note above).
  'react-doctor-disable-next-line',
  'react-doctor-disable-line',
  'react-doctor-disable',
  '@ts-expect-error',
  '@ts-nocheck',
  '@ts-ignore',
  'NOSONAR',
];

const DIRECTIVE_PATTERN = new RegExp(
  INLINE_DIRECTIVES.map((directive) =>
    directive.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`),
  ).join('|'),
  'gu',
);

const RULE_BEARING = new Set([
  'eslint-disable-next-line',
  'eslint-disable',
  'oxlint-disable-next-line',
  'oxlint-disable',
  'biome-ignore-all',
  'biome-ignore',
  'react-doctor-disable-next-line',
  'react-doctor-disable-line',
  'react-doctor-disable',
]);

const RULE_NAME = /^[@a-zA-Z][\w@/-]*$/u;

const ruleFrom = ({ directive, rest }) => {
  if (!RULE_BEARING.has(directive)) return directive;
  const [rules] = rest.trim().split(' -- ');
  const named = (rules ?? '').split(',')[0]?.trim().split(/\s/u)[0];
  return named !== undefined && RULE_NAME.test(named)
    ? named
    : `${directive} (unscoped)`;
};

const isDirectivePosition = (before) => {
  const trimmed = before.trimEnd();
  if (trimmed.endsWith('//') || trimmed.endsWith('/*')) return true;
  const leading = before.trim();
  return leading === '' || leading === '*';
};

export const findInlineSuppressions = ({ file, text }) =>
  text.split('\n').flatMap((line, index) =>
    [...line.matchAll(DIRECTIVE_PATTERN)]
      .filter((match) => isDirectivePosition(line.slice(0, match.index)))
      .map((match) => ({
        directive: match[0],
        file,
        kind: 'inline',
        line: index + 1,
        rule: ruleFrom({
          directive: match[0],
          rest: line.slice(match.index + match[0].length),
        }),
      })),
  );

const GLOB_TOKENS = new Map([
  ['**/', '(?:[^/]+/)*'],
  ['**', '.*'],
  ['*', '[^/]*'],
]);

const globToRegExp = (glob) => {
  const escaped = glob.replaceAll(/[.+?^${}()|[\]\\]/gu, String.raw`\$&`);
  const expanded = escaped.replaceAll(
    /\*\*\/|\*\*|\*/gu,
    (token) => GLOB_TOKENS.get(token) ?? token,
  );
  return new RegExp(`^${expanded}$`, 'u');
};

export const globMatches = ({ glob, path }) => globToRegExp(glob).test(path);

const offRulesIn = (rules) =>
  Object.values(rules ?? {}).flatMap((group) =>
    typeof group === 'object' && group !== null
      ? Object.entries(group)
          .filter(([, level]) => level === 'off')
          .map(([rule]) => rule)
      : [],
  );

export const findBiomeSuppressions = ({ config, otherFiles, publicFiles }) =>
  (config.overrides ?? []).flatMap((override) => {
    const rules = offRulesIn(override.linter?.rules);
    if (rules.length === 0) return [];
    return (override.includes ?? []).flatMap((glob) => {
      const hits = publicFiles.filter((path) => globMatches({ glob, path }));
      if (hits.length === 0) return [];
      const escapes = otherFiles.some((path) => globMatches({ glob, path }));
      return rules.map((rule) => ({
        file: glob,
        kind: 'biome',
        matched: hits.length,
        rule,
        scope: escapes ? 'repo-wide' : 'targeted',
      }));
    });
  });

const FALLOW_METADATA_KEYS = new Set(['target_keys']);

export const findFallowSuppressions = ({ baselines, isPublicPath }) =>
  Object.entries(baselines).flatMap(([name, contents]) =>
    Object.entries(contents ?? {})
      .filter(([section]) => !FALLOW_METADATA_KEYS.has(section))
      .flatMap(([section, node]) =>
        collectPaths(node)
          .flatMap((entry) => entry.split('|'))
          .map((entry) => ({ entry, path: entry.split(':')[0] ?? '' }))
          .filter(({ path }) => isPublicPath(path))
          .map(({ path }) => ({
            file: path,
            kind: 'fallow',
            rule: `${name}:${section}`,
          })),
      ),
  );

const collectPaths = (node) => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap((item) => collectPaths(item));
  if (typeof node === 'object' && node !== null)
    return Object.keys(node).flatMap((key) =>
      key.includes('/') ? [key] : collectPaths(node[key]),
    );
  return [];
};

export const suppressionKey = ({ file, kind, rule }) =>
  `${kind} ${file} ${rule}`;

export const tally = (found) => {
  const counts = new Map();
  for (const finding of found) {
    const key = suppressionKey(finding);
    const existing = counts.get(key);
    counts.set(key, {
      count: (existing?.count ?? 0) + 1,
      file: finding.file,
      key,
      kind: finding.kind,
      rule: finding.rule,
      scope: finding.scope ?? 'targeted',
    });
  }
  return [...counts.values()].sort((left, right) =>
    left.key.localeCompare(right.key),
  );
};

export const targeted = (rows) =>
  rows.filter((row) => row.scope === 'targeted');

export const repoWide = (rows) =>
  rows.filter((row) => row.scope === 'repo-wide');

const LINT_CONFIG_FILES = new Set(['eslint.config.mjs', 'vite.config.ts']);

const WEAK_LEVEL = /(['"])(off|warn)\1/gu;

export const findConfigSuppressions = ({ file, text }) => {
  const name = file.slice(file.lastIndexOf('/') + 1);
  if (!LINT_CONFIG_FILES.has(name)) return [];
  return [...text.matchAll(WEAK_LEVEL)].map((match) => ({
    file,
    kind: 'config',
    rule: `rule level ${match[2]}`,
  }));
};

export const DECLARABLE_STATUSES = ['permanent', 'provisional'];

const DECLARABLE = new Set(DECLARABLE_STATUSES);

export const diffAgainstRegister = ({
  found,
  register,
  requireStatus = true,
}) => {
  const approved = new Map(register.map((entry) => [entry.key, entry]));
  const present = new Map(found.map((entry) => [entry.key, entry]));

  const unapproved = found.filter((entry) => !approved.has(entry.key));
  const grew = found.flatMap((entry) => {
    const match = approved.get(entry.key);
    return match !== undefined && entry.count > match.count
      ? [{ ...entry, approvedCount: match.count }]
      : [];
  });
  const stale = register.filter((entry) => {
    const match = present.get(entry.key);
    return match === undefined || match.count < entry.count;
  });
  const undocumented = register.filter(
    (entry) =>
      (entry.reason ?? '').trim().length < 20 ||
      (entry.ref ?? '').trim() === '',
  );
  const provisional = register.filter(
    (entry) => entry.status === 'provisional',
  );
  const undeclared = requireStatus
    ? register.filter((entry) => !DECLARABLE.has(entry.status))
    : [];

  return { grew, provisional, stale, unapproved, undeclared, undocumented };
};
