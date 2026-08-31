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

const { mockAcceptUnpinConflict, mockCancelUnpinConflict, unpinModalRef } =
  vi.hoisted(() => ({
    mockAcceptUnpinConflict: vi.fn(),
    mockCancelUnpinConflict: vi.fn(),
    unpinModalRef: {
      current: {
        columnKey: 'status',
        columnLabel: 'Status',
        isOpen: true,
        side: 'left' as 'left' | 'right',
      },
    },
  }));

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useAcceptUnpinConflict: () => mockAcceptUnpinConflict,
  useCancelUnpinConflict: () => mockCancelUnpinConflict,
}));

vi.mock('../ColumnOrderSectionContext/selectors', () => ({
  useGetUnpinConflictModal: () => unpinModalRef.current,
}));

import { UnpinConflictModal } from './UnpinConflictModal.component';

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
  unpinModalRef.current = {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: true,
    side: 'left',
  };
  mockAcceptUnpinConflict.mockReset();
  mockCancelUnpinConflict.mockReset();
});

describe('UnpinConflictModal', () => {
  it('renders the column label read from the store', () => {
    render(<UnpinConflictModal />);

    expect(screen.getByText('Status')).not.toBeNull();
    expect(screen.getByText(/would leave a gap in the/)).not.toBeNull();
  });

  it('dispatches the default resolution on accept', () => {
    render(<UnpinConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptUnpinConflict).toHaveBeenCalledWith('unpin-beyond');
  });

  it('dispatches the selected resolution on accept', () => {
    render(<UnpinConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Reorder to fill the gap/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptUnpinConflict).toHaveBeenCalledWith('reorder-to-fill');
  });

  it('dispatches the cancel action on cancel', () => {
    render(<UnpinConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    expect(mockCancelUnpinConflict).toHaveBeenCalledTimes(1);
  });

  it('resets the selection to unpin-beyond after cancelling', () => {
    const { rerender } = render(<UnpinConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Reorder to fill the gap/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    rerender(<UnpinConflictModal />);

    const unpinBeyondRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Unpin this and columns beyond/i,
    });

    expect(unpinBeyondRadio.checked).toBe(true);
  });
});
