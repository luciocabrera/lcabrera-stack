import { Readable } from 'node:stream';

import { describe, expect, it } from 'vite-plus/test';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
  readStdin,
} from './cli-input.mjs';

describe('flagValue', () => {
  const argv = ['node', 'script.mjs', '--body-file', 'issue.md', '--write'];

  it('returns the value following the flag', () => {
    expect(flagValue('--body-file', argv)).toBe('issue.md');
  });

  it('returns undefined when the flag is absent', () => {
    expect(flagValue('--title', argv)).toBeUndefined();
  });

  it('returns undefined for a trailing flag with no value', () => {
    // Every caller treats "absent" and "given nothing" alike; throwing here
    // would replace a gate's usage message with a stack trace.
    expect(flagValue('--write', argv)).toBeUndefined();
  });

  it('takes the first occurrence when a flag is repeated', () => {
    expect(flagValue('--a', ['--a', 'one', '--a', 'two'])).toBe('one');
  });

  it('does not match a flag by prefix', () => {
    expect(flagValue('--body', ['--body-file', 'x.md'])).toBeUndefined();
  });

  it('reads a value that itself looks like a flag', () => {
    expect(flagValue('--reason', ['--reason', '--not-a-flag'])).toBe(
      '--not-a-flag',
    );
  });
});

describe('readStdin', () => {
  it('concatenates every chunk', async () => {
    const stream = Readable.from([Buffer.from('one '), Buffer.from('two')]);
    await expect(readStdin(stream)).resolves.toBe('one two');
  });

  it('returns empty string for a TTY rather than hanging', async () => {
    // The guard that stops an interactive run blocking on a read that will
    // never receive data.
    await expect(readStdin({ isTTY: true })).resolves.toBe('');
  });

  it('returns empty string for an empty pipe', async () => {
    await expect(readStdin(Readable.from([]))).resolves.toBe('');
  });

  it('decodes multi-byte utf8 split across chunks', async () => {
    const full = Buffer.from('café', 'utf8');
    const stream = Readable.from([full.subarray(0, 3), full.subarray(3)]);
    await expect(readStdin(stream)).resolves.toBe('café');
  });
});

// Both parsers guard an argv value that is otherwise interpolated straight into
// a `gh api` path. The failure they exist to stop is not a crash — it is a bare
// `Not Found (HTTP 404)` that never mentions the value that caused it, which is
// what `--pr '#738'` produced before: `pulls/NaN`, one 404 per gate, and nothing
// pointing at the input. So every case below asserts BOTH directions: what is
// accepted, and that what is rejected says which value was wrong.

describe('parsePullNumber — what it accepts', () => {
  it('takes a plain number, as a string or a number', () => {
    expect(parsePullNumber('738')).toBe(738);
    expect(parsePullNumber(738)).toBe(738);
  });

  it('takes the #738 form this repository writes everywhere else', () => {
    // The reason the parser exists. `Number('#738')` is NaN, and NaN reaching a
    // gate runs it against `pulls/NaN`.
    expect(parsePullNumber('#738')).toBe(738);
  });

  it('tolerates surrounding whitespace, which a paste brings along', () => {
    expect(parsePullNumber('  #738 ')).toBe(738);
  });
});

describe('parsePullNumber — what it refuses, and how loudly', () => {
  // Each of these reached an API path before, or fell through to "no pull
  // request named" — which for the sweep meant reconciling every open one.
  for (const bad of ['abc', '', '   ', '0', '-1', '738x', '#', '#abc', '7.5']) {
    it(`refuses ${JSON.stringify(bad)}, naming it in the message`, () => {
      expect(() => parsePullNumber(bad)).toThrow('--pr must be');
      // A string, not a regex: `7.5` and `../../user` contain metacharacters, so
      // a regex built from the fixture would match more than the fixture.
      expect(() => parsePullNumber(bad)).toThrow(JSON.stringify(bad));
    });
  }

  it('refuses absent input rather than defaulting to something', () => {
    expect(() => parsePullNumber(undefined)).toThrow(/--pr must be/);
    expect(() => parsePullNumber(null)).toThrow(/--pr must be/);
  });

  it('refuses a number too large to be exact, which would silently shift', () => {
    expect(() => parsePullNumber('9007199254740993')).toThrow(/--pr must be/);
  });
});

describe('parseRepository', () => {
  it('takes owner/name, including the dots and dashes GitHub allows', () => {
    expect(parseRepository('luciocabrera/vite-react-compiler')).toBe(
      'luciocabrera/vite-react-compiler',
    );
    expect(parseRepository(' some-owner/repo.name_v2 ')).toBe(
      'some-owner/repo.name_v2',
    );
  });

  for (const bad of ['', 'foo', 'a/b/c', '/name', 'owner/', '../../user']) {
    it(`refuses ${JSON.stringify(bad)}, naming it in the message`, () => {
      // `''` is the one that mattered: `??` never caught it, so it reached the
      // log as "Reconciling 1 pull request(s) in ." — the repository invisible
      // behind a full stop — and then a 404 per gate.
      expect(() => parseRepository(bad)).toThrow('--repo must be owner/name');
      expect(() => parseRepository(bad)).toThrow(JSON.stringify(bad));
    });
  }
});

describe('flagValue and the runner separator', () => {
  it('reads the value that follows the flag', () => {
    expect(flagValue('--body-file', ['node', 'x', '--body-file', 'a.md'])).toBe(
      'a.md',
    );
  });

  it('steps over a separator a task runner forwarded between the two', () => {
    expect(
      flagValue('--body-file', ['node', 'x', '--body-file', '--', 'a.md']),
    ).toBe('a.md');
  });

  it('is undefined when the flag is absent', () => {
    expect(flagValue('--body-file', ['node', 'x'])).toBeUndefined();
  });
});
