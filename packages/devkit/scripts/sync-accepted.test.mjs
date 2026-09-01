import { describe, expect, test } from 'vite-plus/test';

import { acceptDecision, withAccepted } from './accepted.mjs';
import { DEFAULT_CONFIG } from './config.mjs';
import {
  hashContent,
  isAcknowledged,
  isRecorded,
  isReported,
  isWritten,
} from './manifest.mjs';
import { manifestAfter, planSync, withAcceptance } from './sync.mjs';

const ASSET = { content: 'epic body', path: 'skills/epic/SKILL.md' };
const TARGET = '.github/skills/epic/SKILL.md';

const afterFirstSync = { files: { [TARGET]: hashContent(ASSET.content) } };

const planFor = ({ accepted = {}, onDisk }) =>
  withAcceptance({
    accepted,
    entries: planSync({
      assets: [ASSET],
      config: DEFAULT_CONFIG,
      manifest: afterFirstSync,
      onDiskHash: () => hashContent(onDisk),
    }),
  });

describe('planSync surfaces the hash acceptance is keyed to', () => {
  test('carries the on-disk hash on the entry rather than discarding it', () => {
    const [entry] = planFor({ onDisk: 'epic body, locally edited' });
    expect(entry.onDiskHash).toBe(hashContent('epic body, locally edited'));
  });

  const REFUSED_DECLARATIONS = {
    'unmet, on a config key': {
      lines: ['requires: [config.commands.install]'],
      state: 'unmet',
    },
    'unmet, on a peer range': {
      lines: ["peer: '@lcabrera/repo-standards@>=99.0.0'"],
      state: 'unmet',
    },
    'unresolved, on a placeholder': {
      lines: [],
      state: 'unresolved',
      body: 'Run {{commands.install}} first.',
    },
  };

  for (const [
    label,
    { body = 'A demo skill.', lines, state },
  ] of Object.entries(REFUSED_DECLARATIONS)) {
    test(`a ${label} entry carries it too`, () => {
      const onDisk = 'the copy a previous sync wrote';
      const [entry] = planSync({
        assets: [
          {
            content: ['---', 'name: demo', ...lines, '---', '', body].join(
              '\n',
            ),
            path: 'skills/demo/SKILL.md',
          },
        ],
        config: DEFAULT_CONFIG,
        manifest: { files: {} },
        onDiskHash: () => hashContent(onDisk),
      });

      expect(entry.state).toBe(state);
      expect(entry.onDiskHash).toBe(hashContent(onDisk));
    });
  }
});

describe('withAcceptance', () => {
  test('leaves a plan alone when the consumer has acknowledged nothing', () => {
    const [entry] = planFor({ onDisk: 'epic body, locally edited' });
    expect(entry.state).toBe('modified');
    expect(isReported(entry.state)).toBe(true);
  });

  test('relabels an acknowledged edit and carries its reason', () => {
    const edited = 'epic body, locally edited';
    const [entry] = planFor({
      accepted: withAccepted(
        {},
        {
          hash: hashContent(edited),
          path: TARGET,
          reason: 'our epic protocol has no wave cap',
        },
      ),
      onDisk: edited,
    });
    expect(entry.state).toBe('acknowledged');
    expect(entry.reason).toBe('our epic protocol has no wave cap');
  });

  test('an edit after the acknowledgement is reported again, with no further command', () => {
    const edited = 'epic body, locally edited';
    const accepted = withAccepted(
      {},
      { hash: hashContent(edited), path: TARGET, reason: 'deliberate' },
    );

    const [quiet] = planFor({ accepted, onDisk: edited });
    const [resurfaced] = planFor({ accepted, onDisk: `${edited}, and again` });

    expect(quiet.state).toBe('acknowledged');
    expect(resurfaced.state).toBe('modified');
    expect(isReported(resurfaced.state)).toBe(true);
  });

  test('quietens an acknowledged conflict without adopting it', () => {
    const unmanaged = 'a file the consumer wrote';
    const [entry] = withAcceptance({
      accepted: withAccepted(
        {},
        { hash: hashContent(unmanaged), path: TARGET, reason: 'mine' },
      ),
      entries: planSync({
        assets: [ASSET],
        config: DEFAULT_CONFIG,
        manifest: { files: {} },
        onDiskHash: () => hashContent(unmanaged),
      }),
    });
    expect(entry.state).toBe('acknowledged');
    expect(isWritten(entry.state)).toBe(false);
  });

  test('leaves a conflict reported when nothing acknowledged it', () => {
    const unmanaged = 'a file the consumer wrote';
    const [entry] = withAcceptance({
      accepted: {},
      entries: planSync({
        assets: [ASSET],
        config: DEFAULT_CONFIG,
        manifest: { files: {} },
        onDiskHash: () => hashContent(unmanaged),
      }),
    });

    expect(entry.state).toBe('conflict');
  });
});

describe('an acknowledged file is neither written nor recorded', () => {
  const edited = 'epic body, locally edited';
  const acknowledged = () =>
    planFor({
      accepted: withAccepted(
        {},
        { hash: hashContent(edited), path: TARGET, reason: 'deliberate' },
      ),
      onDisk: edited,
    });

  test('the state is in none of the three sets, and only in its own', () => {
    expect(isWritten('acknowledged')).toBe(false);
    expect(isRecorded('acknowledged')).toBe(false);
    expect(isReported('acknowledged')).toBe(false);
    expect(isAcknowledged('acknowledged')).toBe(true);
  });

  test('applySync would pass over it — the write is gated on isWritten', () => {
    const [entry] = acknowledged();
    expect([entry].filter((candidate) => isWritten(candidate.state))).toEqual(
      [],
    );
  });

  test('its edited content never reaches the files map', () => {
    const [entry] = acknowledged();
    expect(
      manifestAfter({
        entries: [entry],
        previous: { files: {} },
        version: '0.1.0',
      }).files,
    ).toEqual({});
  });

  test('the baseline the package was last measured against survives untouched', () => {
    const [entry] = acknowledged();
    expect(
      manifestAfter({
        entries: [entry],
        previous: afterFirstSync,
        version: '0.1.0',
      }).files,
    ).toEqual(afterFirstSync.files);
  });
});

describe('acceptDecision against a real plan', () => {
  test('takes the edit doctor reports, and refuses the same file once acknowledged', () => {
    const edited = 'epic body, locally edited';
    const [modified] = planFor({ onDisk: edited });

    const decision = acceptDecision({
      entries: [modified],
      path: TARGET,
      reason: 'deliberate',
    });
    expect(decision.hash).toBe(hashContent(edited));

    const [already] = planFor({
      accepted: withAccepted(
        {},
        { hash: decision.hash, path: TARGET, reason: decision.reason },
      ),
      onDisk: edited,
    });
    expect(
      acceptDecision({ entries: [already], path: TARGET, reason: 'again' })
        .error,
    ).toContain('acknowledged');
  });

  test('refuses a file nobody has edited', () => {
    const [current] = planFor({ onDisk: ASSET.content });
    expect(current.state).toBe('current');
    expect(
      acceptDecision({ entries: [current], path: TARGET, reason: 'deliberate' })
        .hash,
    ).toBeUndefined();
  });
});
