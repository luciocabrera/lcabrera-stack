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
    // The whole point: taze writes `packageManager` too, so a read after it can
    // never differ from the final value.
    expect(captured).toBeLessThan(tazeWrote);
  });

  it('decides on the field rather than on corepack exit status', () => {
    expect(script).toContain('scripts/verify-package-manager-pin.mjs');
    // The old message announced the opposite of what a post-write failure did.
    expect(script).not.toContain('continuing with the current pnpm');
  });

  it('expands the corepack flag array in the bash-3.2-safe form', () => {
    // `"${a[@]}"` on an EMPTY array aborts under `set -u` before bash 4.4, and
    // this array is empty on the success path — so the plain form breaks the
    // normal run, not the failing one. Nothing under scripts/ uses a bash-4-only
    // construct, so the 3.2 floor is deliberate and this must stay guarded.
    // Matched by regex, not by a plain string: a literal `${` inside one trips
    // Biome's noTemplateCurlyInString, and the shell form is the whole subject.
    expect(script).toMatch(
      /\$\{corepack_failed\[@\]\+"\$\{corepack_failed\[@\]\}"\}/u,
    );
    expect(script).not.toMatch(/"\$\{corepack_failed\[@\]\}" \|\|/u);
  });

  it('no longer claims taze leaves packageManager alone', () => {
    // This sentence is what put the capture in the wrong place. If it comes
    // back, the reasoning that produced the bug has come back with it.
    expect(script).not.toContain('taze does not touch the `packageManager`');
  });
});
