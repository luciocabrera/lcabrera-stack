// @vitest-environment jsdom

import { mockDialogElement } from '@lcabrera/ui/utils/tests/mockDialogElement.util';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAcceptOrderConflict, mockCancelOrderConflict, orderConflictRef } =
  vi.hoisted(() => ({
    mockAcceptOrderConflict: vi.fn(),
    mockCancelOrderConflict: vi.fn(),
    orderConflictRef: {
      current: {
        description: 'The new order breaks the pinned columns.',
        isOpen: true,
      },
    },
  }));

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useAcceptOrderConflict: () => mockAcceptOrderConflict,
  useCancelOrderConflict: () => mockCancelOrderConflict,
}));

vi.mock('../ColumnOrderSectionContext/selectors', () => ({
  useGetOrderConflict: () => orderConflictRef.current,
}));

import { OrderConflictModal } from './OrderConflictModal.component';

const dialogMocksRef = {
  current: {
    restoreMockDialog: () => {
      // no-op before setup
    },
  },
};

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement(false);
  dialogMocksRef.current = { restoreMockDialog: setup.restore };
  orderConflictRef.current = {
    description: 'The new order breaks the pinned columns.',
    isOpen: true,
  };
  mockAcceptOrderConflict.mockReset();
  mockCancelOrderConflict.mockReset();
});

describe('OrderConflictModal', () => {
  it('renders the conflict description read from the store', () => {
    render(<OrderConflictModal />);

    expect(
      screen.getByText('The new order breaks the pinned columns.'),
    ).not.toBeNull();
  });

  it('dispatches the default resolution on accept', () => {
    render(<OrderConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptOrderConflict).toHaveBeenCalledWith(
      'remove-conflicting-pins',
    );
  });

  it('dispatches the selected resolution on accept', () => {
    render(<OrderConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Apply order & keep all pins/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(mockAcceptOrderConflict).toHaveBeenCalledWith('pin-to-match-order');
  });

  it('dispatches the cancel action on cancel', () => {
    render(<OrderConflictModal />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    expect(mockCancelOrderConflict).toHaveBeenCalledTimes(1);
  });

  it('resets the selection to remove-conflicting-pins after accepting', () => {
    const { rerender } = render(<OrderConflictModal />);

    fireEvent.click(
      screen.getByRole('radio', {
        hidden: true,
        name: /Apply order & reset all pins/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    rerender(<OrderConflictModal />);

    const defaultRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Apply order & remove conflicting pins/i,
    });

    expect(defaultRadio.checked).toBe(true);
  });
});
