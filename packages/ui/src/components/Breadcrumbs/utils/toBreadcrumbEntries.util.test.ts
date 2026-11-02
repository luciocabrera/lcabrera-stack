import { describe, expect, it } from 'vite-plus/test';

import { toBreadcrumbEntries } from './toBreadcrumbEntries.util';

describe('toBreadcrumbEntries', () => {
  it('identifies each item by its position and label, and marks only the last as current', () => {
    expect(
      toBreadcrumbEntries([
        { label: 'Home', to: '/' },
        { label: 'Reports', to: { pathname: '/reports' } },
        { label: 'Quarterly' },
      ]),
    ).toEqual([
      {
        identity: '0 Home',
        isCurrent: false,
        item: { label: 'Home', to: '/' },
      },
      {
        identity: '1 Reports',
        isCurrent: false,
        item: { label: 'Reports', to: { pathname: '/reports' } },
      },
      {
        identity: '2 Quarterly',
        isCurrent: true,
        item: { label: 'Quarterly' },
      },
    ]);
  });

  it('gives two label-only items with the same label different identities', () => {
    const identities = toBreadcrumbEntries([
      { label: 'Section' },
      { label: 'Section' },
    ]).map(({ identity }) => identity);

    expect(new Set(identities).size).toBe(2);
  });

  it('returns no entries for an empty trail', () => {
    expect(toBreadcrumbEntries([])).toEqual([]);
  });
});
