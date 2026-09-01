import { describe, expect, test } from 'vite-plus/test';

import { countsFor, renderPlan } from './command-materialise.mjs';

const PATH = '.github/skills/demo/SKILL.md';

const acknowledged = {
  path: PATH,
  reason: 'our epic protocol has no wave cap',
  state: 'acknowledged',
};

const modified = { path: PATH, state: 'modified' };

describe('renderPlan and an acknowledged edit', () => {
  test('omits it by default — that is the whole point of acknowledging it', () => {
    expect(renderPlan([acknowledged])).toBe('Everything is up to date.');
  });

  test('lists it under --verbose, with the reason recorded for it', () => {
    expect(renderPlan([acknowledged], { verbose: true })).toBe(
      `  acknowledged ${PATH}  (left alone — acknowledged: our epic protocol has no wave cap)`,
    );
  });

  test('still reports an unacknowledged edit at the same verbosity', () => {
    expect(renderPlan([modified])).toBe(
      `  modified     ${PATH}  (left alone — locally modified)`,
    );
  });

  test('lines its path column up with the rows around it', () => {
    const [first, second] = renderPlan([acknowledged, modified], {
      verbose: true,
    }).split('\n');
    expect(first.indexOf(PATH)).toBe(second.indexOf(PATH));
  });
});

describe('countsFor and an acknowledged edit', () => {
  test('counts as neither reported nor written, so --check stays green', () => {
    expect(countsFor([acknowledged])).toEqual({ reported: 0, written: 0 });
    expect(countsFor([modified])).toEqual({ reported: 1, written: 0 });
  });
});
