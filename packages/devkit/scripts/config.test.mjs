import { describe, expect, test } from 'vite-plus/test';

import {
  configuredCommandWords,
  DEFAULT_CONFIG,
  groupsFor,
  resolveConfig,
  targetPathFor,
} from './config.mjs';

describe('resolveConfig', () => {
  test('an absent config is the documented default, not an error', () => {
    expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG);
  });

  test('a partial paths block overrides only what it names', () => {
    const config = resolveConfig(
      JSON.stringify({ paths: { skills: 'kit/skills' } }),
    );
    expect(config.paths.skills).toBe('kit/skills');
    expect(config.paths.rules).toBe(DEFAULT_CONFIG.paths.rules);
  });

  test('an unknown profile fails rather than silently materialising nothing', () => {
    expect(() =>
      resolveConfig(JSON.stringify({ profile: 'everything' })),
    ).toThrow(/unknown profile/);
  });

  test('a non-object config fails rather than falling back', () => {
    expect(() => resolveConfig(JSON.stringify(['agent']))).toThrow(
      /JSON object/,
    );
  });
});

describe('targetPathFor', () => {
  const config = DEFAULT_CONFIG;

  test('places an asset under the directory its group names', () => {
    expect(targetPathFor({ assetPath: 'skills/epic/SKILL.md', config })).toBe(
      '.github/skills/epic/SKILL.md',
    );
    expect(targetPathFor({ assetPath: 'rules/testing.md', config })).toBe(
      '.claude/rules/testing.md',
    );
  });

  test('returns nothing for an unknown group or a bare group directory', () => {
    expect(
      targetPathFor({ assetPath: 'workflows/ci.yml', config }),
    ).toBeUndefined();
    expect(targetPathFor({ assetPath: 'skills', config })).toBeUndefined();
  });
});

describe('groupsFor', () => {
  test('the agent profile carries the documents its skills cannot run without', () => {
    expect(groupsFor(DEFAULT_CONFIG)).toEqual([
      'skills',
      'rules',
      'agents',
      'docs',
      'coordination',
    ]);
  });
});

describe('configuredCommandWords', () => {
  test('names the tool each configured command invokes', () => {
    expect(
      configuredCommandWords({
        commands: {
          claim: 'vp run coordination:claim',
          install: 'pnpm install',
        },
      }),
    ).toEqual(['vp', 'pnpm']);
  });

  test('ignores an absent, empty or non-string command', () => {
    expect(configuredCommandWords({})).toEqual([]);
    expect(configuredCommandWords({ commands: { a: '', b: 7 } })).toEqual([]);
  });
});
