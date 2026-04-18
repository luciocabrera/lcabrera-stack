// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SidePanel } from './SidePanel.component';

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
  showMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: true,
      writable: true,
    });
  });
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

describe('SidePanel', () => {
  it('renders children content', () => {
    render(
      <SidePanel isOpen={false}>
        <span>Panel content</span>
      </SidePanel>,
    );
    expect(screen.getByText('Panel content').textContent).toBe('Panel content');
  });

  it('renders as aside element when isPinned is true', () => {
    render(
      <SidePanel isOpen isPinned>
        <span>Pinned content</span>
      </SidePanel>,
    );
    const panel = screen.getByTestId('side-panel');
    expect(panel.tagName).toBe('ASIDE');
    expect(panel.getAttribute('aria-label')).toBe('Settings panel');
  });

  it('renders as dialog element when not pinned', () => {
    render(
      <SidePanel isOpen={false}>
        <span>Dialog content</span>
      </SidePanel>,
    );
    const panel = screen.getByTestId('side-panel');
    expect(panel.tagName).toBe('DIALOG');
  });

  it('uses showModal when the overlay is enabled and show when it is disabled', () => {
    const { rerender } = render(
      <SidePanel isOpen onClose={() => void 0}>
        <span>Dialog content</span>
      </SidePanel>,
    );

    expect(showModalMock).toHaveBeenCalledTimes(1);

    rerender(
      <SidePanel isOpen onClose={() => void 0} shouldShowOverlay={false}>
        <span>Dialog content</span>
      </SidePanel>,
    );

    expect(showMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the native dialog close event fires', () => {
    const onClose = vi.fn();

    render(
      <SidePanel isOpen onClose={onClose}>
        <span>Dialog content</span>
      </SidePanel>,
    );

    fireEvent(screen.getByTestId('side-panel'), new Event('close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a pinned panel into the provided portal container', () => {
    const portalNode = document.createElement('div');
    document.body.append(portalNode);

    render(
      <SidePanel isOpen isPinned portalContainer={{ current: portalNode }}>
        <span>Portaled content</span>
      </SidePanel>,
    );

    expect(portalNode.textContent).toContain('Portaled content');
  });
});
