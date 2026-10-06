import { describe, expect, it } from 'vite-plus/test';

import { contentHash } from './contentHash.util.ts';
import { fileSetHash } from './fileSetHash.util.ts';
import { sha256Hex } from './sha256Hex.util.ts';

const skillFile = { bytes: 'body\n', path: 'SKILL.md' };
const extraFile = { bytes: 'more\n', path: 'references/extra.md' };
const files = [skillFile, extraFile];

describe('fileSetHash', () => {
  it('hashes the sorted path and content-hash lines', () => {
    expect(fileSetHash(files)).toBe(
      sha256Hex(
        `SKILL.md\0${contentHash('body')}\nreferences/extra.md\0${contentHash('more')}\n`,
      ),
    );
  });

  it('does not depend on listing order', () => {
    expect(fileSetHash(files.toReversed())).toBe(fileSetHash(files));
  });

  it('changes when a file is renamed', () => {
    expect(
      fileSetHash([skillFile, { ...extraFile, path: 'references/x.md' }]),
    ).not.toBe(fileSetHash(files));
  });

  it('hashes CRLF and LF copies of the same files equal', () => {
    expect(
      fileSetHash(
        files.map(({ bytes, path }) => ({
          bytes: bytes.replaceAll('\n', '\r\n'),
          path,
        })),
      ),
    ).toBe(fileSetHash(files));
  });
});
