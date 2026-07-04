// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDialogElement } from '@/utils/tests/mockDialogElement.util';

import { PinSideModal } from './PinSideModal.component';

const dialogMocksRef: {
  current: {
    readonly restoreMockDialog: () => void;
    readonly showModalMock: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    restoreMockDialog: () => {
      // no-op before setup
    },
    showModalMock: vi.fn(),
  },
};

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement(false);
  dialogMocksRef.current = {
    restoreMockDialog: setup.restore,
    showModalMock: setup.showModalMock,
  };
});

const defaultProps = {
  columnLabel: 'Status',
  isOpen: true,
  onAccept: vi.fn(),
  onCancel: vi.fn(),
};

describe('PinSideModal', () => {
  it('renders the column label in the description', () => {
    render(<PinSideModal {...defaultProps} />);

    expect(screen.getByText(/Status/)).not.toBeNull();
  });

  it('renders the Pin Column title', () => {
    render(<PinSideModal {...defaultProps} />);

    expect(
      screen.getByRole('heading', { hidden: true, name: /Pin Column/i }),
    ).not.toBeNull();
  });

  it('renders all three pin side radio options', () => {
    render(<PinSideModal {...defaultProps} />);

    expect(screen.getAllByRole('radio', { hidden: true })).toHaveLength(3);
  });

  it('has "Closest edge" selected by default', () => {
    render(<PinSideModal {...defaultProps} />);

    const closestEdgeRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Closest edge/i,
    });

    expect(closestEdgeRadio.checked).toBe(true);
  });

  it('calls onAccept with "closest-edge" when no selection is changed', () => {
    const onAccept = vi.fn();

    render(<PinSideModal {...defaultProps} onAccept={onAccept} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(onAccept).toHaveBeenCalledWith('closest-edge');
  });

  it('calls onAccept with the newly selected side after a radio change', () => {
    const onAccept = vi.fn();

    render(<PinSideModal {...defaultProps} onAccept={onAccept} />);

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Pin to the left/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(onAccept).toHaveBeenCalledWith('left');
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    const onCancel = vi.fn();

    render(<PinSideModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('resets selection to "closest-edge" after accepting a different side', () => {
    const onAccept = vi.fn();

    const { rerender } = render(
      <PinSideModal {...defaultProps} onAccept={onAccept} />,
    );

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Pin to the right/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    // Re-open the modal to verify reset
    rerender(<PinSideModal {...defaultProps} onAccept={onAccept} />);

    const closestEdgeRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Closest edge/i,
    });

    expect(closestEdgeRadio.checked).toBe(true);
  });

  it('resets selection to "closest-edge" after cancelling', () => {
    const onCancel = vi.fn();

    const { rerender } = render(
      <PinSideModal {...defaultProps} onCancel={onCancel} />,
    );

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Pin to the left/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    rerender(<PinSideModal {...defaultProps} onCancel={onCancel} />);

    const closestEdgeRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /Closest edge/i,
    });

    expect(closestEdgeRadio.checked).toBe(true);
  });
});
