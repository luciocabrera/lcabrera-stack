/**
 * Asserts that the release path still packs with pnpm
 * (verify-publish-surface.mjs).
 *
 * The published `exports` come from `publishConfig.exports`, and applying that
 * override is a pnpm extension: `npm pack` produces a tarball still pointing at
 * `./src`, which a consumer cannot load (ADR-057). Changesets picks its
 * publishing tool by detecting the lockfile, so the guarantee rests on facts
 * nobody states out loud — the lockfile's name, the pinned package manager, and
 * one line of the release workflow. This module states them. ADR-073 records
 * why they are asserted rather than removed.
 */

const FOREIGN_LOCKFILES = ['package-lock.json', 'yarn.lock', 'bun.lockb'];

export const stripComments = (text) =>
  text
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

const lockfileProblems = (lockfiles) => [
  ...(lockfiles.includes('pnpm-lock.yaml')
    ? []
    : [
        'no pnpm-lock.yaml at the repo root — changesets picks its publish tool by detecting the lockfile, so without it the packages would be packed by npm, whose tarball ignores publishConfig.exports.',
      ]),
  ...FOREIGN_LOCKFILES.filter((name) => lockfiles.includes(name)).map(
    (name) =>
      `${name} is at the repo root beside pnpm-lock.yaml — changesets detects the lockfile to choose its publish tool, and a second one makes that choice ambiguous.`,
  ),
];

export const releasePackerProblems = ({
  lockfiles,
  packageManager,
  workflowText,
}) => {
  const commands = stripComments(workflowText);
  return [
    ...lockfileProblems(lockfiles),
    ...(String(packageManager).startsWith('pnpm@')
      ? []
      : [
          `the root \`packageManager\` field is ${JSON.stringify(packageManager)}, not a pnpm version — the publish would not use pnpm, and only pnpm applies publishConfig.exports.`,
        ]),
    ...(commands.includes('pnpm exec changeset publish')
      ? []
      : [
          'the release workflow no longer runs `pnpm exec changeset publish` — the published tarball is only correct when pnpm packs it, so a different publish command needs this gate revisited (see ADR-073).',
        ]),
    ...(/\bnpm publish/.test(commands)
      ? [
          'the release workflow runs `npm publish` — npm ignores publishConfig.exports, so the tarball would export ./src and fail to load from a consumer node_modules.',
        ]
      : []),
    ...(/\bnpx\b/.test(commands)
      ? [
          'the release workflow runs `npx` — it resolves and runs a fetched package rather than the locked one, which is how an npm-based publish path gets in by accident.',
        ]
      : []),
  ];
};
