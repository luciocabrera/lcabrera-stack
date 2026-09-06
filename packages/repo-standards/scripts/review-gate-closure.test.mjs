import { describe, expect, it } from 'vite-plus/test';

import { gateClosure, localModuleClosure } from './review-gate-reconcile.mjs';

const FILES = {
  'scripts/gate.mjs':
    "import { a } from './lib/a.mjs';\nimport('./lib/b.mjs');\nimport { x } from 'node:fs';\n",
  'scripts/lib/a.mjs':
    "import { shared } from '../../packages/kit/shared.mjs';\n",
  'scripts/lib/b.mjs': "export { a } from './a.mjs';\n",
  'packages/kit/shared.mjs': 'export const shared = 1;\n',
  'scripts/driver.mjs': "import { run } from './lib/driver-only.mjs';\n",
  'scripts/lib/driver-only.mjs': 'export const run = () => {};\n',
};

const readFile = (path) => FILES[path];

describe('localModuleClosure', () => {
  it('walks relative imports of every form and normalises the paths it visits', () => {
    expect(
      localModuleClosure({ entry: './scripts/gate.mjs', readFile }),
    ).toEqual([
      'packages/kit/shared.mjs',
      'scripts/gate.mjs',
      'scripts/lib/a.mjs',
      'scripts/lib/b.mjs',
    ]);
  });

  it('keeps a module it cannot read in the closure and stops there', () => {
    expect(
      localModuleClosure({
        entry: 'scripts/lib/b.mjs',
        readFile: (path) =>
          path === 'scripts/lib/b.mjs' ? FILES[path] : undefined,
      }),
    ).toEqual(['scripts/lib/a.mjs', 'scripts/lib/b.mjs']);
  });

  it('visits a module once however many paths reach it', () => {
    const closure = localModuleClosure({ entry: 'scripts/gate.mjs', readFile });
    expect(new Set(closure).size).toBe(closure.length);
  });
});

describe('gateClosure', () => {
  it('unions the driver closure with the gate closure', () => {
    expect(
      gateClosure({
        driverEntry: 'scripts/driver.mjs',
        entry: 'scripts/gate.mjs',
        readFile,
      }),
    ).toEqual([
      'packages/kit/shared.mjs',
      'scripts/driver.mjs',
      'scripts/gate.mjs',
      'scripts/lib/a.mjs',
      'scripts/lib/b.mjs',
      'scripts/lib/driver-only.mjs',
    ]);
  });
});
