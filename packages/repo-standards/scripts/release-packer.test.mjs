import { describe, expect, it } from 'vite-plus/test';

import { releasePackerProblems, stripComments } from './release-packer.mjs';

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
