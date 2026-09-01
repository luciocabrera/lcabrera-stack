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
 * that makes the public packages structurally suppression-free does
 * nothing here. Without this, adopting React Doctor would have added three
 * unpoliced ways to silence a finding in exactly the packages AGENTS.md §1
 * holds strictest.
 */

import { globMatches } from './suppressions.mjs';

const WEAK_LEVELS = new Set(['off', 'warn']);

const GLOBAL_SOURCES = [
  { label: 'rule', pick: (config) => weakKeys(config.rules) },
  { label: 'category', pick: (config) => weakKeys(config.categories) },
  { label: 'bucket', pick: (config) => weakKeys(config.buckets) },
  { label: 'ignored rule', pick: (config) => config.ignore?.rules ?? [] },
  { label: 'ignored tag', pick: (config) => config.ignore?.tags ?? [] },
];

const weakKeys = (entries) =>
  Object.entries(entries ?? {})
    .filter(([, level]) => WEAK_LEVELS.has(level))
    .map(([name]) => name);

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
