// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PersistCookieEntry } from '#ui/routing/actions/routing.types';

import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { buildSetCookieHeaders } from '#ui/routing/actions/buildSetCookieHeaders.util';

import type { TableColumn, TableMetaState } from './Table.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { TablePersistenceContext } from './contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { Table } from './Table.component';
import { readPersistedUiFlagsFromCookie } from './utils/readPersistedUiFlagsFromCookie.util';
import { toChromeUiFlags } from './utils/toChromeUiFlags.util';

type Reading = {
  readonly id: number;
  readonly value: number;
};

type ReadingPage = {
  readonly rows: readonly Reading[];
};

type RenderReadingsArgs = {
  readonly metaState: Partial<TableMetaState>;
  readonly persistence?: TablePersistence;
};

type TablePersistence = NonNullable<
  React.ContextType<typeof TablePersistenceContext>
>;

const COLUMNS: readonly TableColumn<Reading>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'number', key: 'value', label: 'Value' },
];

const ROWS: readonly Reading[] = Array.from({ length: 20 }, (_unused, id) => ({
  id,
  value: id,
}));

afterEach(cleanup);

const renderReadings = ({ metaState, persistence }: RenderReadingsArgs) =>
  render(
    <NotificationProvider>
      <TablePersistenceContext value={persistence}>
        <TableConfigProvider<Reading>
          columnsState={{ columns: [...COLUMNS] }}
          metaState={metaState}
        >
          <TableFocusProvider>
            <FiltersDataProvider<Reading> columns={[...COLUMNS]}>
              <TableOwnStackContext value>
                <Table<Reading, ReadingPage>
                  columns={COLUMNS}
                  dataSelector={(page) => page.rows}
                  response={{ rows: ROWS }}
                />
              </TableOwnStackContext>
            </FiltersDataProvider>
          </TableFocusProvider>
        </TableConfigProvider>
      </TablePersistenceContext>
    </NotificationProvider>,
  );

const bodyRowHeight = () =>
  screen
    .getAllByRole('row')
    .find((row) => row.closest('tbody') !== null)
    ?.style.getPropertyValue('--x-height');

const PINNED_OPEN = {
  isTableSettingsOpen: true,
  isTableSettingsPinned: true,
} as const;

const pickLevel = (label: string) => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
};

const clickFooter = (label: 'Accept' | 'Cancel') => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

const checkedLevel = () =>
  screen.getAllByRole<HTMLInputElement>('radio').find((radio) => radio.checked)
    ?.value;

const collectUiFlagsEntries = (persistence: TablePersistence) =>
  [
    ...vi
      .mocked(persistence.uiFlags)
      .mock.calls.flatMap(([entries]) => entries),
    ...vi
      .mocked(persistence.tableState)
      .mock.calls.flatMap(([entries]) => entries),
  ]
    .filter((entry: PersistCookieEntry) => entry.key?.endsWith('uiFlags'))
    .map(({ key = '', value = '' }: PersistCookieEntry) => ({ key, value }));

const createPersistence = () =>
  ({
    columnSizing: vi.fn(),
    tableState: vi.fn(),
    uiFlags: vi.fn(),
  }) as unknown as TablePersistence;

describe('the settings drawer density choice', () => {
  it('leaves the rows alone until Accept, and Cancel drops the staged level', () => {
    renderReadings({ metaState: PINNED_OPEN });

    pickLevel('Spacious');

    expect(bodyRowHeight()).toBe('32px');

    clickFooter('Cancel');

    expect(bodyRowHeight()).toBe('32px');
    expect(checkedLevel()).toBe('compact');
  });

  it('applies the staged level on Accept', () => {
    renderReadings({ metaState: PINNED_OPEN });

    pickLevel('Spacious');
    clickFooter('Accept');

    expect(bodyRowHeight()).toBe('48px');
    expect(checkedLevel()).toBe('spacious');
  });

  it('persists an accepted level so a reload renders it again', () => {
    const persistence = createPersistence();

    renderReadings({
      metaState: { ...PINNED_OPEN, persistenceKey: 'readings' },
      persistence,
    });

    pickLevel('Dense');
    clickFooter('Accept');

    const entries = collectUiFlagsEntries(persistence);
    const cookieString = (
      buildSetCookieHeaders({
        entries,
        expiresAt: new Date('2100-01-01T00:00:00.000Z'),
      }).get('Set-Cookie') ?? ''
    ).split(';', 1)[0];
    const reloadedMeta = toChromeUiFlags(
      readPersistedUiFlagsFromCookie({
        cookieString,
        persistenceKey: 'readings',
      }),
    );

    expect(entries).toHaveLength(1);
    expect(reloadedMeta.density).toBe('dense');

    cleanup();
    renderReadings({
      metaState: { ...reloadedMeta, persistenceKey: 'readings' },
    });

    expect(bodyRowHeight()).toBe('24px');
  });

  it('writes no density when Accept leaves the level as it was', () => {
    const persistence = createPersistence();

    renderReadings({
      metaState: { ...PINNED_OPEN, persistenceKey: 'readings' },
      persistence,
    });

    clickFooter('Accept');

    expect(bodyRowHeight()).toBe('32px');
    expect(
      collectUiFlagsEntries(persistence).some((entry) =>
        entry.value.includes('density'),
      ),
    ).toBe(false);
  });
});
