// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const {
  mockColumns,
  mockColumnVisibility,
  mockReorderColumns,
  mockToggleColumnPin,
  mockToggleColumnVisibility,
} = vi.hoisted(() => ({
  mockColumns: [
    { key: 'id', label: 'ID' },
    { isStatic: true, key: 'name', label: 'Name' },
    { key: 'skip', label: 'Skip', render: () => 'cell' },
  ],
  mockColumnVisibility: new Set(['name']),
  mockReorderColumns: vi.fn(),
  mockToggleColumnPin: vi.fn(),
  mockToggleColumnVisibility: vi.fn(),
}));

vi.mock('@lcabrera/ui/components/DraggableList', () => ({
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
          onOrderChange(items.map((item) => item.id).toReversed());
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

vi.mock('@lcabrera/ui/components/Icons', () => ({
  LockIcon: () => <span data-testid='lock-icon'>lock</span>,
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => mockColumns,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetColumnOrder: () => ['name', 'id'],
    useGetColumnPinning: () => ({ left: ['id'], right: [] }),
    useGetColumnVisibility: () => mockColumnVisibility,
  }),
);

vi.mock('@lcabrera/ui/components/ToggleSwitch', () => ({
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

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useReorderColumns: () => mockReorderColumns,
  useToggleColumnPin: () => mockToggleColumnPin,
  useToggleColumnVisibility: () => mockToggleColumnVisibility,
}));

import { ColumnOrderSectionBody } from './ColumnOrderSectionBody.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockReorderColumns.mockReset();
  mockToggleColumnPin.mockReset();
  mockToggleColumnVisibility.mockReset();
});

describe('ColumnOrderSectionBody', () => {
  it('renders ordered settings columns with static rows locked', () => {
    render(<ColumnOrderSectionBody />);

    const nameRow = screen.getByTestId('item-name');
    expect(nameRow.dataset.draggable).toBe('false');
    expect(within(nameRow).getByTestId('lock-icon')).toBeDefined();

    const idRow = screen.getByTestId('item-id');
    expect(idRow.dataset.draggable).toBe('true');

    expect(screen.queryByTestId('item-skip')).toBeNull();
  });

  it('dispatches toggle actions from row controls', () => {
    render(<ColumnOrderSectionBody />);

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

  it('dispatches reorder changes from the draggable list', () => {
    render(<ColumnOrderSectionBody />);

    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }));

    expect(mockReorderColumns).toHaveBeenCalledWith(['id', 'name']);
  });
});
