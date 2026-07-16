import { describe, expect, it } from 'vitest';

import { runGit } from './runGit.util.ts';

describe('runGit', () => {
  it('returns trimmed stdout for a successful subcommand', () => {
    const version = runGit({ cwd: '/', gitArgs: ['--version'] });

    expect(version).toMatch(/^git version /);
  });

  it('returns undefined when git fails', () => {
    const result = runGit({ cwd: '/', gitArgs: ['rev-parse', 'HEAD'] });

    expect(result).toBeUndefined();
  });
});
