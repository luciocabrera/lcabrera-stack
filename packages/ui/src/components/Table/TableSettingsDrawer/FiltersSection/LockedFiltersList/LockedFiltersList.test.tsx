// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableLockedFilters } from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';

import { LockedFiltersList } from './LockedFiltersList.component';

afterEach(cleanup);

const RESTRICTION: TableLockedFilters = {
  entries: [
    { columnKey: 'region', label: 'Region', value: 'North' },
    { columnKey: 'segment', label: 'Segment', value: 'Retail' },
    { columnKey: 'tier', label: 'Tier', value: 'Gold' },
  ],
};

const renderIn = (lockedFilters?: TableLockedFilters) => {
  render(
    <TableConfigProvider
      metaState={{ ...(lockedFilters && { lockedFilters }) }}
    >
      <LockedFiltersList />
    </TableConfigProvider>,
  );
};

describe('LockedFiltersList', () => {
  it('lists one entry per restriction, with its column label and value', () => {
    renderIn(RESTRICTION);

    for (const { columnKey, label, value } of RESTRICTION.entries) {
      const entry = screen.getByTestId(`locked-filter-${columnKey}`);

      expect(entry.textContent).toContain(label);
      expect(entry.textContent).toContain(value);
    }
  });

  it('lists them in the order the restriction states, outermost first', () => {
    renderIn(RESTRICTION);

    expect(
      [...screen.getByTestId('locked-filters-list').querySelectorAll('li')].map(
        (entry) => entry.dataset.testid,
      ),
    ).toEqual([
      'locked-filter-region',
      'locked-filter-segment',
      'locked-filter-tier',
    ]);
  });

  it('offers no control that could remove or edit one', () => {
    renderIn(RESTRICTION);

    const section = screen.getByTestId('locked-filters-list');

    expect(within(section).queryAllByRole('button')).toEqual([]);
    expect(within(section).queryAllByRole('textbox')).toEqual([]);
    expect(section.querySelectorAll('input, select, textarea')).toHaveLength(0);
  });

  it('counts separately from the reader-removable filters', () => {
    renderIn(RESTRICTION);

    expect(screen.getByTestId('locked-filters-list').textContent).toContain(
      'Locked Filters (3)',
    );
  });

  it('states why a restriction could not be read instead of listing nothing', () => {
    renderIn({
      entries: [],
      refusal: 'This link does not name what it restricts.',
    });

    const section = screen.getByTestId('locked-filters-list');

    expect(section.textContent).toContain(
      'This link does not name what it restricts.',
    );
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });

  it('falls back to its own sentence when a refusal carries none', () => {
    renderIn({ entries: [] });

    expect(screen.getByTestId('locked-filters-list').textContent).toContain(
      'These rows are restricted',
    );
  });

  it('renders nothing at all on a table the route declared no restriction for', () => {
    renderIn();

    expect(screen.queryByTestId('locked-filters-list')).toBeNull();
  });
});
