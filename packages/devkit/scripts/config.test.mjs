import { describe, expect, test } from 'vite-plus/test';

import {
  allowedConfigKeys,
  configuredCommandWords,
  DEFAULT_CONFIG,
  groupsFor,
  hasConfigKey,
  isExecutableAsset,
  resolveConfig,
  targetPathFor,
} from './config.mjs';

describe('isExecutableAsset', () => {
  test('a hook is executable, wherever it sits under the group', () => {
    expect(isExecutableAsset('hooks/commit-msg')).toBe(true);
    expect(isExecutableAsset('hooks/nested/thing')).toBe(true);
  });

  test('prose is not, however it was committed', () => {
    expect(isExecutableAsset('skills/react-19/SKILL.md')).toBe(false);
    expect(isExecutableAsset('workflows/check.yml')).toBe(false);
    expect(isExecutableAsset('rules/routes-data.md')).toBe(false);
  });

  test('decides on the group rather than on the shipped file, which loses the bit', () => {
    expect(isExecutableAsset('hooks/pre-push')).toBe(true);
  });
});

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
      targetPathFor({ assetPath: 'dashboards/ci.json', config }),
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
      'decisions',
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
    expect(hasConfigKey({ config, path: 'paths.dashboards' })).toBe(false);
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

describe('resolveConfig on the ci block', () => {
  const raw = (ci) => JSON.stringify({ ci });

  test('reads the setup lines as written', () => {
    const setup = ['- name: Set up Vite+', '  uses: voidzero-dev/setup-vp@sha'];
    expect(resolveConfig(raw({ setup })).ci.setup).toEqual(setup);
  });

  test('stays silent when the block is absent', () => {
    expect(resolveConfig('{}').ci.setup).toEqual([]);
    expect(resolveConfig(raw({})).ci.setup).toEqual([]);
  });

  test('refuses the JSON-object spelling of a step', () => {
    expect(() =>
      resolveConfig(
        raw({ setup: [{ name: 'Set up Vite+', uses: 'o/a@sha' }] }),
      ),
    ).toThrow(/"ci\.setup\[0\]" must be a string/);
  });

  test('refuses a setup that is not a list', () => {
    expect(() => resolveConfig(raw({ setup: '- name: Set up Vite+' }))).toThrow(
      /"ci\.setup" must be an array of strings/,
    );
  });

  test('refuses a ci block that is not an object', () => {
    expect(() => resolveConfig(raw('vite-plus'))).toThrow(
      /"ci" must be a JSON object/,
    );
  });

  test('names the offending entry', () => {
    expect(() => resolveConfig(raw({ setup: ['- name: A', 7] }))).toThrow(
      /"ci\.setup\[1\]"/,
    );
  });
});
