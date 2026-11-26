import { describe, expect, it, vi } from 'vite-plus/test';

import { runGh } from '../../packages/repo-standards/scripts/gh-exec.mjs';
import { createIssue, startsWithDash } from './plan-issues-github.mjs';

vi.mock('../../packages/repo-standards/scripts/gh-exec.mjs', () => ({
  runGh: vi.fn(() => 'https://github.com/owner/repo/issues/42\n'),
}));

const issue = (overrides) => ({
  id: 'E-1',
  title: 'fix(scripts): something',
  labels: [],
  milestone: '',
  ...overrides,
});

const options = () => ({ dryRun: false, log: () => undefined });

describe('startsWithDash', () => {
  for (const value of ['-x', '--label', '--']) {
    it(`is true for ${JSON.stringify(value)}`, () => {
      expect(startsWithDash(value)).toBe(true);
    });
  }

  for (const value of [
    'fix(scripts): something',
    'M1 — Foundations',
    'a-b',
    '',
    undefined,
  ]) {
    it(`is false for ${JSON.stringify(value)}`, () => {
      expect(startsWithDash(value)).toBe(false);
    });
  }
});

describe('createIssue refuses a dash-leading value', () => {
  it('refuses a title starting with a dash, before spawning gh', () => {
    expect(() =>
      createIssue(issue({ title: '--label chore' }), 'body.md', options()),
    ).toThrow('issue E-1 title');
  });

  it('refuses a milestone starting with a dash', () => {
    expect(() =>
      createIssue(issue({ milestone: '--milestone x' }), 'body.md', options()),
    ).toThrow('issue E-1 milestone');
  });

  it('refuses a label starting with a dash', () => {
    expect(() =>
      createIssue(issue({ labels: ['--repo owner/x'] }), 'body.md', options()),
    ).toThrow('issue E-1 label');
  });

  it('refuses a body path starting with a dash', () => {
    expect(() =>
      createIssue(issue({}), '--body-file /etc/passwd', options()),
    ).toThrow('issue E-1 body path');
  });

  it('names the offending value', () => {
    expect(() =>
      createIssue(issue({ title: '--label chore' }), 'body.md', options()),
    ).toThrow(JSON.stringify('--label chore'));
  });

  it('lets an ordinary plan through to the dry-run path', () => {
    expect(
      createIssue(
        issue({ labels: ['type: chore'], milestone: 'M1 — Foundations' }),
        'body.md',
        { dryRun: true, log: () => undefined },
      ),
    ).toBe(0);
  });
});

describe('createIssue', () => {
  it('passes the body path inside its flag, so gh cannot read it as an option', () => {
    const number = createIssue(
      issue({ labels: ['type: chore'], milestone: 'M1' }),
      'plans/E-1.md',
      options(),
    );

    expect(number).toBe(42);
    expect(runGh).toHaveBeenLastCalledWith([
      'issue',
      'create',
      '--title',
      'fix(scripts): something',
      '--body-file=plans/E-1.md',
      '--label',
      'type: chore',
      '--milestone',
      'M1',
    ]);
  });
});
