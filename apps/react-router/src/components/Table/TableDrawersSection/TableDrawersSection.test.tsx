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
  useGetTableIsColumnSettingsOpenMock,
  useGetTableIsTableSettingsOpenMock,
  useRenderTrackerMock,
} = vi.hoisted(() => ({
  useGetTableColumnSelectedKeyMock: vi.fn(),
  useGetTableIsColumnSettingsOpenMock: vi.fn(),
  useGetTableIsTableSettingsOpenMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
}));

const MockColumnDrawerProvider = vi.hoisted(
  () =>
    ({ children, columnKey }: ColumnDrawerProviderProps) => {
      return (
        <div data-column-key={columnKey} data-testid='column-drawer-provider'>
          {children}
        </div>
      );
    },
);

const MockColumnSettingsDrawer = vi.hoisted(
  () =>
    ({ columnKey }: { readonly columnKey: string }) => {
      return <div>Column Settings Drawer: {columnKey}</div>;
    },
);

const MockTableDrawerProvider = vi.hoisted(
  () =>
    ({ children }: TableDrawerProviderProps) => {
      return <div data-testid='table-drawer-provider'>{children}</div>;
    },
);

const MockTableSettingsDrawer = vi.hoisted(() => () => {
  return <div>Table Settings Drawer</div>;
});

vi.mock('@/components/Table/TableSettingsDrawer', () => ({
  TableSettingsDrawer: MockTableSettingsDrawer,
}));

vi.mock(
  '@/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider',
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
  useGetTableIsColumnSettingsOpen: useGetTableIsColumnSettingsOpenMock,
  useGetTableIsTableSettingsOpen: useGetTableIsTableSettingsOpenMock,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

afterEach(() => {
  cleanup();
});

describe('TableDrawersSection', () => {
  it('renders table settings drawer when table drawer is open', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(false);
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    render(<TableDrawersSection />);

    expect(screen.getByTestId('table-drawer-provider').textContent).toContain(
      'Table Settings Drawer',
    );
  });

  it('renders column settings drawer when both drawers are open', () => {
    useGetTableIsTableSettingsOpenMock.mockReturnValue(true);
    useGetTableIsColumnSettingsOpenMock.mockReturnValue(true);
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
    useGetTableColumnSelectedKeyMock.mockReturnValue('');

    const { container } = render(<TableDrawersSection />);
    expect(container.firstChild).toBeNull();
  });
});
