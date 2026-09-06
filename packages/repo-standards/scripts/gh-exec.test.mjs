import { describe, expect, it } from 'vite-plus/test';

import { assertGhArguments } from './gh-exec.mjs';

describe('assertGhArguments — what it lets through', () => {
  it('passes the vector back, so it can wrap a call site', () => {
    const args = ['api', 'repos/o/n/pulls/1'];
    expect(assertGhArguments(args)).toBe(args);
  });

  for (const subcommand of ['api', 'issue', 'pr', 'repo']) {
    it(`accepts \`gh ${subcommand}\`, which this tooling spawns`, () => {
      expect(() => assertGhArguments([subcommand, 'view'])).not.toThrow();
    });
  }

  it('accepts a flag-shaped argument after the subcommand', () => {
    expect(() =>
      assertGhArguments(['api', '--paginate', 'repos/o/n/issues']),
    ).not.toThrow();
  });
});

describe('assertGhArguments — what it refuses', () => {
  it('refuses a subcommand outside the set, naming the alternatives', () => {
    expect(() => assertGhArguments(['auth', 'token'])).toThrow(
      'api, issue, pr, repo',
    );
  });

  it('refuses a non-string entry rather than letting it stringify', () => {
    expect(() => assertGhArguments(['api', undefined])).toThrow('index 1');
  });

  it('names the type it found', () => {
    expect(() => assertGhArguments(['api', 7])).toThrow('is number');
  });

  for (const bad of [[], undefined, 'api pr view', { 0: 'api' }]) {
    it(`refuses ${JSON.stringify(bad) ?? 'undefined'} as a vector`, () => {
      expect(() => assertGhArguments(bad)).toThrow('non-empty argument vector');
    });
  }
});
