// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { mockDialogElement } from '#ui/utils/tests/mockDialogElement.util';

import { SidePanel } from './SidePanel.component';

const dialogMocksRef: {
  current: {
    readonly restoreMockDialog: () => void;
    readonly showMock: ReturnType<typeof vi.fn>;
    readonly showModalMock: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    restoreMockDialog: () => {},
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

const readPanelTabOrder = () => {
  const panel = screen.getByTestId('side-panel');
  const buttons = [...panel.querySelectorAll('button')];

  return [buttons[0]?.textContent, buttons.at(-1)?.dataset.testid];
};

const renderResizablePanel = () => {
  const onWidthChange = vi.fn();
  const onWidthCommit = vi.fn();

  render(
    <SidePanel
      isOpen
      isPinned
      isResizable
      onWidthChange={onWidthChange}
      onWidthCommit={onWidthCommit}
      width={400}
    >
      <span>Pinned content</span>
    </SidePanel>,
  );

  return {
    handle: screen.getByTestId('side-panel-resize-handle'),
    onWidthChange,
    onWidthCommit,
  };
};

type RenderResetPanelArgs = {
  readonly hasReset?: boolean;
};

const renderResetPanel = ({ hasReset = true }: RenderResetPanelArgs = {}) => {
  const onWidthChange = vi.fn();
  const onWidthReset = vi.fn();

  render(
    <SidePanel
      isOpen
      isPinned
      isResizable
      onWidthChange={onWidthChange}
      onWidthReset={hasReset ? onWidthReset : undefined}
      width={640}
    >
      <span>Pinned content</span>
    </SidePanel>,
  );

  return {
    handle: screen.getByTestId('side-panel-resize-handle'),
    onWidthChange,
    onWidthReset,
  };
};

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

  it('offers no resize handle unless the consumer asks for one', () => {
    render(
      <SidePanel isOpen onClose={() => void 0}>
        <span>Dialog content</span>
      </SidePanel>,
    );

    expect(screen.queryByTestId('side-panel-resize-handle')).toBeNull();
  });

  it('resizes from the drag, and commits once the gesture ends', () => {
    const { handle, onWidthChange, onWidthCommit } = renderResizablePanel();

    fireEvent.mouseDown(handle, { clientX: 1000 });
    fireEvent.mouseMove(document, { clientX: 900 });
    fireEvent.mouseUp(document);

    expect({
      committed: onWidthCommit.mock.calls.at(-1),
      resized: onWidthChange.mock.calls.at(-1),
    }).toStrictEqual({ committed: [500], resized: [500] });
  });

  it('commits nothing when the pointer never moved, so a click is not a resize', () => {
    const { handle, onWidthChange, onWidthCommit } = renderResizablePanel();

    fireEvent.mouseDown(handle, { clientX: 1000 });
    fireEvent.mouseUp(document);

    expect({
      committed: onWidthCommit.mock.calls.length,
      resized: onWidthChange.mock.calls.length,
    }).toStrictEqual({ committed: 0, resized: 0 });
  });

  it('resets the width on a double-click, so the panel returns to its size', () => {
    const { handle, onWidthChange, onWidthReset } = renderResetPanel();

    fireEvent.doubleClick(handle);

    expect({
      reset: onWidthReset.mock.calls.length,
      resized: onWidthChange.mock.calls.length,
    }).toStrictEqual({ reset: 1, resized: 0 });
  });

  it('leaves a double-click alone when the consumer offers no reset', () => {
    const { handle, onWidthChange } = renderResetPanel({ hasReset: false });

    const doubleClick = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(handle, doubleClick);

    expect({
      prevented: doubleClick.defaultPrevented,
      resized: onWidthChange.mock.calls.length,
    }).toStrictEqual({ prevented: false, resized: 0 });
  });

  it('resets the width on Enter, so the reset is not pointer-only', () => {
    const { handle, onWidthChange, onWidthReset } = renderResetPanel();

    fireEvent.keyDown(handle, { key: 'Enter' });

    expect({
      reset: onWidthReset.mock.calls.length,
      resized: onWidthChange.mock.calls.length,
    }).toStrictEqual({ reset: 1, resized: 0 });
  });

  it('leaves Enter alone when the consumer offers no reset', () => {
    const { handle, onWidthChange } = renderResetPanel({ hasReset: false });

    const enter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    });
    fireEvent(handle, enter);

    expect({
      prevented: enter.defaultPrevented,
      resized: onWidthChange.mock.calls.length,
    }).toStrictEqual({ prevented: false, resized: 0 });
  });

  it('puts the splitter after the content, so opening the panel does not focus it', () => {
    render(
      <SidePanel isOpen isResizable onWidthChange={vi.fn()}>
        <button type='button'>First control</button>
      </SidePanel>,
    );
    const dialogOrder = readPanelTabOrder();

    cleanup();
    render(
      <SidePanel isOpen isPinned isResizable onWidthChange={vi.fn()}>
        <button type='button'>First control</button>
      </SidePanel>,
    );

    expect([dialogOrder, readPanelTabOrder()]).toStrictEqual([
      ['First control', 'side-panel-resize-handle'],
      ['First control', 'side-panel-resize-handle'],
    ]);
  });

  it('puts the splitter in the tab order without a tabIndex of its own', () => {
    render(
      <SidePanel
        isOpen
        isPinned
        isResizable
        onWidthChange={vi.fn()}
        width={400}
      >
        <span>Pinned content</span>
      </SidePanel>,
    );

    const handle = screen.getByTestId('side-panel-resize-handle');
    handle.focus();

    expect({
      focused: document.activeElement === handle,
      tabIndex: handle.getAttribute('tabindex') ?? undefined,
      tag: handle.tagName,
    }).toStrictEqual({ focused: true, tabIndex: undefined, tag: 'BUTTON' });
  });

  it('resizes from the keyboard, which a pointer gesture is not needed for', () => {
    const onWidthChange = vi.fn();

    render(
      <SidePanel
        isOpen
        isPinned
        isResizable
        onWidthChange={onWidthChange}
        width={400}
      >
        <span>Pinned content</span>
      </SidePanel>,
    );

    fireEvent.keyDown(screen.getByTestId('side-panel-resize-handle'), {
      key: 'ArrowLeft',
    });

    expect(onWidthChange).toHaveBeenCalledWith(416);
  });

  it('starts a gesture from the width the panel paints, not from its floor', async () => {
    const onWidthChange = vi.fn();

    render(
      <SidePanel isOpen isPinned isResizable onWidthChange={onWidthChange}>
        <span>Pinned content</span>
      </SidePanel>,
    );

    const handle = screen.getByTestId('side-panel-resize-handle');
    Object.defineProperty(handle.parentElement, 'offsetWidth', {
      configurable: true,
      value: 416,
    });

    await act(async () => {});

    expect(handle.getAttribute('aria-valuenow')).toBe('416');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });

    expect(onWidthChange).toHaveBeenCalledWith(432);
  });

  it('reports the width it paints, not a stored one the CSS has clamped', async () => {
    const onWidthChange = vi.fn();

    render(
      <SidePanel
        isOpen
        isPinned
        isResizable
        onWidthChange={onWidthChange}
        width={2000}
      >
        <span>Pinned content</span>
      </SidePanel>,
    );

    const handle = screen.getByTestId('side-panel-resize-handle');
    Object.defineProperty(handle.parentElement, 'offsetWidth', {
      configurable: true,
      value: 900,
    });

    await act(async () => {});

    expect(handle.getAttribute('aria-valuenow')).toBe('900');
  });

  it('names the splitter for the package, and lets a consumer say otherwise', () => {
    const { rerender } = render(
      <SidePanel isOpen isPinned isResizable onWidthChange={vi.fn()}>
        <span>Pinned content</span>
      </SidePanel>,
    );

    const named = screen.getByTestId('side-panel-resize-handle');
    const packageLabel = named.getAttribute('aria-label');

    rerender(
      <SidePanel
        isOpen
        isPinned
        isResizable
        onWidthChange={vi.fn()}
        resizeLabel='Resize table settings panel'
      >
        <span>Pinned content</span>
      </SidePanel>,
    );

    expect({
      consumer: screen
        .getByTestId('side-panel-resize-handle')
        .getAttribute('aria-label'),
      package: packageLabel,
    }).toStrictEqual({
      consumer: 'Resize table settings panel',
      package: 'Resize panel',
    });
  });

  it('announces a range the panel width sits inside, viewport or not', async () => {
    render(
      <SidePanel
        isOpen
        isPinned
        isResizable
        onWidthChange={vi.fn()}
        width={400}
      >
        <span>Pinned content</span>
      </SidePanel>,
    );

    const handle = screen.getByTestId('side-panel-resize-handle');
    const read = (name: string) => Number(handle.getAttribute(name));

    expect(read('aria-valuemax')).toBeGreaterThanOrEqual(read('aria-valuenow'));
    expect(read('aria-valuemin')).toBeLessThanOrEqual(read('aria-valuenow'));
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
