// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionButtons } from './ActionButtons.component';

afterEach(() => {
  cleanup();
});

describe('ActionButtons', () => {
  it('renders one button per action with its label', () => {
    render(
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: () => {} },
          { label: 'Cancel', onClick: () => {} },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Accept' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeNull();
  });

  it('wires each onClick to its own button', () => {
    const onAccept = vi.fn();
    const onCancel = vi.fn();

    render(
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: onAccept },
          { label: 'Cancel', onClick: onCancel },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('forwards extra Button props from the descriptor', () => {
    render(
      <ActionButtons
        actions={[{ isDisabled: true, label: 'Accept', onClick: () => {} }]}
      />,
    );

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Accept',
    });

    expect(button.disabled).toBe(true);
  });

  it('supports submit descriptors without onClick', () => {
    render(<ActionButtons actions={[{ label: 'Save', type: 'submit' }]} />);

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Save',
    });

    expect(button.type).toBe('submit');
  });

  it('applies group-level isBusy to every button', () => {
    render(
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: () => {} },
          { label: 'Cancel', onClick: () => {} },
        ]}
        isBusy
      />,
    );

    const accept = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Accept',
    });
    const cancel = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Cancel',
    });

    expect(accept.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
  });

  it('wraps the buttons in a single container div', () => {
    render(
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: () => {} },
          { label: 'Cancel', onClick: () => {} },
        ]}
      />,
    );

    const container = screen.getByTestId('action-buttons');

    expect(container.tagName).toBe('DIV');
    expect(container.querySelectorAll('button')).toHaveLength(2);
  });
});
