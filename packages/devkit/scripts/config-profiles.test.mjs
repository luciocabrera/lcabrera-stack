import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_CONFIG,
  includesRung,
  placementNotice,
  PROFILE_LADDER,
  PROFILES,
  rungPlacedAs,
  targetPathFor,
  withProfile,
} from './config.mjs';

const SCAFFOLDING_GROUPS = ['workflows', 'hooks', 'templates', 'root'];

describe('profiles', () => {
  test('the ladder is the four rungs, lowest first', () => {
    expect(PROFILE_LADDER).toEqual(['agent', 'repo', 'monorepo', 'full']);
    expect(Object.keys(PROFILES)).toEqual(PROFILE_LADDER);
  });

  test('every group any profile names has a directory to land in', () => {
    const grouped = new Set(Object.values(PROFILES).flat());
    const placed = Object.keys(DEFAULT_CONFIG.paths);
    expect([...grouped].filter((group) => !placed.includes(group))).toEqual([]);
  });

  test('each rung contains the one below it, never a different set', () => {
    for (const [index, rung] of PROFILE_LADDER.entries()) {
      if (index === 0) continue;
      const below = PROFILE_LADDER[index - 1];
      expect(PROFILES[rung]).toEqual(
        expect.arrayContaining([...PROFILES[below]]),
      );
      expect(PROFILES[rung].length).toBeGreaterThanOrEqual(
        PROFILES[below].length,
      );
    }
  });

  test('the scaffolding groups arrive at repo and are out of agent', () => {
    for (const group of SCAFFOLDING_GROUPS) {
      expect(PROFILES.repo).toContain(group);
      expect(PROFILES.agent).not.toContain(group);
    }
  });

  test('the decision home is prose a directory holds, so it lands at agent', () => {
    expect(PROFILES.agent).toContain('decisions');
  });

  test('monorepo and full place what repo places until their content lands', () => {
    expect(PROFILES.monorepo).toEqual(PROFILES.repo);
    expect(PROFILES.full).toEqual(PROFILES.repo);
  });
});

describe('includesRung', () => {
  test('a rung includes itself and every rung below it', () => {
    expect(includesRung({ profile: 'repo', rung: 'repo' })).toBe(true);
    expect(includesRung({ profile: 'repo', rung: 'agent' })).toBe(true);
    expect(includesRung({ profile: 'full', rung: 'agent' })).toBe(true);
  });

  test('a rung does not include the one above it', () => {
    expect(includesRung({ profile: 'agent', rung: 'repo' })).toBe(false);
    expect(includesRung({ profile: 'monorepo', rung: 'full' })).toBe(false);
  });

  test('a name off the ladder includes nothing and is included by nothing', () => {
    expect(includesRung({ profile: 'agnet', rung: 'agent' })).toBe(false);
    expect(includesRung({ profile: 'full', rung: 'publishing' })).toBe(false);
  });
});

describe('placementNotice', () => {
  test('a rung that adds nothing of its own names the rung it places as', () => {
    expect(rungPlacedAs('monorepo')).toBe('repo');
    expect(rungPlacedAs('full')).toBe('repo');
    expect(placementNotice('monorepo')).toMatch(
      /"monorepo" profile places what "repo" places/,
    );
    expect(placementNotice('full')).toMatch(/nothing above "repo" ships/);
  });

  test('a rung that places a group of its own says nothing', () => {
    expect(rungPlacedAs('agent')).toBeUndefined();
    expect(rungPlacedAs('repo')).toBeUndefined();
    expect(placementNotice('repo')).toBeUndefined();
  });

  test('a name off the ladder says nothing rather than throwing', () => {
    expect(rungPlacedAs('agnet')).toBeUndefined();
    expect(placementNotice('agnet')).toBeUndefined();
  });
});

describe('withProfile', () => {
  test('applies every rung this package knows', () => {
    for (const rung of PROFILE_LADDER) {
      expect(
        withProfile({ config: DEFAULT_CONFIG, profile: rung }).profile,
      ).toBe(rung);
    }
  });

  test('refuses one it does not, rather than placing nothing', () => {
    expect(() =>
      withProfile({ config: DEFAULT_CONFIG, profile: 'agnet' }),
    ).toThrow(/unknown profile "agnet"/);
  });

  test('names the four rungs in ladder order when it refuses', () => {
    expect(() => withProfile({ config: DEFAULT_CONFIG, profile: 'x' })).toThrow(
      /expected one of agent, repo, monorepo, full$/,
    );
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
