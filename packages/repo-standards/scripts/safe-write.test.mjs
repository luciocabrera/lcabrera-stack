import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { writeTextWithin } from './safe-write.mjs';

let root;

beforeAll(() => {
  root = resolve(mkdtempSync(join(tmpdir(), 'safe-write-')));
});

afterAll(() => {
  rmSync(root, { force: true, recursive: true });
});

describe('writeTextWithin', () => {
  it('writes a file inside the root and returns where it went', () => {
    const written = writeTextWithin(join(root, 'out.json'), '{"a":1}', root);
    expect(written).toBe(join(root, 'out.json'));
    expect(readFileSync(written, 'utf8')).toBe('{"a":1}');
  });

  it('refuses a path that escapes the root', () => {
    expect(() =>
      writeTextWithin(join(root, '..', 'escaped'), 'x', root),
    ).toThrow(/refusing to write a file outside the repository/u);
  });

  it('refuses when no usable root is given', () => {
    expect(() => writeTextWithin(join(root, 'x'), 'x', '')).toThrow(
      /refusing to write/u,
    );
  });

  it('accepts a path under an extra root', () => {
    const other = resolve(mkdtempSync(join(tmpdir(), 'safe-write-extra-')));
    const written = writeTextWithin(join(other, 'o.txt'), 'hi', root, [other]);
    expect(readFileSync(written, 'utf8')).toBe('hi');
    rmSync(other, { force: true, recursive: true });
  });
});
