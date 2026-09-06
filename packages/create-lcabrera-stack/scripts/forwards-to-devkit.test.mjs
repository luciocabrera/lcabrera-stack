/*
 * That the initializer reaches `devkit create`, and reaches nothing else.
 *
 * The bin is one spawn, so it is asserted by spawning it: what a consumer sees
 * is the wrapped CLI's own output, and a shim that resolved the wrong package
 * or the wrong subcommand would still exit and print something.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vite-plus/test';

const BIN = join(
  dirname(fileURLToPath(import.meta.url)),
  'create-lcabrera-stack.mjs',
);

const run = (args) =>
  spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });

describe('create-lcabrera-stack', () => {
  test("answers --help with the wrapped CLI's own usage", () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('devkit create');
  });

  test('runs the create subcommand, not another one', () => {
    const { status, stderr } = run([]);
    expect(status).toBe(1);
    expect(stderr).toContain('create:');
    expect(stderr).toContain('devkit init');
  });

  test('passes the flags it was given straight through', () => {
    const { status, stderr } = run(['demo', '--profile', 'kitchen-sink']);
    expect(status).toBe(1);
    expect(stderr).toContain('unknown profile "kitchen-sink"');
  });
});
