import { describe, expect, test } from 'vite-plus/test';

import { DEFAULT_CONFIG } from './config.mjs';
import { hashContent, isRecorded, isReported, isWritten } from './manifest.mjs';
import { manifestAfter, planSync } from './sync.mjs';

const assets = [
  { content: 'epic body', path: 'skills/epic/SKILL.md' },
  { content: 'testing body', path: 'rules/testing.md' },
];

const emptyManifest = { files: {} };

describe('planSync', () => {
  test('maps each asset onto the directory its group configures', () => {
    const plan = planSync({
      assets,
      config: DEFAULT_CONFIG,
      manifest: emptyManifest,
      onDiskHash: () => undefined,
    });
    expect(plan.map((entry) => entry.path)).toEqual([
      '.github/skills/epic/SKILL.md',
      '.claude/rules/testing.md',
    ]);
    expect(plan.every((entry) => entry.state === 'added')).toBe(true);
  });

  test('skips a group the profile does not include', () => {
    const config = { ...DEFAULT_CONFIG, profile: 'agent' };
    const plan = planSync({
      assets: [{ content: 'x', path: 'hooks/pre-push' }],
      config,
      manifest: emptyManifest,
      onDiskHash: () => undefined,
    });
    expect(plan).toEqual([]);
  });

  test('reports a consumer edit instead of planning a write over it', () => {
    const plan = planSync({
      assets: [assets[0]],
      config: DEFAULT_CONFIG,
      manifest: {
        files: { '.github/skills/epic/SKILL.md': hashContent('epic body') },
      },
      onDiskHash: () => hashContent('epic body, locally edited'),
    });
    expect(plan[0].state).toBe('modified');
  });

  test('plans an update when the tree still matches what was written', () => {
    const plan = planSync({
      assets: [{ content: 'epic body v2', path: 'skills/epic/SKILL.md' }],
      config: DEFAULT_CONFIG,
      manifest: {
        files: { '.github/skills/epic/SKILL.md': hashContent('epic body') },
      },
      onDiskHash: () => hashContent('epic body'),
    });
    expect(plan[0].state).toBe('updated');
  });
});

describe('planSync and a declared config requirement', () => {
  const declaringAsset = {
    content: [
      '---',
      'name: demo',
      "requires: ['config.commands.install']",
      '---',
      '',
      'Install the toolchain before starting.',
    ].join('\n'),
    path: 'skills/demo/SKILL.md',
  };

  const planFor = (config) =>
    planSync({
      assets: [declaringAsset],
      config,
      manifest: emptyManifest,
      onDiskHash: () => undefined,
    });

  test('refuses to write it when the consumer has not set that key', () => {
    const [entry] = planFor(DEFAULT_CONFIG);
    expect(entry.state).toBe('unmet');
    expect(entry.missing).toEqual(['commands.install']);
    expect(isWritten(entry.state)).toBe(false);
    expect(isReported(entry.state)).toBe(true);
    expect(isRecorded(entry.state)).toBe(false);
  });

  test('writes the same asset once that key is present', () => {
    const [entry] = planFor({
      ...DEFAULT_CONFIG,
      commands: { install: 'vp install' },
    });
    expect(entry.state).toBe('added');
    expect(isWritten(entry.state)).toBe(true);
  });

  test('names every unmet key, not only the first', () => {
    const asset = {
      content: [
        '---',
        'requires: [config.commands.install, config.commands.claim]',
        '---',
      ].join('\n'),
      path: 'skills/demo/SKILL.md',
    };
    const [entry] = planSync({
      assets: [asset],
      config: { ...DEFAULT_CONFIG, commands: { install: 'vp install' } },
      manifest: emptyManifest,
      onDiskHash: () => undefined,
    });
    expect(entry.missing).toEqual(['commands.claim']);
  });

  test('a requirement is checked before the placeholders it does not carry', () => {
    const asset = {
      content: [
        '---',
        'requires: [config.paths.dashboards]',
        '---',
        '',
        'Run {{commands.install}}.',
      ].join('\n'),
      path: 'skills/demo/SKILL.md',
    };
    const [entry] = planSync({
      assets: [asset],
      config: DEFAULT_CONFIG,
      manifest: emptyManifest,
      onDiskHash: () => undefined,
    });
    expect(entry.state).toBe('unmet');
    expect(entry.missing).toEqual(['paths.dashboards']);
  });

  test('refuses it in every spelling of the same declaration', () => {
    const spellings = {
      'block sequence': ['requires:', '  - config.commands.install'],
      'flow array': ['requires: [config.commands.install]'],
      scalar: ['requires: config.commands.install'],
    };
    const outcome = ([spelling, lines]) => {
      const [entry] = planSync({
        assets: [
          {
            content: ['---', ...lines, '---', '', 'Body.'].join('\n'),
            path: 'skills/demo/SKILL.md',
          },
        ],
        config: DEFAULT_CONFIG,
        manifest: emptyManifest,
        onDiskHash: () => undefined,
      });
      return [spelling, { missing: entry.missing, state: entry.state }];
    };
    expect(Object.fromEntries(Object.entries(spellings).map(outcome))).toEqual(
      Object.fromEntries(
        Object.keys(spellings).map((spelling) => [
          spelling,
          { missing: ['commands.install'], state: 'unmet' },
        ]),
      ),
    );
  });

  test('an unmet asset never reaches the record sync writes', () => {
    const [entry] = planFor(DEFAULT_CONFIG);
    expect(
      manifestAfter({
        entries: [entry],
        previous: { files: {} },
        version: '0.1.0',
      }).files,
    ).toEqual({});
  });
});

describe('manifestAfter', () => {
  test('records only what a write actually placed', () => {
    const entries = [
      { incomingHash: 'aaa', path: 'a.md', state: 'added' },
      { incomingHash: 'bbb', path: 'b.md', state: 'modified' },
    ];
    const manifest = manifestAfter({
      entries,
      previous: { files: {} },
      version: '0.1.0',
    });
    expect(manifest.files).toEqual({ 'a.md': 'aaa' });
    expect(manifest.packageVersion).toBe('0.1.0');
  });
});
