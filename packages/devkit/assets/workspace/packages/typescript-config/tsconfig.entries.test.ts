import { expect, test } from 'vite-plus/test';

import { configs } from './tsconfig.entries.ts';

test('the roster is not empty, so the generator writes something', () => {
  expect(configs.length).toBeGreaterThan(0);
});

test('every generated config is strict and emits nothing', () => {
  for (const entry of configs) {
    expect(entry.config.compilerOptions.strict).toBe(true);
    expect(entry.config.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(entry.config.compilerOptions.noEmit).toBe(true);
  }
});

test('no two entries write the same file', () => {
  const paths = configs.map((entry) => entry.filePath);
  expect(new Set(paths).size).toBe(paths.length);
});
