// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal.component';

// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedClose = HTMLDialogElement.prototype.close;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShow = HTMLDialogElement.prototype.show;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShowModal = HTMLDialogElement.prototype.showModal;
let closeMock: ReturnType<typeof vi.fn>;
let showMock: ReturnType<typeof vi.fn>;
let showModalMock: ReturnType<typeof vi.fn>;

afterEach(() => {
  HTMLDialogElement.prototype.close = savedClose;
  HTMLDialogElement.prototype.show = savedShow;
  HTMLDialogElement.prototype.showModal = savedShowModal;
  cleanup();
});

beforeEach(() => {
  closeMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: false,
      writable: true,
    });
  });
  showMock = vi.fn();
  showModalMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: true,
      writable: true,
    });
  });
  HTMLDialogElement.prototype.close = closeMock as HTMLDialogElement['close'];
  HTMLDialogElement.prototype.show = showMock as HTMLDialogElement['show'];
  HTMLDialogElement.prototype.showModal =
    showModalMock as HTMLDialogElement['showModal'];
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

  it('opens and closes the native dialog when isOpen changes', () => {
    const { rerender } = render(
      <Modal isOpen onClose={() => void 0}>
        <span>content</span>
      </Modal>,
    );

    expect(showModalMock).toHaveBeenCalledTimes(1);

    rerender(
      <Modal isOpen={false} onClose={() => void 0}>
        <span>content</span>
      </Modal>,
    );

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the native dialog close event fires', () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose}>
        <span>content</span>
      </Modal>,
    );

    fireEvent(
      screen.getByText('content').closest('dialog') as HTMLDialogElement,
      new Event('close'),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
