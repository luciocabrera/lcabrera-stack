import process from 'node:process';
import { describe, expect, it, vi } from 'vite-plus/test';

import { assertGhArguments, parsePullRequests } from './gh-exec.mjs';

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

describe('parsePullRequests', () => {
  const WARNING = 'warning: the board is running blind\n';

  const parse = (raw) => {
    const written = [];
    const spy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation((chunk) => {
        written.push(String(chunk));
        return true;
      });
    try {
      return { result: parsePullRequests(raw, { warning: WARNING }), written };
    } finally {
      spy.mockRestore();
    }
  };

  it('hands back the array gh wrote', () => {
    const { result, written } = parse('[{"number":1},{"number":2}]');
    expect(result).toEqual([{ number: 1 }, { number: 2 }]);
    expect(written).toEqual([]);
  });

  it('reads an empty list as an empty list', () => {
    const { result, written } = parse('[]');
    expect(result).toEqual([]);
    expect(written).toEqual([]);
  });

  it('says nothing about no output, because there is nothing to say', () => {
    for (const raw of ['', '   \n']) {
      const { result, written } = parse(raw);
      expect(result).toEqual([]);
      expect(written).toEqual([]);
    }
  });

  it('warns when the output is not JSON', () => {
    const { result, written } = parse('gh: command failed');
    expect(result).toEqual([]);
    expect(written).toEqual([WARNING]);
  });

  it('warns when the output is JSON that is not a list', () => {
    const { result, written } = parse('{"message":"Not Found"}');
    expect(result).toEqual([]);
    expect(written).toEqual([WARNING]);
  });
});
