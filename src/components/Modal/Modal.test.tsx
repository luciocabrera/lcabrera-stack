// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.show = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
});

describe('Modal', () => {
  it('renders children content', () => {
    render(
      <Modal isOpen={false} onClose={() => void 0}>
        <span>Modal body content</span>
      </Modal>,
    );
    expect(screen.getByText('Modal body content').textContent).toBe(
      'Modal body content',
    );
  });

  it('renders title and close button when title is provided', () => {
    render(
      <Modal isOpen onClose={() => void 0} title='Confirm Action'>
        <span>content</span>
      </Modal>,
    );
    expect(
      screen.getByRole('heading', { hidden: true, name: 'Confirm Action' })
        .tagName,
    ).toBe('H2');
    expect(
      screen.getByRole('button', { hidden: true, name: 'Close' }),
    ).not.toBeNull();
  });

  it('renders footer content when footer prop is provided', () => {
    render(
      <Modal
        footer={<button type='button'>Submit</button>}
        isOpen
        onClose={() => void 0}
      >
        <span>body</span>
      </Modal>,
    );
    expect(
      screen.getByRole('button', { hidden: true, name: 'Submit' }),
    ).not.toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title='Test'>
        <span>body</span>
      </Modal>,
    );
    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Close' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render title or close button when title is omitted', () => {
    render(
      <Modal isOpen={false} onClose={() => void 0}>
        <span>content</span>
      </Modal>,
    );
    expect(screen.queryByRole('heading', { hidden: true })).toBeNull();
    expect(
      screen.queryByRole('button', { hidden: true, name: 'Close' }),
    ).toBeNull();
  });
});
