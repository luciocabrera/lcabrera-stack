import { Readable } from 'node:stream';

import { describe, expect, it } from 'vite-plus/test';

import { flagValue, readStdin } from './cli-input.mjs';

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
