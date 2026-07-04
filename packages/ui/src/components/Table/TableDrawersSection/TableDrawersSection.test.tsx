// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableDrawersSection } from './TableDrawersSection.component';

type ColumnDrawerProviderProps = {
  readonly children: ReactNode;
  readonly columnKey?: string;
};

type TableDrawerProviderProps = {
  readonly children: ReactNode;
};

const {
  useGetTableColumnSelectedKeyMock,
  useGetTableDrawersSyncNonceMock,
  useGetTableIsColumnSettingsOpenMock,
  useGetTableIsColumnSettingsPinnedMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useGetTableIsTableSettingsOpenMock,
  useGetTableIsTableSettingsPinnedMock,
} = vi.hoisted(() => ({
  useGetTableColumnSelectedKeyMock: vi.fn(),
  useGetTableDrawersSyncNonceMock: vi.fn(() => 0),
  useGetTableIsColumnSettingsOpenMock: vi.fn(),
  useGetTableIsColumnSettingsPinnedMock: vi.fn(() => false),
  useGetTableIsLoadingMock: vi.fn(() => false),
  useGetTableIsLoadingMoreMock: vi.fn(() => false),
  useGetTableIsTableSettingsOpenMock: vi.fn(),
  useGetTableIsTableSettingsPinnedMock: vi.fn(() => false),
}));

const columnSettingsDrawerPropsSpy = vi.hoisted(() => vi.fn());
const tableSettingsDrawerPropsSpy = vi.hoisted(() => vi.fn());

const MockColumnDrawerProvider = vi.hoisted(() => {
  return function MockColumnDrawerProvider({
    children,
    columnKey,
  }: ColumnDrawerProviderProps) {
    return (
      <div data-column-key={columnKey} data-testid='column-drawer-provider'>
        {children}
      </div>
    );
  };
});

const MockColumnSettingsDrawer = vi.hoisted(() => {
  return function MockColumnSettingsDrawer({
    columnKey,
    isBusy,
  }: {
    readonly columnKey: string;
    readonly isBusy?: boolean;
  }) {
    columnSettingsDrawerPropsSpy({ columnKey, isBusy });
    return <div>Column Settings Drawer: {columnKey}</div>;
  };
});

const MockTableDrawerProvider = vi.hoisted(() => {
  return function MockTableDrawerProvider({
    children,
  }: TableDrawerProviderProps) {
    return <div data-testid='table-drawer-provider'>{children}</div>;
  };
});

const MockTableSettingsDrawer = vi.hoisted(() => {
  return function MockTableSettingsDrawer({
    isBusy,
  }: {
    readonly isBusy?: boolean;
  }) {
    tableSettingsDrawerPropsSpy({ isBusy });
    return <div>Table Settings Drawer</div>;
  };
});

vi.mock('@repo/ui/components/Table/TableSettingsDrawer', () => ({
  TableSettingsDrawer: MockTableSettingsDrawer,
}));

vi.mock(
  '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider',
  () => ({
    TableDrawerProvider: MockTableDrawerProvider,
  }),
);

vi.mock('../ColumnSettingsDrawer', () => ({
  ColumnSettingsDrawer: MockColumnSettingsDrawer,
}));

vi.mock(
  '../ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.provider',
  () => ({
    ColumnDrawerProvider: MockColumnDrawerProvider,
  }),
);

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnSelectedKey: useGetTableColumnSelectedKeyMock,
  useGetTableDrawersSyncNonce: useGetTableDrawersSyncNonceMock,
  useGetTableIsColumnSettingsOpen: useGetTableIsColumnSettingsOpenMock,
  useGetTableIsColumnSettingsPinned: useGetTableIsColumnSettingsPinnedMock,
  useGetTableIsTableSettingsOpen: useGetTableIsTableSettingsOpenMock,
  useGetTableIsTableSettingsPinned: useGetTableIsTableSettingsPinnedMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

afterEach(() => {
  cleanup();
});

describe('TableDrawersSection', () => {
  afterEach(() => {
    columnSettingsDrawerPropsSpy.mockClear();
    tableSettingsDrawerPropsSpy.mockClear();
    useGetTableDrawersSyncNonceMock.mockReset();
    useGetTableDrawersSyncNonceMock.mockReturnValue(0);
  });

  it('renders table settings drawer when table drawer is open', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(false);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    render(<TableDrawersSection />);

    expect(screen.getByTestId('table-drawer-provider').textContent).toContain(
      'Table Settings Drawer',
    );
  });

  it('renders column settings drawer when both drawers are open', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(true);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(true);
    useGetTableColumnSelectedKeyMock.mockReturnValue('customer');

    render(<TableDrawersSection />);

    expect(screen.getByTestId('column-drawer-provider').dataset.columnKey).toBe(
      'customer',
    );
    expect(screen.queryByTestId('table-drawer-provider')).toBeNull();
  });

  it('renders column settings drawer when column drawer is open with selected key', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(false);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(true);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('revenue');

    render(<TableDrawersSection />);

    expect(screen.getByTestId('column-drawer-provider').dataset.columnKey).toBe(
      'revenue',
    );
    expect(
      screen.getByText('Column Settings Drawer: revenue').textContent,
    ).toBe('Column Settings Drawer: revenue');
  });

  it('renders nothing when no drawer is open', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(false);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(false);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    const { container } = render(<TableDrawersSection />);
    expect(container.firstChild).toBeNull();
  });

  it('restores table settings drawer after column drawer closes when previous table state was open', () => {
    const visibilityState = {
      columnKey: '',
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
    };

    useGetTableColumnSelectedKeyMock.mockImplementation(
      () => visibilityState.columnKey,
    );
    useGetTableIsColumnSettingsOpenMock.mockImplementation(
      () => visibilityState.isColumnSettingsOpen,
    );
    useGetTableIsTableSettingsOpenMock.mockImplementation(
      () => visibilityState.isTableSettingsOpen,
    );

    const { rerender } = render(<TableDrawersSection />);

    expect(screen.getByTestId('table-drawer-provider')).toBeTruthy();
    expect(screen.queryByTestId('column-drawer-provider')).toBeNull();

    visibilityState.columnKey = 'status';
    visibilityState.isColumnSettingsOpen = true;
    visibilityState.isTableSettingsOpen = false;
    rerender(<TableDrawersSection />);

    expect(screen.getByTestId('column-drawer-provider').dataset.columnKey).toBe(
      'status',
    );
    expect(screen.queryByTestId('table-drawer-provider')).toBeNull();

    visibilityState.columnKey = '';
    visibilityState.isColumnSettingsOpen = false;
    visibilityState.isTableSettingsOpen = true;
    rerender(<TableDrawersSection />);

    expect(screen.getByTestId('table-drawer-provider')).toBeTruthy();
    expect(screen.queryByTestId('column-drawer-provider')).toBeNull();
  });

  it('renders table settings drawer in loading mode when pinned drawer is open during loading', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(false);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(true);
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    render(<TableDrawersSection />);

    expect(screen.getByText('Table Settings Drawer').textContent).toBe(
      'Table Settings Drawer',
    );
    expect(screen.getByTestId('table-drawer-provider')).toBeTruthy();
    expect(tableSettingsDrawerPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isBusy: true }),
    );
  });

  it('renders column settings drawer in loading mode when pinned drawer is open during loading', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    useGetTableIsTableSettingsOpenMock.mockReturnValue(false);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsPinnedMock.mockReturnValue(true);
    useGetTableColumnSelectedKeyMock.mockReturnValue('name');

    render(<TableDrawersSection />);

    expect(screen.getByText('Column Settings Drawer: name').textContent).toBe(
      'Column Settings Drawer: name',
    );
    expect(columnSettingsDrawerPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columnKey: 'name', isBusy: true }),
    );
  });

  it('renders table settings drawer in loading-more mode even when unpinned', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(true);
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(false);
    useGetTableIsTableSettingsPinnedMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    render(<TableDrawersSection />);

    expect(tableSettingsDrawerPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isBusy: true }),
    );
  });

  it('renders column settings drawer in loading-more mode even when unpinned', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(true);
    useGetTableIsTableSettingsOpenMock.mockReturnValue(false);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsPinnedMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('status');

    render(<TableDrawersSection />);

    expect(columnSettingsDrawerPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ columnKey: 'status', isBusy: true }),
    );
  });
});
