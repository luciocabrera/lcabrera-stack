import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { releasePackerProblems, stripComments } from './release-packer.mjs';

// What these assertions defend: the published `exports` come from
// `publishConfig.exports`, and substituting that field is a pnpm extension. The
// tarball is only correct because changesets shells out to `pnpm publish` —
// nothing else in the repo says so, which is why it is asserted here.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RELEASE_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'release.yml');

const healthy = {
  lockfiles: ['package.json', 'pnpm-lock.yaml'],
  packageManager: 'pnpm@11.21.0',
  workflowText: 'run: pnpm exec changeset publish\n',
};

describe('stripComments', () => {
  it('drops whole-line comments and keeps commands', () => {
    expect(
      stripComments('  # never npx\nrun: pnpm exec changeset publish\n'),
    ).toBe('run: pnpm exec changeset publish\n');
  });
});

describe('releasePackerProblems', () => {
  it('accepts the pnpm publish path', () => {
    expect(releasePackerProblems(healthy)).toEqual([]);
  });

  it('rejects a workflow that publishes with npm', () => {
    const problems = releasePackerProblems({
      ...healthy,
      workflowText: 'run: npm publish --workspaces\n',
    });

    expect(problems).toHaveLength(2);
    expect(problems.join('\n')).toContain('npm publish');
  });

  it('does not read `pnpm publish` as `npm publish`', () => {
    // The substring is there; the word boundary is not. Checking with
    // `includes` would fail the healthy path and teach the next reader to
    // weaken the assertion.
    expect(
      releasePackerProblems({
        ...healthy,
        workflowText: 'run: pnpm exec changeset publish\nrun: pnpm publish\n',
      }),
    ).toEqual([]);
  });

  it('ignores npx mentioned only in a comment', () => {
    expect(
      releasePackerProblems({
        ...healthy,
        workflowText: `# \`pnpm exec\`, never \`npx\`\n${healthy.workflowText}`,
      }),
    ).toEqual([]);
  });

  it('rejects npx in a command', () => {
    expect(
      releasePackerProblems({
        ...healthy,
        workflowText: `${healthy.workflowText}run: npx changeset publish\n`,
      }).join('\n'),
    ).toContain('npx');
  });

  it('rejects a missing pnpm lockfile', () => {
    expect(
      releasePackerProblems({ ...healthy, lockfiles: ['package.json'] }).join(
        '\n',
      ),
    ).toContain('pnpm-lock.yaml');
  });

  it('rejects a second lockfile that makes the detection ambiguous', () => {
    expect(
      releasePackerProblems({
        ...healthy,
        lockfiles: [...healthy.lockfiles, 'package-lock.json'],
      }).join('\n'),
    ).toContain('package-lock.json');
  });

  it('rejects a packageManager that is not pnpm', () => {
    expect(
      releasePackerProblems({
        ...healthy,
        packageManager: 'npm@11.0.0',
      }).join('\n'),
    ).toContain('packageManager');
  });
});

describe('this repository', () => {
  it('still publishes through pnpm', () => {
    expect(
      releasePackerProblems({
        lockfiles: readdirSync(REPO_ROOT),
        packageManager: JSON.parse(
          readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
        ).packageManager,
        workflowText: readFileSync(RELEASE_WORKFLOW, 'utf8'),
      }),
    ).toEqual([]);
  });
});
