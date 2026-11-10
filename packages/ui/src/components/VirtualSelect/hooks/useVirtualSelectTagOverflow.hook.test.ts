// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { VirtualSelectMode } from '../VirtualSelect.types';

const { countVisibleTagsMock, resizeObservers } = vi.hoisted(() => ({
  countVisibleTagsMock: vi.fn(),
  resizeObservers: [] as {
    readonly callback: () => void;
    readonly disconnect: ReturnType<typeof vi.fn>;
    readonly observe: ReturnType<typeof vi.fn>;
  }[],
}));

vi.mock('../utils', () => ({
  countVisibleTags: countVisibleTagsMock,
}));

import { useVirtualSelectTagOverflow } from './useVirtualSelectTagOverflow.hook';

type RenderArgs = {
  readonly mode?: VirtualSelectMode;
  readonly selected: readonly string[];
};

class ResizeObserverStub {
  readonly disconnect = vi.fn();

  readonly observe = vi.fn();

  constructor(callback: () => void) {
    resizeObservers.push({
      callback,
      disconnect: this.disconnect,
      observe: this.observe,
    });
  }
}

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const setup = ({ mode = 'multi', selected }: RenderArgs) => {
  const trigger = document.createElement('div');
  const triggerRef = { current: trigger };
  const view = renderHook(
    (props: Required<RenderArgs>) =>
      useVirtualSelectTagOverflow({ ...props, triggerRef }),
    { initialProps: { mode, selected } },
  );

  return { trigger, view };
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  countVisibleTagsMock.mockReset();
  resizeObservers.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useVirtualSelectTagOverflow', () => {
  it('shows every selected tag until the trigger has been measured', () => {
    countVisibleTagsMock.mockReturnValue(1);

    const { view } = setup({ selected: ['a', 'b', 'c'] });

    expect(view.result.current).toBe(3);
  });

  it('takes the measured count once the trigger has rendered', async () => {
    countVisibleTagsMock.mockReturnValue(2);

    const { trigger, view } = setup({ selected: ['a', 'b', 'c'] });
    await flushMicrotasks();

    expect(view.result.current).toBe(2);
    expect(countVisibleTagsMock).toHaveBeenLastCalledWith({
      totalCount: 3,
      trigger,
    });
  });

  it('never measures a single select', async () => {
    const { view } = setup({ mode: 'single', selected: ['a'] });
    await flushMicrotasks();

    expect(countVisibleTagsMock).not.toHaveBeenCalled();
    expect(view.result.current).toBe(1);
  });

  it('measures again when the trigger resizes', async () => {
    countVisibleTagsMock.mockReturnValue(2);
    const { trigger, view } = setup({ selected: ['a', 'b', 'c'] });
    await flushMicrotasks();

    expect(resizeObservers[0]?.observe).toHaveBeenCalledWith(trigger);

    countVisibleTagsMock.mockReturnValue(1);
    act(() => {
      resizeObservers[0]?.callback();
    });

    expect(view.result.current).toBe(1);
  });

  it('measures again when the tags inside the trigger change', async () => {
    countVisibleTagsMock.mockReturnValue(2);
    const { trigger, view } = setup({ selected: ['a', 'b', 'c'] });
    await flushMicrotasks();

    countVisibleTagsMock.mockReturnValue(3);
    trigger.append(document.createElement('span'));
    await flushMicrotasks();

    expect(view.result.current).toBe(3);
  });

  it('shows every tag of a new selection before measuring it', async () => {
    countVisibleTagsMock.mockReturnValue(1);
    const { view } = setup({ selected: ['a', 'b', 'c'] });
    await flushMicrotasks();

    view.rerender({ mode: 'multi', selected: ['a', 'b', 'c', 'd'] });

    expect(view.result.current).toBe(4);
  });

  it('stops observing the trigger once unmounted', async () => {
    countVisibleTagsMock.mockReturnValue(2);
    const { trigger, view } = setup({ selected: ['a', 'b', 'c'] });
    await flushMicrotasks();
    countVisibleTagsMock.mockClear();

    view.unmount();
    trigger.append(document.createElement('span'));
    await flushMicrotasks();

    expect(resizeObservers[0]?.disconnect).toHaveBeenCalled();
    expect(countVisibleTagsMock).not.toHaveBeenCalled();
  });

  it('skips the first measurement when unmounted before it runs', async () => {
    const { view } = setup({ selected: ['a', 'b'] });

    view.unmount();
    await flushMicrotasks();

    expect(countVisibleTagsMock).not.toHaveBeenCalled();
  });
});
