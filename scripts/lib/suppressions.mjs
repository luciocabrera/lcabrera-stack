/**
 * Finds every mechanism that can silence a finding inside the four public
 * packages, so AGENTS.md §4's "never silenced" is checked rather than claimed.
 *
 * Pure functions; `verify-suppressions.mjs` owns the filesystem and diffs these
 * findings against the register. Rationale and protocol:
 * `docs/agents/public-package-suppressions.md`.
 *
 * The package list is resolved by `publicPackageDirs`, not hardcoded, so a fifth
 * public package is covered the day it is added.
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
  'react-doctor-disable-next-line',
  'react-doctor-disable-line',
  'react-doctor-disable',
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

/** Rows scoped to the public packages themselves — the strictest bar. */
export const targeted = (rows) =>
  rows.filter((row) => row.scope === 'targeted');

/**
 * Rows from a repo-wide policy that happens to reach a public package.
 *
 * Held to a register too, just a separate one. The first version of this gate
 * dropped them entirely, which left a real hole: a NEW override broad enough to
 * match a public package AND anything else needed no entry and passed silently.
 * Listing them separately keeps that shut without filing thirteen repo-wide
 * decisions under "`packages/ui` exemptions", which would misattribute them and
 * bury the six that genuinely are about the package.
 */
export const repoWide = (rows) =>
  rows.filter((row) => row.scope === 'repo-wide');

/**
 * Lint config files a public package owns, where a rule level can be lowered
 * without any directive appearing in the source it affects.
 *
 * `vite.config.ts` is here because Oxlint is configured through its `lint`
 * block, so a rule can be switched off for a whole package there.
 */
const LINT_CONFIG_FILES = new Set(['eslint.config.mjs', 'vite.config.ts']);

/** A rule level that stops a finding failing the build. */
const WEAK_LEVEL = /(['"])(off|warn)\1/gu;

/**
 * Rule levels below `error` in a public package's OWN lint config.
 *
 * The seventh way to silence a finding, and the least visible after a Biome
 * override: nothing in the affected source says a rule was lowered — the whole
 * package simply stops reporting it.
 *
 * The distinction that makes this checkable is the same one the Biome globs
 * need: a rule turned off in the SHARED config is repo-wide policy that every
 * workspace gets, while one turned off in a package's own file is that package
 * opting out. Only the latter is scanned here.
 *
 * Today all four are clean, and the convention is already explicit — three of
 * them carry a local `rules` block that sets `error` with options, commented
 * "rather than turning the rule off … so it still FAILS the gate". This asserts
 * that practice instead of trusting it to hold.
 */
export const findConfigSuppressions = ({ file, text }) => {
  const name = file.slice(file.lastIndexOf('/') + 1);
  if (!LINT_CONFIG_FILES.has(name)) return [];
  return [...text.matchAll(WEAK_LEVEL)].map((match) => ({
    file,
    kind: 'config',
    rule: `rule level ${match[2]}`,
  }));
};

/**
 * The vocabulary an entry that must declare a status may draw from.
 *
 * Exported so the gate's message quotes the list instead of restating it, and
 * so a future third status is added in one place.
 */
export const DECLARABLE_STATUSES = ['permanent', 'provisional'];

const DECLARABLE = new Set(DECLARABLE_STATUSES);

/**
 * Diffs what is in the tree against what has been approved.
 *
 * `stale` is the lane that keeps the register honest: an approval outliving the
 * code it justified is how every baseline in this repo started rotting.
 * `undocumented` exists because an exception with no stated reason cannot have
 * been "really evaluated" — that is the whole bar.
 *
 * `provisional` is the lane that keeps the register from growing a second
 * baseline. A deferred decision is legitimate inside one PR and cannot outlive
 * it, so the status is still valid vocabulary and simply never survives a build.
 * Counting it into a message suffix, as this gate first did, left "one deferred
 * decision" and "none" reporting the same exit code — the state a reader has no
 * way to distinguish is the state that lasts forever.
 *
 * `undeclared` is what makes that lane mean anything. Keying `provisional` off
 * the field's VALUE left saying nothing cheaper than saying `provisional`:
 * delete the line — or write `"pending"` — and the entry passed as an ordinary
 * scoped suppression.
 *
 * `requireStatus` defaults ON, and only the `acknowledged` lane opts out —
 * that lane records repo-wide policy (ADR-035 §7) no public package chose, so
 * its entries carry no status and must keep passing without one. The default
 * points this way round deliberately: a caller who forgets the flag gets a loud
 * failure rather than the silent pass this lane exists to remove.
 */
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
