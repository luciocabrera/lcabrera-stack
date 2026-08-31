import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_CONFIG,
  PROFILES,
  targetPathFor,
  withProfile,
} from './config.mjs';

describe('profiles', () => {
  test('every group any profile names has a directory to land in', () => {
    const grouped = new Set(Object.values(PROFILES).flat());
    const placed = Object.keys(DEFAULT_CONFIG.paths);
    expect([...grouped].filter((group) => !placed.includes(group))).toEqual([]);
  });

  test('full is a superset of agent, never a different set', () => {
    expect(PROFILES.full).toEqual(expect.arrayContaining([...PROFILES.agent]));
    expect(PROFILES.full.length).toBeGreaterThan(PROFILES.agent.length);
  });

  test('the scaffolding groups are in full and out of agent', () => {
    for (const group of [
      'workflows',
      'hooks',
      'templates',
      'decisions',
      'root',
    ]) {
      expect(PROFILES.full).toContain(group);
      expect(PROFILES.agent).not.toContain(group);
    }
  });
});

describe('withProfile', () => {
  test('applies a profile this package knows', () => {
    expect(
      withProfile({ config: DEFAULT_CONFIG, profile: 'full' }).profile,
    ).toBe('full');
  });

  test('refuses one it does not, rather than placing nothing', () => {
    expect(() =>
      withProfile({ config: DEFAULT_CONFIG, profile: 'agnet' }),
    ).toThrow(/unknown profile "agnet"/);
  });

  test('names where the bad value came from', () => {
    expect(() =>
      withProfile({ config: DEFAULT_CONFIG, profile: 'x', source: 'a.json' }),
    ).toThrow(/^a\.json:/);
  });
});

describe('targetPathFor', () => {
  test('places a root-group asset at the repository root, unprefixed', () => {
    expect(
      targetPathFor({ assetPath: 'root/COMMANDS.md', config: DEFAULT_CONFIG }),
    ).toBe('COMMANDS.md');
  });

  test('reads every spelling of the repository root the same way', () => {
    for (const root of ['', '.', './']) {
      expect(
        targetPathFor({
          assetPath: 'root/COMMANDS.md',
          config: {
            ...DEFAULT_CONFIG,
            paths: { ...DEFAULT_CONFIG.paths, root },
          },
        }),
      ).toBe('COMMANDS.md');
    }
  });

  test('leaves an ordinary group prefixed by its configured directory', () => {
    expect(
      targetPathFor({
        assetPath: 'workflows/check.yml',
        config: DEFAULT_CONFIG,
      }),
    ).toBe('.github/workflows/check.yml');
  });

  test('answers nothing for a group this config does not place', () => {
    expect(
      targetPathFor({ assetPath: 'nowhere/file.md', config: DEFAULT_CONFIG }),
    ).toBeUndefined();
  });
});
