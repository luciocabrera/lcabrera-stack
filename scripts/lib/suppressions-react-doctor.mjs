/**
 * React Doctor's config-level ways to silence a finding, mapped onto the shape
 * the other detectors in `suppressions.mjs` emit.
 *
 * A sibling module rather than more lines in `suppressions.mjs`, which is close
 * to the 350-code-line ceiling `scripts:verify` enforces.
 *
 * Inline `react-doctor-disable*` comments are NOT here — they are the same
 * mechanism class as every other inline directive and live in that file's
 * `INLINE_DIRECTIVES`. What is here is the part with no counterpart in the
 * source it affects: a rule switched off, a diagnostic dropped, or a path
 * excluded, all from one root config a reader of `packages/ui` never opens.
 *
 * Why it needs its own detector at all: `doctor.config.jsonc` is a root file,
 * like `biome.jsonc`, so the per-package `eslint-suppressions.json` gitignore
 * that makes the four public packages structurally suppression-free does
 * nothing here. Without this, adopting React Doctor would have added three
 * unpoliced ways to silence a finding in exactly the packages AGENTS.md §4
 * holds strictest.
 */

import { globMatches } from './suppressions.mjs';

/** A severity that stops a finding failing the gate. */
const WEAK_LEVELS = new Set(['off', 'warn']);

/**
 * Config keys that silence globally, with the label each row reports under.
 *
 * All four reach every scanned project, the public packages included, so they
 * are repo-wide policy by construction — there is no glob that could scope one
 * to a single package. They land in the register's `acknowledged` list.
 */
const GLOBAL_SOURCES = [
  { label: 'rule', pick: (config) => weakKeys(config.rules) },
  { label: 'category', pick: (config) => weakKeys(config.categories) },
  { label: 'bucket', pick: (config) => weakKeys(config.buckets) },
  { label: 'ignored rule', pick: (config) => config.ignore?.rules ?? [] },
  { label: 'ignored tag', pick: (config) => config.ignore?.tags ?? [] },
];

/** Keys of a `{ rule: severity }` map whose severity is below `error`. */
const weakKeys = (entries) =>
  Object.entries(entries ?? {})
    .filter(([, level]) => WEAK_LEVELS.has(level))
    .map(([name]) => name);

/**
 * Every path a glob in this config could be written against.
 *
 * React Doctor scans each detected project separately and reports paths
 * relative to THAT project, not to the repo root — `packages/ui` is its own
 * project, so a rule silenced for `src/components/**` there is written without
 * the `packages/ui/` prefix. Matching only the repo-relative form silently
 * misses precisely the entries this gate exists to catch, so both are tried.
 */
const candidatePaths = ({ path, projectDirs }) => [
  path,
  ...projectDirs
    .filter((dir) => path.startsWith(`${dir}/`))
    .map((dir) => path.slice(dir.length + 1)),
];

const globHits = ({ glob, paths, projectDirs }) =>
  paths.filter((path) =>
    candidatePaths({ path, projectDirs }).some((candidate) =>
      globMatches({ glob, path: candidate }),
    ),
  );

/**
 * One row per (glob, rule) pair that reaches a public package.
 *
 * `scope` follows the same rule as the Biome detector: a glob that also matches
 * something outside the public packages is repo-wide policy, and one that does
 * not is that package opting out — the strictest lane.
 */
const globRows = ({ context, globs, kind, rules }) =>
  globs.flatMap((glob) => {
    const hits = globHits({
      glob,
      paths: context.publicFiles,
      projectDirs: context.projectDirs,
    });
    if (hits.length === 0) return [];
    const escapes =
      globHits({
        glob,
        paths: context.otherFiles,
        projectDirs: context.projectDirs,
      }).length > 0;
    return rules.map((rule) => ({
      file: glob,
      kind,
      matched: hits.length,
      rule,
      scope: escapes ? 'repo-wide' : 'targeted',
    }));
  });

/**
 * Every config-level React Doctor suppression that reaches a public package.
 *
 * `ignore.files` is folded in with a rule of `(all rules)` because excluding a
 * file from scanning is the widest suppression available here — wider than any
 * named rule — and would otherwise be the one mechanism with no row at all.
 */
export const findReactDoctorSuppressions = ({
  config,
  otherFiles,
  projectDirs,
  publicFiles,
}) => {
  const context = { otherFiles, projectDirs, publicFiles };
  return [
    ...GLOBAL_SOURCES.flatMap(({ label, pick }) =>
      pick(config).map((name) => ({
        file: 'doctor.config.jsonc',
        kind: 'react-doctor',
        rule: `${label} ${name}`,
        scope: 'repo-wide',
      })),
    ),
    ...globRows({
      context,
      globs: config.ignore?.files ?? [],
      kind: 'react-doctor',
      rules: ['(all rules)'],
    }),
    ...(config.ignore?.overrides ?? []).flatMap((override) =>
      globRows({
        context,
        globs: override.files ?? [],
        kind: 'react-doctor',
        rules: override.rules ?? ['(all rules)'],
      }),
    ),
  ];
};
