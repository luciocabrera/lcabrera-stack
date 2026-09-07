/*
 * The size gate's planted violation, split from `devkit-tarball.test.mjs` for
 * size — the ceiling in `.claude/rules/scripts.md` counts test files too.
 *
 * The plant is only a control while it is oversized for the ceiling the scratch
 * consumer resolves, so it is measured here with the counter the gate applies.
 */
import { countCodeLines } from '../../packages/repo-standards/scripts/script-size.mjs';
import { describe, expect, it } from 'vite-plus/test';

import { oversizedScript } from './devkit-tarball.mjs';

const CEILINGS = [1, 350, 600, 5000];

describe('oversizedScript', () => {
  it('breaches whatever ceiling the consumer resolves', () => {
    for (const ceiling of CEILINGS) {
      expect(countCodeLines(oversizedScript(ceiling))).toBeGreaterThan(ceiling);
    }
  });

  it('tracks the ceiling upward rather than sitting at a constant', () => {
    const sizes = CEILINGS.map((ceiling) =>
      countCodeLines(oversizedScript(ceiling)),
    );

    expect(sizes).toEqual([...sizes].toSorted((left, right) => left - right));
    expect(new Set(sizes).size).toBe(CEILINGS.length);
  });

  it('is why a plant sized for one ceiling cannot serve a higher one', () => {
    expect(countCodeLines(oversizedScript(350))).toBeLessThan(600);
  });
});
