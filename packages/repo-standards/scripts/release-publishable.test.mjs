import { describe, expect, it } from 'vite-plus/test';

import {
  classifyRelease,
  extractChangelogSection,
  findBlockingFirstPublish,
  renderSummary,
  selectFirstPublish,
  selectPublishable,
} from './release-publishable.mjs';

const CHANGELOG = `# @lcabrera/utils

## 0.2.0

### Minor Changes

- abc1234: Hydration-safe date formatting.

## 0.1.1

### Patch Changes

- def5678: An older entry that must not leak into 0.2.0's notes.
`;

// The bug this file defends against is #620: a repo-wide gate that suppressed
// publishing for every package whenever any one of them had a pending
// changeset, while the workflow still reported success. Every assertion below
// is about one package's fate being decided by the registry alone.

describe('classifyRelease', () => {
  it('publishes a package whose version is missing from the registry', () => {
    expect(classifyRelease({ packageExists: true, versionExists: false })).toBe(
      'publish',
    );
  });

  it('skips a package whose exact version is already on the registry', () => {
    expect(classifyRelease({ packageExists: true, versionExists: true })).toBe(
      'up-to-date',
    );
  });

  it('holds a package that has never been published for a human', () => {
    expect(
      classifyRelease({ packageExists: false, versionExists: false }),
    ).toBe('first-publish');
  });
});

describe('selectPublishable', () => {
  it('picks only the publishable packages, ignoring their neighbours', () => {
    const classified = [
      { name: '@lcabrera/utils', state: 'publish' },
      { name: '@lcabrera/server', state: 'up-to-date' },
      { name: '@lcabrera/eslint-plugin', state: 'first-publish' },
    ];

    expect(selectPublishable(classified).map(({ name }) => name)).toStrictEqual(
      ['@lcabrera/utils'],
    );
    expect(
      selectFirstPublish(classified).map(({ name }) => name),
    ).toStrictEqual(['@lcabrera/eslint-plugin']);
  });

  it('returns nothing when every package is already on the registry', () => {
    expect(
      selectPublishable([
        { name: '@lcabrera/ui', state: 'up-to-date' },
        { name: '@lcabrera/api', state: 'up-to-date' },
      ]),
    ).toStrictEqual([]);
  });
});

describe('findBlockingFirstPublish', () => {
  it('blocks when a never-published package coexists with a due release', () => {
    expect(
      findBlockingFirstPublish({
        firstPublish: [{ name: '@lcabrera/eslint-plugin' }],
        publishable: [{ name: '@lcabrera/utils' }],
      }).map(({ name }) => name),
    ).toStrictEqual(['@lcabrera/eslint-plugin']);
  });

  it('stays quiet when nothing is due to publish', () => {
    expect(
      findBlockingFirstPublish({
        firstPublish: [{ name: '@lcabrera/eslint-plugin' }],
        publishable: [],
      }),
    ).toStrictEqual([]);
  });

  it('stays quiet when every package has been published before', () => {
    expect(
      findBlockingFirstPublish({
        firstPublish: [],
        publishable: [{ name: '@lcabrera/utils' }],
      }),
    ).toStrictEqual([]);
  });
});

describe('extractChangelogSection', () => {
  it('takes only the requested version, stopping at the next heading', () => {
    const notes = extractChangelogSection({
      changelog: CHANGELOG,
      version: '0.2.0',
    });

    expect(notes).toContain('Hydration-safe date formatting.');
    expect(notes).not.toContain('An older entry');
    expect(notes).not.toContain('## 0.1.1');
  });

  it('reads the last section, which has no following heading', () => {
    expect(
      extractChangelogSection({ changelog: CHANGELOG, version: '0.1.1' }),
    ).toContain('An older entry');
  });

  it('returns empty rather than throwing for a version it cannot find', () => {
    expect(
      extractChangelogSection({ changelog: CHANGELOG, version: '9.9.9' }),
    ).toBe('');
  });
});

describe('renderSummary', () => {
  it('renders every package, publishable ones first', () => {
    const summary = renderSummary([
      {
        localVersion: '0.2.0',
        name: '@lcabrera/ui',
        publishedVersion: '0.2.0',
        state: 'up-to-date',
      },
      {
        localVersion: '0.2.0',
        name: '@lcabrera/eslint-plugin',
        publishedVersion: undefined,
        state: 'first-publish',
      },
      {
        localVersion: '0.2.0',
        name: '@lcabrera/utils',
        publishedVersion: '0.1.1',
        state: 'publish',
      },
    ]);

    const names = summary
      .split('\n')
      .filter((line) => line.startsWith('| `'))
      .map((line) => line.split(' ')[1]);

    expect(names).toStrictEqual([
      '`@lcabrera/utils`',
      '`@lcabrera/eslint-plugin`',
      '`@lcabrera/ui`',
    ]);
  });

  it('shows an em dash rather than "undefined" for a never-published package', () => {
    const summary = renderSummary([
      {
        localVersion: '0.2.0',
        name: '@lcabrera/eslint-plugin',
        publishedVersion: undefined,
        state: 'first-publish',
      },
    ]);

    expect(summary).toContain('| 0.2.0 | — |');
    expect(summary).not.toContain('undefined');
  });
});
