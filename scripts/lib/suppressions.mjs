/**
 * Finds every mechanism that can silence a finding inside the four public
 * packages, so "never silenced" becomes a checked property instead of a claim.
 *
 * AGENTS.md §4 says `packages/ui`, `api`, `server` and `utils` are never
 * baselined, scoped or inline-disabled. That is enforced today for exactly ONE
 * of the six ways to silence a finding: their `eslint-suppressions.json` is
 * gitignored, so CI checks out no file and there is nothing to suppress WITH.
 * That works because it is structural — impossible, not merely checked.
 *
 * Every other mechanism is a comment or a config line that nothing counts, and
 * the gap was not theoretical: `packages/ui` carried 17 inline directives and 6
 * Biome rules scoped off against its own files while the docs said it carried
 * none. Not one of those is necessarily WRONG — several are ADR-backed cases of
 * a linter mismodelling correct code — but nothing distinguished a reviewed
 * exception from one added last Tuesday.
 *
 * So this module enumerates them and `verify-suppressions.mjs` diffs the result
 * against a register that must justify each one. Pure functions only; the
 * filesystem lives in the runner.
 *
 * Deliberately NOT derived from a hardcoded package list — `publicPackageDirs`
 * resolves the same authority AGENTS.md names (which workspaces gitignore their
 * suppressions file), so a fifth public package is covered the day it is added.
 */

/**
 * The inline directives that silence a finding, by engine.
 *
 * The TypeScript escape hatches are included even though they are type
 * assertions rather than lint suppressions: each silences a compiler
 * diagnostic, which is the property under test, and the file-level one silences
 * every diagnostic in the file at once.
 *
 * Ordered longest-prefix-first so `eslint-disable-next-line` is not reported as
 * a bare `eslint-disable`.
 */
const INLINE_DIRECTIVES = [
  'eslint-disable-next-line',
  'eslint-disable',
  'oxlint-disable-next-line',
  'oxlint-disable',
  'biome-ignore-all',
  'biome-ignore',
  '@ts-expect-error',
  '@ts-nocheck',
  '@ts-ignore',
  'NOSONAR',
];

/**
 * Matches any directive above. Alternation of literals only — no nesting and no
 * unbounded repetition, so it cannot backtrack pathologically (Sonar S8786).
 */
const DIRECTIVE_PATTERN = new RegExp(
  INLINE_DIRECTIVES.map((directive) =>
    directive.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`),
  ).join('|'),
  'gu',
);

/**
 * Directives whose trailing text is a rule list. The rest (`@ts-expect-error`,
 * `NOSONAR`) take free prose, so reading a "rule" off them yields a word like
 * `testing` from "testing edge case" — a key that looks specific and means
 * nothing.
 */
const RULE_BEARING = new Set([
  'eslint-disable-next-line',
  'eslint-disable',
  'oxlint-disable-next-line',
  'oxlint-disable',
  'biome-ignore-all',
  'biome-ignore',
]);

/**
 * The shape of a lint rule name — `no-console`, `@stylexjs/valid-styles`,
 * `lint/style/noShadow`.
 *
 * Validated rather than assumed, because the token following a directive is not
 * always a rule: a block-comment form leaves the terminator sitting there, and
 * reading it produced a rule named after comment punctuation. A key like that
 * looks plausible in the register and matches nothing on the next run.
 */
const RULE_NAME = /^[@a-zA-Z][\w@/-]*$/u;

/**
 * What the directive silences: the rule it names, or the directive itself when
 * it names none.
 *
 * An unscoped directive is the widest kind — a bare `NOSONAR` silences every
 * present and future rule on its line — so it must remain visible as such
 * rather than being filed under a rule it does not actually reference.
 */
const ruleFrom = ({ directive, rest }) => {
  if (!RULE_BEARING.has(directive)) return directive;
  // Strip an explanation trailer (`-- why`) before reading the rule list.
  const [rules] = rest.trim().split(' -- ');
  const named = (rules ?? '').split(',')[0]?.trim().split(/\s/u)[0];
  return named !== undefined && RULE_NAME.test(named)
    ? named
    : `${directive} (unscoped)`;
};

/**
 * Every inline suppression in one file's text.
 *
 * Keyed by file+directive+rule rather than by line: line numbers churn on any
 * edit above them, which would make the register fail on unrelated changes and
 * train everyone to re-freeze it without reading. A COUNT per key catches
 * additions while surviving a reformat.
 */
export const findInlineSuppressions = ({ file, text }) =>
  text.split('\n').flatMap((line, index) =>
    [...line.matchAll(DIRECTIVE_PATTERN)].map((match) => ({
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

/**
 * The glob syntax Biome's `includes` entries use, longest token first.
 *
 * A leading directory-crossing token consumes its own slash so that a pattern
 * anchored at the tree root still matches a file sitting directly there.
 */
const GLOB_TOKENS = new Map([
  ['**/', '(?:[^/]+/)*'],
  ['**', '.*'],
  ['*', '[^/]*'],
]);

/**
 * Turns one Biome `includes` glob into an anchored matcher.
 *
 * Single-pass by necessity: expanding the tokens with chained `replaceAll` calls
 * rewrites the `*` quantifiers the earlier calls just inserted, turning
 * `(?:[^/]+/)*` into `(?:[^/]+/)[^/]*` — a pattern that then matches nothing
 * real. That silent near-miss reported one Biome scope-off where there are six,
 * which is exactly the failure this gate exists to catch, so it is pinned by a
 * test rather than only fixed.
 *
 * Each expansion is a bounded character class with no ambiguous overlap, so the
 * result cannot backtrack pathologically (Sonar S8786).
 */
const globToRegExp = (glob) => {
  const escaped = glob.replaceAll(/[.+?^${}()|[\]\\]/gu, String.raw`\$&`);
  const expanded = escaped.replaceAll(
    /\*\*\/|\*\*|\*/gu,
    (token) => GLOB_TOKENS.get(token) ?? token,
  );
  return new RegExp(`^${expanded}$`, 'u');
};

/** Whether a Biome `includes` glob can match a given repo-relative path. */
export const globMatches = ({ glob, path }) => globToRegExp(glob).test(path);

/**
 * Every `"off"` rule in a parsed `biome.jsonc` override, paired with the globs
 * that carry it.
 *
 * Walks the rule tree generically rather than naming each group, because the
 * groups (`a11y`, `style`, `suspicious`, …) are Biome's vocabulary and a new one
 * must not silently escape the check.
 */
const offRulesIn = (rules) =>
  Object.values(rules ?? {}).flatMap((group) =>
    typeof group === 'object' && group !== null
      ? Object.entries(group)
          .filter(([, level]) => level === 'off')
          .map(([rule]) => rule)
      : [],
  );

/**
 * Biome rules scoped off against files inside the public packages.
 *
 * A Biome scope-off is the least visible suppression of all: nothing in
 * `SpacerRow.component.tsx` says a rule was turned off for it, so it cannot be
 * found by reading the file it applies to.
 *
 * Each glob is classified, because two different things look identical in the
 * config and only one belongs in this register:
 *
 *   targeted   every file the glob matches is inside a public package, so the
 *              rule is off BECAUSE of that package. `**\/logger.util.ts` reads
 *              like a repo-wide pattern but resolves to one `packages/ui` file.
 *   repo-wide  the glob also matches files outside them (`**\/*.test.ts`,
 *              `**\/*.mjs`), so it is a whole-category policy that a public
 *              package merely falls inside. Those are ADR-035 §7's business and
 *              are reported but not gated here — registering them would
 *              misattribute a repo decision to `packages/ui` and bury the six
 *              entries that genuinely are about it.
 *
 * The boundary is honest rather than airtight: a glob broad enough to catch a
 * public package AND something else (`**\/*.component.tsx`) classifies as
 * repo-wide and escapes this gate. That is a deliberate repo-wide config change
 * a reviewer sees in `biome.jsonc`, not a quiet per-package exemption.
 */
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

/**
 * Top-level baseline keys that are scoring metadata, not suppressed findings.
 *
 * `target_keys` lists the files fallow treats as high-impact when scoring — it
 * names `packages/server/src/db/query-builder/quote-identifier.util.ts` because
 * that file MATTERS, which is the opposite of excusing a finding on it. Counting
 * it reported a suppression on a public package where there is none, so the
 * detector has to know the schema rather than pattern-match anything path-shaped.
 */
const FALLOW_METADATA_KEYS = new Set(['target_keys']);

/**
 * Fallow baseline entries whose key names a file inside a public package.
 *
 * The baselines are one repo-wide file set, so unlike the eslint case there is
 * no per-package gitignore that could make this structurally impossible — a
 * public-package finding CAN be baselined here, and nothing but this notices.
 */
export const findFallowSuppressions = ({ baselines, isPublicPath }) =>
  Object.entries(baselines).flatMap(([name, contents]) =>
    Object.entries(contents ?? {})
      .filter(([section]) => !FALLOW_METADATA_KEYS.has(section))
      .flatMap(([section, node]) =>
        collectPaths(node)
          // A dupes clone group joins every member with `|`; each side is its
          // own `path:lines` and either can be the public-package one.
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

/** Every string leaf and path-shaped object key beneath a node, flattened. */
const collectPaths = (node) => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap((item) => collectPaths(item));
  if (typeof node === 'object' && node !== null)
    return Object.keys(node).flatMap((key) =>
      key.includes('/') ? [key] : collectPaths(node[key]),
    );
  return [];
};

/** The register key for a finding — stable under edits that move lines. */
export const suppressionKey = ({ file, kind, rule }) =>
  `${kind} ${file} ${rule}`;

/**
 * Collapses findings to one row per key, carrying the occurrence count.
 *
 * An inline directive or a fallow baseline entry names one exact file inside a
 * public package, so it is always targeted; only a Biome glob can turn out to be
 * a repo-wide category rule.
 */
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

/** The rows this gate holds to the register — repo-wide Biome policy is not one. */
export const gated = (rows) => rows.filter((row) => row.scope === 'targeted');

/**
 * Diffs what is in the tree against what has been approved.
 *
 * Three failure modes, and `stale` is the one that keeps the register honest:
 * an approval outliving the code it justified is how every baseline in this repo
 * started rotting. `undocumented` exists because an exception with no stated
 * reason cannot have been "really evaluated" — that is the whole bar.
 */
export const diffAgainstRegister = ({ found, register }) => {
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

  return { grew, stale, unapproved, undocumented };
};
