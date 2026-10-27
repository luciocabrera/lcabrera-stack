/*
 * The directory form of `devkit closure`, run the way a consumer runs it: the
 * hook directory comes from the configuration, not from the caller, and the
 * unchecked files reach the printed report.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runCommand } from './command-router.mjs';
import { scratchDirectories } from './create-fixtures.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const { drain, make } = scratchDirectories('devkit-closure-directory-');

afterEach(drain);

const writeIn = (root, path, content) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), content);
};

const closureOf = (root, directories) => {
  const silenced = silencedConsole(vi);
  try {
    const code = runCommand({ argv: ['closure', ...directories], root });
    return {
      code,
      printed: [
        ...silenced.log.mock.calls.flat(),
        ...silenced.error.mock.calls.flat(),
      ].join('\n'),
    };
  } finally {
    silenced.restore();
  }
};

describe('devkit closure over directories', () => {
  test('reads a hook in the configured directory even without a shebang', () => {
    const root = make();
    writeIn(root, 'scripts/verify.mjs', 'export {};\n');
    writeIn(root, '.githooks/pre-commit', 'node scripts/verify.mjs\n');
    writeIn(root, '.githooks/pre-push', 'node scripts/gone.mjs\n');

    const { code, printed } = closureOf(root, ['.githooks']);

    expect(code).toBe(1);
    expect(printed).toContain(
      '.githooks/pre-commit:1  needs scripts/verify.mjs',
    );
    expect(printed).toContain(
      '.githooks/pre-push:1  runs nonexistent scripts/gone.mjs',
    );
    expect(printed).not.toContain('unchecked  .githooks/');
  });

  test('reads the hook directory devkit.config.json names', () => {
    const root = make();
    writeIn(
      root,
      'devkit.config.json',
      `${JSON.stringify({ paths: { hooks: 'hooks' } })}\n`,
    );
    writeIn(root, 'hooks/pre-push', 'node scripts/gone.mjs\n');

    const { code, printed } = closureOf(root, ['hooks']);

    expect(code).toBe(1);
    expect(printed).toContain(
      'hooks/pre-push:1  runs nonexistent scripts/gone.mjs',
    );
  });

  test('lists a file no resolver for its kind reads', () => {
    const root = make();
    writeIn(root, 'db/README.md', '# Database\n');
    writeIn(root, 'db/setup.sql', 'select 1;\n');

    const { code, printed } = closureOf(root, ['db']);

    expect(code).toBe(0);
    expect(printed).toContain(
      '✓ db — no escapes; 1 file(s) read by a resolver for their kind',
    );
    expect(printed).toContain(
      'unchecked  db/setup.sql  no resolver for its kind',
    );
    expect(printed).not.toContain('unchecked  db/README.md');
  });
});
