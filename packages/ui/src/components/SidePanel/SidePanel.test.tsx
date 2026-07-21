// @vitest-environment jsdom

import { mockDialogElement } from '@lcabrera/ui/utils/tests/mockDialogElement.util';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SidePanel } from './SidePanel.component';

const dialogMocksRef: {
  current: {
    readonly restoreMockDialog: () => void;
    readonly showMock: ReturnType<typeof vi.fn>;
    readonly showModalMock: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    restoreMockDialog: () => {
      // no-op default restore before setup
    },
    showMock: vi.fn(),
    showModalMock: vi.fn(),
  },
};

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement();
  dialogMocksRef.current = {
    restoreMockDialog: setup.restore,
    showMock: setup.showMock,
    showModalMock: setup.showModalMock,
  };
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

    expect(dialogMocksRef.current.showModalMock).toHaveBeenCalledTimes(1);

    rerender(
      <SidePanel isOpen onClose={() => void 0} shouldShowOverlay={false}>
        <span>Dialog content</span>
      </SidePanel>,
    );

    expect(dialogMocksRef.current.showMock).toHaveBeenCalledTimes(1);
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
