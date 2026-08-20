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
    // Quiet is not gone. An acknowledgement nobody can read is one nobody can
    // revisit, and revisiting it is the only way it is ever removed.
    expect(renderPlan([acknowledged], { verbose: true })).toBe(
      `  acknowledged ${PATH}  (left alone — acknowledged: our epic protocol has no wave cap)`,
    );
  });

  test('still reports an unacknowledged edit at the same verbosity', () => {
    // Otherwise "quiet under --verbose" and "quiet because acknowledged" would
    // be the same observation.
    expect(renderPlan([modified])).toBe(
      `  modified   ${PATH}  (left alone — locally modified)`,
    );
  });
});

describe('countsFor and an acknowledged edit', () => {
  test('counts as neither reported nor written, so --check stays green', () => {
    // The reason this exists: one deliberate edit must not make a CI gate red
    // for ever.
    expect(countsFor([acknowledged])).toEqual({ reported: 0, written: 0 });
    expect(countsFor([modified])).toEqual({ reported: 1, written: 0 });
  });
});
