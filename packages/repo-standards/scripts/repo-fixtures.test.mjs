import { existsSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createFixtureRoots } from './repo-fixtures.mjs';

const roots = createFixtureRoots('repo-fixtures-');

afterEach(roots.removeAll);

describe('createFixtureRoots drained in afterEach', () => {
  const made = [];

  it.fails('makes a root and then throws', () => {
    made.push(roots.make());
    expect(existsSync(made[0])).toBe(true);
    throw new Error('the test failed after making its root');
  });

  it('finds the failed test root removed', () => {
    expect(made).toHaveLength(1);
    expect(existsSync(made[0])).toBe(false);
  });
});
