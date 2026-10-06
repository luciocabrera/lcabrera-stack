import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { contentHash } from './contentHash.util.ts';
import { sha256Hex } from './sha256Hex.util.ts';

describe('contentHash', () => {
  it('hashes CRLF and LF copies of the same text equal', () => {
    expect(contentHash('one\r\ntwo\r\n')).toBe(contentHash('one\ntwo\n'));
  });

  it('hashes bytes and the text they decode to equal', () => {
    expect(contentHash(new TextEncoder().encode('one\r\n'))).toBe(
      contentHash('one'),
    );
  });

  it('hashes the normalized text', () => {
    expect(contentHash('one')).toBe(sha256Hex('one\n'));
  });

  it('tells apart text that differs in trailing spaces', () => {
    expect(contentHash('one  ')).not.toBe(contentHash('one'));
  });
});

describe('contentHash under plain node', () => {
  it('loads through the package exports without a TypeScript loader', () => {
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        String.raw`import { contentHash } from '@repo/eval-history/hashing/contentHash.util'; process.stdout.write(contentHash('one\r\n'));`,
      ],
      {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        encoding: 'utf8',
      },
    );

    expect(output).toBe(contentHash('one'));
  });
});
