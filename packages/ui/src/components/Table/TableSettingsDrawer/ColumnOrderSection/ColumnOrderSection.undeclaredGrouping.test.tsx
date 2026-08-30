// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  ColumnVisibilityState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type MockDraggableItem = {
  readonly content: ReactNode;
  readonly id: string;
  readonly isDraggable: boolean;
};

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({
    items,
  }: {
    readonly items: readonly MockDraggableItem[];
  }) => (
    <div data-testid='draggable-list'>
      {items.map((item) => (
        <div
          data-draggable={String(item.isDraggable)}
          data-testid={`item-${item.id}`}
          key={item.id}
        >
          {item.content}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('#ui/components/ToggleSwitch', () => ({
  ToggleSwitch: ({
    isChecked,
    isDisabled,
    label,
    onChange,
  }: {
    readonly isBusy?: boolean;
    readonly isChecked: boolean;
    readonly isDisabled?: boolean;
    readonly label: string;
    readonly onChange: (isChecked: boolean) => void;
  }) => (
    <button
      aria-label={`${label}-${isChecked ? 'on' : 'off'}`}
      disabled={isDisabled}
      onClick={() => {
        onChange(!isChecked);
      }}
      type='button'
    >
      {label}
    </button>
  ),
}));

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { ColumnOrderSection } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection';
import { ColumnOrderSectionProvider } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { mockDialogElement } from '#ui/utils/tests/mockDialogElement.util';

type Row = {
  readonly amount: number;
  readonly id: number;
  readonly status: string;
};

const columns: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'status', label: 'Status' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
];

const UNDECLARED_KEYS = ['tier'];
const DECLARED_KEYS = ['status'];

type HarnessProps = {
  readonly columnVisibility?: ColumnVisibilityState<Row>;
  readonly groupingKeys?: readonly string[];
};

const Harness = ({ columnVisibility, groupingKeys }: HarnessProps) => (
  <GlobalSettingsProvider>
    <NotificationProvider>
      <TableConfigProvider<Row>
        columnsState={{ columns, columnVisibility }}
        metaState={{ groupingKeys }}
      >
        <TableDrawerProvider>
          <ColumnOrderSectionProvider>
            <ColumnOrderSection />
          </ColumnOrderSectionProvider>
        </TableDrawerProvider>
      </TableConfigProvider>
    </NotificationProvider>
  </GlobalSettingsProvider>
);

const renderSection = (props: HarnessProps) => {
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness {...props} />, path: '/' },
      ])}
    />,
  );
};

const rowOrder = () =>
  [...screen.getByTestId('draggable-list').children].map(
    (row) => (row as HTMLElement).dataset.testid,
  );

const dialogMocks = mockDialogElement();

afterEach(() => {
  cleanup();
  dialogMocks.showModalMock.mockClear();
});

describe('ColumnOrderSection while the applied grouping names no declared column', () => {
  it('shows a hidden column instead of asking it to join the grouping', () => {
    renderSection({
      columnVisibility: new Set(['status']) as ColumnVisibilityState<Row>,
      groupingKeys: UNDECLARED_KEYS,
    });

    fireEvent.click(screen.getByLabelText('Show-off'));

    expect(dialogMocks.showModalMock).not.toHaveBeenCalled();
    expect(
      within(screen.getByTestId('item-status')).getByLabelText('Show-on'),
    ).not.toBeNull();
  });

  it('leaves the consumer’s own order alone rather than hoisting the painted columns', () => {
    renderSection({
      columnVisibility: new Set(['status']) as ColumnVisibilityState<Row>,
      groupingKeys: UNDECLARED_KEYS,
    });

    expect(rowOrder()).toStrictEqual(['item-id', 'item-status', 'item-amount']);
  });

  it('leaves every row draggable', () => {
    renderSection({ groupingKeys: UNDECLARED_KEYS });

    expect(screen.getByTestId('item-id').dataset.draggable).toBe('true');
    expect(screen.getByTestId('item-amount').dataset.draggable).toBe('true');
  });

  it('locks the rows once the grouping names a declared column', () => {
    renderSection({ groupingKeys: DECLARED_KEYS });

    expect(screen.getByTestId('item-id').dataset.draggable).toBe('false');
  });
});
