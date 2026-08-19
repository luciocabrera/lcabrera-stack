import { describe, expect, test } from 'vite-plus/test';

import { DEFAULT_CONFIG } from './config.mjs';
import { hashContent } from './manifest.mjs';
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
      assets: [{ content: 'x', path: 'workflows/ci.yml' }],
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
