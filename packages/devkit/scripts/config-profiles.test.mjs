import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_CONFIG,
  PROFILES,
  targetPathFor,
  withProfile,
} from './config.mjs';

describe('profiles', () => {
  test('every group any profile names has a directory to land in', () => {
    // The failure this catches is silent: an asset in a group with no `paths`
    // entry gets `undefined` from `targetPathFor` and is dropped from the plan
    // without a word, so the seed simply never arrives.
    const grouped = new Set(Object.values(PROFILES).flat());
    const placed = Object.keys(DEFAULT_CONFIG.paths);
    expect([...grouped].filter((group) => !placed.includes(group))).toEqual([]);
  });

  test('full is a superset of agent, never a different set', () => {
    // `full` adds what CI and git run to what an agent reads. A group that fell
    // out of `full` would leave a consumer taking everything with LESS than one
    // taking the smaller profile — which nothing else would report.
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
    // `groupsFor` answers `[]` for an unknown name, so an unchecked profile
    // materialises no file and every command reports success — the same clean
    // run as a repository with nothing left to do. Both routes a profile arrives
    // by go through here, which is why `--profile typo` cannot be a quiet no-op.
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
    // `.` + `COMMANDS.md` joins to `./COMMANDS.md`, which is a DIFFERENT string
    // from `COMMANDS.md` — and the manifest key, the acceptance key and
    // closure's containment check are all string comparisons, so the unnormalised
    // form would make one file read as two paths.
    expect(
      targetPathFor({ assetPath: 'root/COMMANDS.md', config: DEFAULT_CONFIG }),
    ).toBe('COMMANDS.md');
  });

  test('reads every spelling of the repository root the same way', () => {
    // `""` is how a person writes "no directory", and `"./"` is what an editor
    // leaves behind. Both joined naively give `/COMMANDS.md`, and that one is
    // silent: `join` still writes the file to the right place, while closure
    // resolves a link to it as `COMMANDS.md`, matches nothing shipped, and
    // reports the page as an escape.
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
