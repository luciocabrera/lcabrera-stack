/**
 * The scaffolding devkit's suites share.
 *
 * Every case supplies its own assets and, for the peer suite, its own installed
 * versions; all of them pass the same default config, an empty manifest, and an
 * `onDiskHash` that reports nothing on disk. Written twice, that trio was the
 * longest duplicated span in the package — and a fallow entry for a public
 * package is a suppression, which these packages take none of, so it could not
 * be baselined away.
 *
 * Test scaffolding, excluded from the package by the `files` test exclusion.
 */
import { DEFAULT_CONFIG } from './config.mjs';
import { planSync } from './sync.mjs';

export const noFilesManifest = { files: {} };

export const planWith = (overrides) =>
  planSync({
    config: DEFAULT_CONFIG,
    manifest: noFilesManifest,
    onDiskHash: () => undefined,
    ...overrides,
  });

/**
 * Whether a serialised register is stable: paths in order, trailing newline.
 *
 * Facts rather than assertions, so this module stays out of the test runner's
 * import graph and each suite keeps its own `expect`.
 *
 * @param {string} raw
 * @param {readonly [string, string]} paths
 * @returns {{ endsWithNewline: boolean, ordered: boolean }}
 */
export const serialisationFacts = (raw, [first, second]) => ({
  endsWithNewline: raw.endsWith('\n'),
  ordered: raw.indexOf(first) < raw.indexOf(second),
});

/**
 * A skill whose body escapes its own directory three ways — a link up and out, a
 * command, and an import of a workspace package — plus the script that carries
 * the import.
 *
 * `frontmatter` is the only thing the closure suites vary: one adds a `requires`
 * declaration to make a fourth kind, the other does not.
 *
 * @param {readonly string[]} [frontmatter]
 */
export const escapingSkillFiles = (frontmatter = []) => [
  {
    content: [
      ...(frontmatter.length > 0 ? ['---', ...frontmatter, '---', ''] : []),
      'Read [the contract](../../docs/agents/contract.md).',
      '',
      '```bash',
      'vp run test',
      '```',
    ].join('\n'),
    path: 'skills/epic/SKILL.md',
  },
  {
    content: "import { scan } from '@repo/example-scan/deterministic-scan';",
    path: 'skills/epic/scripts/run.mjs',
  },
];

/** @param {readonly {kind: string}[]} escapes */
export const escapeKinds = (escapes) =>
  escapes
    .map((finding) => finding.kind)
    .toSorted((left, right) => left.localeCompare(right));

/**
 * The two halves of "every spelling of one declaration behaves the same": what
 * each spelling actually produced, and the map saying all of them produced the
 * expected thing.
 *
 * Both sync suites make this comparison — one over `requires:`, one over
 * `peer:` — and only the spellings and the expected value differ.
 *
 * @param {Record<string, readonly string[]>} spellings
 * @param {(entry: [string, readonly string[]]) => [string, unknown]} outcome
 */
export const outcomePerSpelling = (spellings, outcome) =>
  Object.fromEntries(Object.entries(spellings).map((value) => outcome(value)));

/**
 * @param {Record<string, readonly string[]>} spellings
 * @param {unknown} expected
 */
export const samePerSpelling = (spellings, expected) =>
  Object.fromEntries(
    Object.keys(spellings).map((spelling) => [spelling, expected]),
  );
