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

import { mockDialogElement } from '#ui/utils/tests/mockDialogElement.util';

const { conflictModalRef, mockAcceptPinConflict, mockCancelPinConflict } =
  vi.hoisted(() => ({
    conflictModalRef: {
      current: {
        columnKey: 'status',
        columnLabel: 'Status',
        isOpen: true,
        side: 'left' as 'left' | 'right',
      },
    },
    mockAcceptPinConflict: vi.fn(),
    mockCancelPinConflict: vi.fn(),
  }));

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useAcceptPinConflict: () => mockAcceptPinConflict,
  useCancelPinConflict: () => mockCancelPinConflict,
}));

vi.mock('../ColumnOrderSectionContext/selectors', () => ({
  useGetConflictModal: () => conflictModalRef.current,
}));

import { PinConflictModal } from './PinConflictModal.component';

const dialogMocksRef = {
  current: {
    restoreMockDialog: () => {},
  },
};

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement(false);
  dialogMocksRef.current = { restoreMockDialog: setup.restore };
  conflictModalRef.current = {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: true,
    side: 'left',
  };
  mockAcceptPinConflict.mockReset();
  mockCancelPinConflict.mockReset();
});

describe('PinConflictModal', () => {
  it('renders the column label and side read from the store', () => {
    render(<PinConflictModal />);

    expect(screen.getByText('Status')).not.toBeNull();
    expect(screen.getByText(/is not adjacent to the/)).not.toBeNull();
    expect(
      screen.getByRole('radio', {
        hidden: true,
        name: /Move column next to left-pinned columns/i,
      }),
    ).not.toBeNull();
  });

  it('dispatches the default resolution on accept', () => {
    render(<PinConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptPinConflict).toHaveBeenCalledWith('move-column');
  });

  it('dispatches the selected resolution on accept', () => {
    render(<PinConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Pin without changing column order/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptPinConflict).toHaveBeenCalledWith('pin-only');
  });

  it('dispatches the cancel action on cancel', () => {
    render(<PinConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    expect(mockCancelPinConflict).toHaveBeenCalledTimes(1);
  });

  it('resets the selection to move-column after accepting', () => {
    const { rerender } = render(<PinConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Pin all columns between/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    rerender(<PinConflictModal />);

    const moveColumnRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Move column next to left-pinned columns/i,
    });

    expect(moveColumnRadio.checked).toBe(true);
  });
});
