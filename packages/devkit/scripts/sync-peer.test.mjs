import { describe, expect, test } from 'vite-plus/test';

import { countsFor, renderPlan } from './command-materialise.mjs';
import { isRecorded, isReported, isWritten } from './manifest.mjs';
import { manifestAfter } from './sync.mjs';
import {
  outcomePerSpelling,
  planWith,
  samePerSpelling,
} from './test-fixtures.mjs';

const declaringAsset = {
  content: [
    '---',
    'name: demo',
    "peer: '@lcabrera/repo-standards@>=0.1.0 <1.0.0'",
    '---',
    '',
    'Run the claim gate before starting.',
  ].join('\n'),
  path: 'skills/demo/SKILL.md',
};

const planFor = (versions) =>
  planWith({
    assets: [declaringAsset],
    peerVersions: versions,
  });
const outcome = ([spelling, lines]) => {
  const [entry] = planWith({
    assets: [
      {
        content: ['---', ...lines, '---', '', 'Body.'].join('\n'),
        path: 'skills/demo/SKILL.md',
      },
    ],
    peerVersions: new Map([['@lcabrera/repo-standards', '2.0.0']]),
  });
  return [spelling, { missing: entry.missing, state: entry.state }];
};

describe('planSync and a declared peer', () => {
  test('refuses to write it when the peer is not installed at all', () => {
    const [entry] = planFor(new Map());
    expect(entry.state).toBe('unmet');
    expect(entry.unmetKind).toBe('peer');
    expect(entry.missing).toEqual([
      '@lcabrera/repo-standards@>=0.1.0 <1.0.0 (not installed)',
    ]);
    expect(isWritten(entry.state)).toBe(false);
    expect(isReported(entry.state)).toBe(true);
    expect(isRecorded(entry.state)).toBe(false);
  });

  test('refuses to write it when the installed version is outside the range', () => {
    const [entry] = planFor(new Map([['@lcabrera/repo-standards', '2.0.0']]));
    expect(entry.state).toBe('unmet');
    expect(entry.unmetKind).toBe('peer');
    expect(entry.missing).toEqual([
      '@lcabrera/repo-standards@>=0.1.0 <1.0.0 (installed 2.0.0)',
    ]);
    expect(isWritten(entry.state)).toBe(false);
  });

  test('writes the same asset when the installed version answers the range', () => {
    const [entry] = planFor(new Map([['@lcabrera/repo-standards', '0.4.1']]));
    expect(entry.state).toBe('added');
    expect(isWritten(entry.state)).toBe(true);
  });

  test('an unmet peer never reaches the record sync writes', () => {
    const [entry] = planFor(new Map());
    expect(
      manifestAfter({
        entries: [entry],
        previous: { files: {} },
        version: '0.1.0',
      }).files,
    ).toEqual({});
    expect(countsFor([entry])).toEqual({ reported: 1, written: 0 });
  });

  test('refuses it in every spelling of the same declaration', () => {
    const spellings = {
      'block sequence': [
        'peer:',
        "  - '@lcabrera/repo-standards@>=0.1.0 <1.0.0'",
      ],
      'flow array': ["peer: ['@lcabrera/repo-standards@>=0.1.0 <1.0.0']"],
      scalar: ["peer: '@lcabrera/repo-standards@>=0.1.0 <1.0.0'"],
    };
    expect(outcomePerSpelling(spellings, outcome)).toEqual(
      samePerSpelling(spellings, {
        missing: ['@lcabrera/repo-standards@>=0.1.0 <1.0.0 (installed 2.0.0)'],
        state: 'unmet',
      }),
    );
  });

  test('a plan built without any resolution refuses rather than writes', () => {
    const [entry] = planWith({
      assets: [declaringAsset],
    });
    expect(entry.state).toBe('unmet');
  });

  test('an unmet config key is still reported first, and as itself', () => {
    const [entry] = planWith({
      assets: [
        {
          content: [
            '---',
            'requires: [config.commands.install]',
            "peer: '@lcabrera/repo-standards@>=0.1.0'",
            '---',
          ].join('\n'),
          path: 'skills/demo/SKILL.md',
        },
      ],
      peerVersions: new Map(),
    });
    expect(entry.unmetKind).toBe('config');
    expect(entry.missing).toEqual(['commands.install']);
  });
});

describe('renderPlan and an unmet peer', () => {
  test('names the peer, and does not call it a config key', () => {
    expect(
      renderPlan([
        {
          missing: ['@lcabrera/repo-standards@>=0.1.0 <1.0.0 (not installed)'],
          path: '.github/skills/demo/SKILL.md',
          state: 'unmet',
          unmetKind: 'peer',
        },
      ]),
    ).toBe(
      '  unmet        .github/skills/demo/SKILL.md  (not written — no compatible peer for @lcabrera/repo-standards@>=0.1.0 <1.0.0 (not installed))',
    );
  });

  test('an unmet entry with no kind still reads as a config key', () => {
    expect(
      renderPlan([
        {
          missing: ['paths.dashboards'],
          path: '.github/skills/demo/SKILL.md',
          state: 'unmet',
        },
      ]),
    ).toBe(
      '  unmet        .github/skills/demo/SKILL.md  (not written — no config key set for paths.dashboards)',
    );
  });
});
