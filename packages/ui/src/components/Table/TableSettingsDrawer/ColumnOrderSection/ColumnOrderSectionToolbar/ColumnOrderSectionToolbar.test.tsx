// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { columnsStateRef, mockClearColumnOrderSection } = vi.hoisted(() => ({
  columnsStateRef: {
    current: {
      columnOrder: [] as readonly string[],
      columnPinning: {
        left: [] as readonly string[],
        right: [] as readonly string[],
      },
      columnVisibility: new Set<string>(),
    },
  },
  mockClearColumnOrderSection: vi.fn(),
}));

vi.mock('../../SectionToolbar', async () => {
  const { MockSectionToolbar } =
    await import('#ui/utils/tests/createMockSectionToolbar.util');

  return { SectionToolbar: MockSectionToolbar };
});

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/actions',
  () => ({
    useClearColumnOrderSection: () => mockClearColumnOrderSection,
    useResetColumnOrderAndVisibility: () => vi.fn(),
  }),
);

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetColumnOrder: () => columnsStateRef.current.columnOrder,
    useGetColumnPinning: () => columnsStateRef.current.columnPinning,
    useGetColumnsSorting: () => [],
    useGetColumnVisibility: () => columnsStateRef.current.columnVisibility,
  }),
);

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useOrderBySorting: () => vi.fn(),
}));

import { ColumnOrderSectionToolbar } from './ColumnOrderSectionToolbar.component';

const CLEAR_LABEL = 'Clear Order, Visibility & Pinning';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  columnsStateRef.current = {
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columnVisibility: new Set<string>(),
  };
  mockClearColumnOrderSection.mockReset();
});

describe('ColumnOrderSectionToolbar', () => {
  it('disables the clear when nothing is ordered, pinned or hidden', () => {
    render(<ColumnOrderSectionToolbar />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: CLEAR_LABEL })
        .disabled,
    ).toBe(true);
  });

  it('enables the clear when only a custom column order is staged', () => {
    columnsStateRef.current = {
      ...columnsStateRef.current,
      columnOrder: ['status', 'id'],
    };

    render(<ColumnOrderSectionToolbar />);
    fireEvent.click(screen.getByRole('button', { name: CLEAR_LABEL }));

    expect(mockClearColumnOrderSection).toHaveBeenCalledOnce();
  });
});
