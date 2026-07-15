// @vitest-environment jsdom

import type { RadioOption } from '@repo/ui/components/RadioOptionGroup';

import { mockDialogElement } from '@repo/ui/utils/tests/mockDialogElement.util';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChoiceModal } from './ChoiceModal.component';

type Choice = 'first' | 'second' | 'third';

const OPTIONS: readonly RadioOption<Choice>[] = [
  { description: 'The first option', label: 'First choice', value: 'first' },
  { description: 'The second option', label: 'Second choice', value: 'second' },
  { description: 'The third option', label: 'Third choice', value: 'third' },
];

const dialogMocksRef: {
  current: {
    readonly restoreMockDialog: () => void;
  };
} = {
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
});

const defaultProps = {
  defaultValue: 'first' as Choice,
  description: (
    <>
      Resolve the <strong>Status</strong> column:
    </>
  ),
  isOpen: true,
  onAccept: vi.fn(),
  onCancel: vi.fn(),
  options: OPTIONS,
  radioName: 'choice-selection',
  title: 'Choose an option',
};

describe('ChoiceModal', () => {
  it('renders the description and title', () => {
    render(<ChoiceModal {...defaultProps} />);

    expect(screen.getByText('Status')).not.toBeNull();
    expect(
      screen.getByRole('heading', { hidden: true, name: /Choose an option/i }),
    ).not.toBeNull();
  });

  it('renders one radio per option', () => {
    render(<ChoiceModal {...defaultProps} />);

    expect(screen.getAllByRole('radio', { hidden: true })).toHaveLength(3);
  });

  it('selects the default value by default', () => {
    render(<ChoiceModal {...defaultProps} />);

    const firstRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /First choice/i,
    });

    expect(firstRadio.checked).toBe(true);
  });

  it('calls onAccept with the default value when unchanged', () => {
    const onAccept = vi.fn();

    render(<ChoiceModal {...defaultProps} onAccept={onAccept} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(onAccept).toHaveBeenCalledWith('first');
  });

  it('calls onAccept with the newly selected value', () => {
    const onAccept = vi.fn();

    render(<ChoiceModal {...defaultProps} onAccept={onAccept} />);

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Second choice/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    expect(onAccept).toHaveBeenCalledWith('second');
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();

    render(<ChoiceModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('resets the selection to the default value after accepting', () => {
    const onAccept = vi.fn();

    const { rerender } = render(
      <ChoiceModal {...defaultProps} onAccept={onAccept} />,
    );

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Third choice/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /accept/i }),
    );

    rerender(<ChoiceModal {...defaultProps} onAccept={onAccept} />);

    const firstRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /First choice/i,
    });

    expect(firstRadio.checked).toBe(true);
  });

  it('resets the selection to the default value after cancelling', () => {
    const onCancel = vi.fn();

    const { rerender } = render(
      <ChoiceModal {...defaultProps} onCancel={onCancel} />,
    );

    fireEvent.click(
      screen.getByRole('radio', { hidden: true, name: /Second choice/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: /cancel/i }),
    );

    rerender(<ChoiceModal {...defaultProps} onCancel={onCancel} />);

    const firstRadio = screen.getByRole<HTMLInputElement>('radio', {
      hidden: true,
      name: /First choice/i,
    });

    expect(firstRadio.checked).toBe(true);
  });
});
