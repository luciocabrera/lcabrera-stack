import { describe, expect, test } from 'vite-plus/test';

import {
  allowedConfigKeys,
  configuredCommandWords,
  DEFAULT_CONFIG,
  groupsFor,
  hasConfigKey,
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

describe('hasConfigKey', () => {
  const config = { ...DEFAULT_CONFIG, commands: { install: 'vp install' } };

  test('resolves a dotted path into the consumer config', () => {
    expect(hasConfigKey({ config, path: 'commands.install' })).toBe(true);
    expect(hasConfigKey({ config, path: 'paths.skills' })).toBe(true);
    expect(hasConfigKey({ config, path: 'profile' })).toBe(true);
  });

  test('reports a key the consumer has not set', () => {
    expect(hasConfigKey({ config, path: 'commands.claim' })).toBe(false);
    expect(hasConfigKey({ config, path: 'paths.workflows' })).toBe(false);
    expect(hasConfigKey({ config, path: '' })).toBe(false);
  });

  test('a blank or null value is unset, as an empty command already is', () => {
    expect(
      hasConfigKey({
        config: { commands: { claim: '' } },
        path: 'commands.claim',
      }),
    ).toBe(false);
    expect(
      hasConfigKey({ config: { paths: { docs: null } }, path: 'paths.docs' }),
    ).toBe(false);
  });

  test('never resolves through the prototype chain', () => {
    expect(hasConfigKey({ config, path: 'commands.constructor' })).toBe(false);
    expect(hasConfigKey({ config, path: 'commands.install.length' })).toBe(
      false,
    );
  });
});

describe('allowedConfigKeys', () => {
  test('names the profile, every path key and every configured command', () => {
    expect(
      allowedConfigKeys({
        commands: { install: 'vp install' },
        paths: { rules: '.claude/rules', skills: '.github/skills' },
        profile: 'agent',
      }),
    ).toEqual(['profile', 'paths.rules', 'paths.skills', 'commands.install']);
  });

  test('leaves out a command that is empty or not a string', () => {
    expect(
      allowedConfigKeys({ commands: { a: '', b: 7, c: 'gh pr view' } }),
    ).toEqual(['profile', 'commands.c']);
  });

  test('is the key space, not the keys that happen to resolve', () => {
    // The same file carries blocks other tools read. One of those resolves
    // perfectly well here and is still outside what this config is for, so a
    // shipped asset binding to it could not travel — which is exactly the
    // difference between this question and hasConfigKey's.
    const config = {
      commands: {},
      paths: DEFAULT_CONFIG.paths,
      profile: 'agent',
      registers: { adrHomes: ['docs/decisions'] },
    };
    expect(hasConfigKey({ config, path: 'registers.adrHomes' })).toBe(true);
    expect(allowedConfigKeys(config)).not.toContain('registers.adrHomes');
  });
});
