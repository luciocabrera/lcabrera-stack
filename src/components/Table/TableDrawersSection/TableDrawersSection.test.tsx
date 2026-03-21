// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TableDrawersSection } from './TableDrawersSection.component';

type ProviderProps = {
  readonly children: ReactNode;
  readonly columnKey?: string;
};

const useGetTableColumnSelectedKeyMock = vi.fn();
const useGetTableIsColumnSettingsOpenMock = vi.fn();
const useGetTableIsTableSettingsOpenMock = vi.fn();
const useRenderTrackerMock = vi.fn();

const MockTableSettingsDrawer = () => <div>Table Settings Drawer</div>;

const MockTableDrawerProvider = ({ children }: ProviderProps) => (
  <div data-testid='table-drawer-provider'>{children}</div>
);

const MockColumnSettingsDrawer = ({
  columnKey,
}: {
  readonly columnKey: string;
}) => <div>Column Settings Drawer: {columnKey}</div>;

const MockColumnDrawerProvider = ({ children, columnKey }: ProviderProps) => (
  <div data-column-key={columnKey} data-testid='column-drawer-provider'>
    {children}
  </div>
);

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
