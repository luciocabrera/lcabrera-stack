// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAcceptPinConflict,
  mockAcceptPinSide,
  mockCancelPinConflict,
  mockCancelPinSide,
  mockColumns,
  mockColumnVisibility,
  mockReorderColumns,
  mockToggleColumnPin,
  mockToggleColumnVisibility,
  modalState,
} = vi.hoisted(() => ({
  mockAcceptPinConflict: vi.fn(),
  mockAcceptPinSide: vi.fn(),
  mockCancelPinConflict: vi.fn(),
  mockCancelPinSide: vi.fn(),
  mockColumns: [
    { key: 'id', label: 'ID', render: false },
    { isStatic: true, key: 'name', label: 'Name', render: false },
    { key: 'skip', label: 'Skip', render: true },
  ],
  mockColumnVisibility: new Set(['name']),
  mockReorderColumns: vi.fn(),
  mockToggleColumnPin: vi.fn(),
  mockToggleColumnVisibility: vi.fn(),
  modalState: {
    conflictModal: { columnLabel: 'ID', isOpen: false, side: 'left' as const },
    orderConflict: { description: 'conflict', isOpen: false },
    pinSideModal: { columnLabel: 'ID', isOpen: false },
    unpinConflictModal: {
      columnLabel: 'ID',
      isOpen: false,
      side: 'left' as const,
    },
  },
}));

vi.mock('@/components/DraggableList', () => ({
  DraggableList: ({
    items,
    onOrderChange,
  }: {
    readonly items: Array<{
      readonly content: ReactNode;
      readonly id: string;
      readonly isDraggable: boolean;
    }>;
    readonly onOrderChange: (ids: readonly string[]) => void;
  }) => (
    <div>
      <button
        onClick={() => {
          onOrderChange(items.map((item) => item.id).reverse());
        }}
        type='button'
      >
        Reorder
      </button>
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

vi.mock('@/components/Icons', () => ({
  LockIcon: () => <span data-testid='lock-icon'>lock</span>,
}));

vi.mock('@/components/PinSideModal', () => ({
  PinSideModal: ({
    isOpen,
    onAccept,
    onCancel,
  }: {
    readonly columnLabel: string;
    readonly isOpen: boolean;
    readonly onAccept: (side: 'left' | 'right' | 'closest-edge') => void;
    readonly onCancel: () => void;
  }) => (
    <div data-testid='pin-side-modal'>
      {String(isOpen)}
      <button
        onClick={() => {
          onAccept('left');
        }}
        type='button'
      >
        PinSide Accept
      </button>
      <button onClick={onCancel} type='button'>
        PinSide Cancel
      </button>
    </div>
  ),
}));

vi.mock('@/components/SidePanel', () => ({
  SidePanelSectionHeader: ({
    title,
    toolbar,
  }: {
    readonly title: string;
    readonly toolbar: ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {toolbar}
    </div>
  ),
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <section>{children}</section>
  ),
}));

vi.mock(
  '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => mockColumns,
  }),
);

vi.mock(
  '@/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetColumnOrder: () => ['name', 'id'],
    useGetColumnPinning: () => ({ left: ['id'], right: [] }),
    useGetColumnVisibility: () => mockColumnVisibility,
  }),
);

vi.mock('@/components/ToggleSwitch', () => ({
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
    readonly onChange: (checked: boolean) => void;
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

vi.mock('./ColumnOrderSectionContext/actions', () => ({
  useAcceptPinConflict: () => mockAcceptPinConflict,
  useAcceptPinSide: () => mockAcceptPinSide,
  useCancelPinConflict: () => mockCancelPinConflict,
  useCancelPinSide: () => mockCancelPinSide,
  useReorderColumns: () => mockReorderColumns,
  useToggleColumnPin: () => mockToggleColumnPin,
  useToggleColumnVisibility: () => mockToggleColumnVisibility,
}));

vi.mock('./ColumnOrderSectionContext/selectors', () => ({
  useGetConflictModal: () => modalState.conflictModal,
  useGetOrderConflict: () => modalState.orderConflict,
  useGetPinSideModal: () => modalState.pinSideModal,
  useGetUnpinConflictModal: () => modalState.unpinConflictModal,
}));

vi.mock('./ColumnOrderSectionToolbar', () => ({
  ColumnOrderSectionToolbar: ({
    variant,
  }: {
    readonly isBusy?: boolean;
    readonly variant?: 'footer' | 'toolbar';
  }) => <div>{variant ?? 'footer'}</div>,
}));

vi.mock('./OrderConflictModal', () => ({
  OrderConflictModal: ({
    isOpen,
  }: {
    readonly description: string;
    readonly isOpen: boolean;
  }) => <div data-testid='order-conflict-modal'>{String(isOpen)}</div>,
}));

vi.mock('./PinConflictModal', () => ({
  PinConflictModal: ({
    isOpen,
    onAccept,
    onCancel,
  }: {
    readonly columnLabel: string;
    readonly isOpen: boolean;
    readonly onAccept: (
      resolution: 'move-column' | 'pin-all-between' | 'pin-only',
    ) => void;
    readonly onCancel: () => void;
    readonly side: 'left' | 'right';
  }) => (
    <div data-testid='pin-conflict-modal'>
      {String(isOpen)}
      <button
        onClick={() => {
          onAccept('move-column');
        }}
        type='button'
      >
        PinConflict Accept
      </button>
      <button onClick={onCancel} type='button'>
        PinConflict Cancel
      </button>
    </div>
  ),
}));

vi.mock('./UnpinConflictModal', () => ({
  UnpinConflictModal: ({
    isOpen,
  }: {
    readonly columnLabel: string;
    readonly isOpen: boolean;
    readonly side: 'left' | 'right';
  }) => <div data-testid='unpin-conflict-modal'>{String(isOpen)}</div>,
}));

import { ColumnOrderSection } from './ColumnOrderSection.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  modalState.conflictModal = {
    columnLabel: 'ID',
    isOpen: false,
    side: 'left',
  };
  modalState.orderConflict = { description: 'conflict', isOpen: false };
  modalState.pinSideModal = { columnLabel: 'ID', isOpen: false };
  modalState.unpinConflictModal = {
    columnLabel: 'ID',
    isOpen: false,
    side: 'left',
  };
  mockAcceptPinConflict.mockReset();
  mockAcceptPinSide.mockReset();
  mockCancelPinConflict.mockReset();
  mockCancelPinSide.mockReset();
  mockReorderColumns.mockReset();
  mockToggleColumnPin.mockReset();
  mockToggleColumnVisibility.mockReset();
});

describe('ColumnOrderSection', () => {
  it('renders ordered settings columns and header count', () => {
    render(<ColumnOrderSection />);

    expect(screen.getByText('Column Order & Visibility (1/2)')).toBeDefined();

    const nameRow = screen.getByTestId('item-name');
    expect(nameRow.getAttribute('data-draggable')).toBe('false');
    expect(within(nameRow).getByTestId('lock-icon')).toBeDefined();

    const idRow = screen.getByTestId('item-id');
    expect(idRow.getAttribute('data-draggable')).toBe('true');
  });

  it('dispatches toggle actions from row controls', () => {
    render(<ColumnOrderSection />);

    fireEvent.click(
      within(screen.getByTestId('item-id')).getByLabelText('Pin-on'),
    );
    fireEvent.click(
      within(screen.getByTestId('item-id')).getByLabelText('Show-on'),
    );

    expect(mockToggleColumnPin).toHaveBeenCalledWith({
      columnKey: 'id',
      isPinning: false,
    });
    expect(mockToggleColumnVisibility).toHaveBeenCalledWith({
      columnKey: 'id',
      isVisible: false,
    });
  });

  it('dispatches reorder changes from draggable list', () => {
    render(<ColumnOrderSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }));

    expect(mockReorderColumns).toHaveBeenCalledWith(['id', 'name']);
  });

  it('wires modal open states and handlers', () => {
    modalState.pinSideModal = { columnLabel: 'ID', isOpen: true };
    modalState.conflictModal = {
      columnLabel: 'ID',
      isOpen: true,
      side: 'left',
    };
    modalState.unpinConflictModal = {
      columnLabel: 'ID',
      isOpen: true,
      side: 'left',
    };
    modalState.orderConflict = {
      description: 'conflict',
      isOpen: true,
    };

    render(<ColumnOrderSection />);

    expect(screen.getByTestId('pin-side-modal').textContent).toContain('true');
    expect(screen.getByTestId('pin-conflict-modal').textContent).toContain(
      'true',
    );
    expect(screen.getByTestId('unpin-conflict-modal').textContent).toContain(
      'true',
    );
    expect(screen.getByTestId('order-conflict-modal').textContent).toContain(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'PinSide Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'PinSide Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'PinConflict Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'PinConflict Cancel' }));

    expect(mockAcceptPinSide).toHaveBeenCalledWith('left');
    expect(mockCancelPinSide).toHaveBeenCalled();
    expect(mockAcceptPinConflict).toHaveBeenCalledWith('move-column');
    expect(mockCancelPinConflict).toHaveBeenCalled();
  });
});
