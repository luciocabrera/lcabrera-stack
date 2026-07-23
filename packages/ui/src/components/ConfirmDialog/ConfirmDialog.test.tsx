// @vitest-environment jsdom

import { mockDialogElement } from '@lcabrera/ui/utils/tests/mockDialogElement.util';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { ConfirmDialog } from './ConfirmDialog.component';

const dialogMocksRef: { current: { readonly restoreMockDialog: () => void } } =
  {
    current: { restoreMockDialog: () => {} },
  };

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement(false);
  dialogMocksRef.current = { restoreMockDialog: setup.restore };
});

const defaultProps = {
  isOpen: true,
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Discard changes?',
};

describe('ConfirmDialog', () => {
  it('renders the title and optional description', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        description='You have unsaved changes.'
      />,
    );

    expect(
      screen.getByRole('heading', { hidden: true, name: 'Discard changes?' }),
    ).not.toBeNull();
    expect(screen.getByText('You have unsaved changes.')).not.toBeNull();
  });

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Confirm' }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Cancel' }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('supports custom confirm/cancel labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        cancelLabel='Keep editing'
        confirmLabel='Discard changes'
      />,
    );

    expect(
      screen.getByRole('button', { hidden: true, name: 'Discard changes' }),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { hidden: true, name: 'Keep editing' }),
    ).not.toBeNull();
  });
});
