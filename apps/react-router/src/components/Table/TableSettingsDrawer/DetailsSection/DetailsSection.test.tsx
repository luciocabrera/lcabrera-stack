// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { columnsMock, dataStateMock, metaStateMock } = vi.hoisted(() => ({
  columnsMock: [{ key: 'id' }, { key: 'name' }, { key: 'status' }],
  dataStateMock: {
    totalLoadedRows: 30,
    totalRows: 120,
  },
  metaStateMock: {
    additionalMetadata: undefined as
      | Record<string, boolean | number | string>
      | undefined,
    density: 'compact',
    enablePrefetch: true,
    initialPageSize: 100,
    isBordered: true,
    isStriped: true,
    loadMorePageSize: 50,
    overscan: 8,
    persistenceKey: 'test-table',
    rowHeight: 40,
    locale: 'nl-NL' as string | undefined,
    schemaName: undefined as string | undefined,
    tableName: undefined as string | undefined,
    threshold: 200,
    title: 'Test Table',
  },
}));

type MockSectionProps = {
  readonly children: ReactNode;
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  columnsMock.splice(
    0,
    columnsMock.length,
    { key: 'id' },
    { key: 'name' },
    {
      key: 'status',
    },
  );
  Object.assign(metaStateMock, {
    additionalMetadata: undefined,
    density: 'compact',
    enablePrefetch: true,
    initialPageSize: 100,
    isBordered: true,
    isStriped: true,
    loadMorePageSize: 50,
    overscan: 8,
    persistenceKey: 'test-table',
    rowHeight: 40,
    locale: 'nl-NL',
    schemaName: undefined,
    tableName: undefined,
    threshold: 200,
    title: 'Test Table',
  });
  dataStateMock.totalLoadedRows = 30;
  dataStateMock.totalRows = 120;
});

vi.mock('@/components/SidePanel', () => ({
  SidePanelSection: ({ children }: MockSectionProps) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h2>{title}</h2>
  ),
  SidePanelSectionMain: ({ children }: MockSectionProps) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumns: () => columnsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableAdditionalMetadata: () => metaStateMock.additionalMetadata,
  useGetTableDensity: () => metaStateMock.density,
  useGetTableEnablePrefetch: () => metaStateMock.enablePrefetch,
  useGetTableInitialPageSize: () => metaStateMock.initialPageSize,
  useGetTableIsBordered: () => metaStateMock.isBordered,
  useGetTableIsStriped: () => metaStateMock.isStriped,
  useGetTableLocale: () => metaStateMock.locale,
  useGetTableLoadMorePageSize: () => metaStateMock.loadMorePageSize,
  useGetTableOverscan: () => metaStateMock.overscan,
  useGetTablePersistenceKey: () => metaStateMock.persistenceKey,
  useGetTableRowHeight: () => metaStateMock.rowHeight,
  useGetTableSchemaName: () => metaStateMock.schemaName,
  useGetTableTableName: () => metaStateMock.tableName,
  useGetTableThreshold: () => metaStateMock.threshold,
  useGetTableTitle: () => metaStateMock.title,
}));

vi.mock('@/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableTotalLoadedRows: () => dataStateMock.totalLoadedRows,
  useGetTableTotalRows: () => dataStateMock.totalRows,
}));

import { DetailsSection } from './DetailsSection.component';

describe('DetailsSection', () => {
  it('renders required table metrics', () => {
    dataStateMock.totalRows = 375001;

    render(<DetailsSection />);

    expect(screen.getByText('Total Records')).toBeDefined();
    expect(screen.getByText('375.001')).toBeDefined();

    expect(screen.getByText('Total Loaded')).toBeDefined();
    expect(screen.getByText('30')).toBeDefined();

    expect(screen.getByText('Number of Columns')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('shows optional table and schema names only when available', () => {
    render(<DetailsSection />);

    expect(screen.queryByText('Table Name')).toBeNull();
    expect(screen.queryByText('Schema Name')).toBeNull();

    metaStateMock.tableName = 'enterprise_orders';
    metaStateMock.schemaName = 'public';

    cleanup();
    render(<DetailsSection />);

    expect(screen.getByText('Table Name')).toBeDefined();
    expect(screen.getByText('enterprise_orders')).toBeDefined();
    expect(screen.getByText('Schema Name')).toBeDefined();
    expect(screen.getByText('public')).toBeDefined();
  });

  it('renders additional metadata entries when present', () => {
    metaStateMock.additionalMetadata = {
      isRealtime: true,
      ownerTeam: 'Analytics',
    };

    render(<DetailsSection />);

    expect(screen.getByText('Is Realtime')).toBeDefined();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
    expect(screen.getByText('Owner Team')).toBeDefined();
    expect(screen.getByText('Analytics')).toBeDefined();
  });
});
