/*
 * Structural guards on `scripts/deps-refresh.sh`'s handling of the
 * `packageManager` pin (#927).
 *
 * These assert ORDER and ABSENCE, which no unit test of the pin module can
 * reach. The original defect was not a wrong function — it was a correct read
 * taken one step too late, after taze had already moved the value it existed to
 * capture, which made the block below it unreachable. A reader re-tidying this
 * script would not see anything wrong; this test is what fails instead.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = readFileSync(
  join(REPO_ROOT, 'scripts', 'deps-refresh.sh'),
  'utf8',
);

describe('deps-refresh.sh and the packageManager pin', () => {
  it('captures the pin before taze can rewrite it', () => {
    const captured = script.indexOf('pnpm_before="$(package_manager_pin');
    const tazeWrote = script.indexOf('taze@latest -r --write');

    expect(captured, 'pnpm_before is never captured').toBeGreaterThan(-1);
    expect(
      tazeWrote,
      'the taze --write call moved or was renamed',
    ).toBeGreaterThan(-1);
    expect(captured).toBeLessThan(tazeWrote);
  });

  it('decides on the field rather than on corepack exit status', () => {
    expect(script).toContain('scripts/verify-package-manager-pin.mjs');
    expect(script).not.toContain('continuing with the current pnpm');
  });

  it('expands the corepack flag array in the bash-3.2-safe form', () => {
    expect(script).toMatch(
      /\$\{corepack_failed\[@\]\+"\$\{corepack_failed\[@\]\}"\}/u,
    );
    expect(script).not.toMatch(/"\$\{corepack_failed\[@\]\}" \|\|/u);
  });

  it('no longer claims taze leaves packageManager alone', () => {
    expect(script).not.toContain('taze does not touch the `packageManager`');
  });
});

describe('deps-refresh.sh and the pins devkit emits', () => {
  it('rewrites the devkit copies after corepack has written the root pin', () => {
    const corepackWrote = script.indexOf('use pnpm@latest');
    const synced = script.indexOf('node scripts/sync-devkit-pins.mjs');

    expect(
      corepackWrote,
      'the corepack call moved or was renamed',
    ).toBeGreaterThan(-1);
    expect(synced, 'the devkit pins are never synced').toBeGreaterThan(-1);
    expect(synced).toBeGreaterThan(corepackWrote);
  });
});
