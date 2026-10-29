/*
 * The shared command runner the packed-tarball gates read output through.
 */

import process from 'node:process';

import { describe, expect, it } from 'vite-plus/test';

import { run } from './devkit-pack.mjs';

const BYTES = 4 * 1024 * 1024;

describe('run', () => {
  it('returns output past the 1 MiB child-process default whole', () => {
    const output = run(
      process.execPath,
      ['-e', `process.stdout.write('x'.repeat(${BYTES}))`],
      process.cwd(),
    );
    expect(output).toHaveLength(BYTES);
  });
});
