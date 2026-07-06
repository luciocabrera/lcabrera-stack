// @vitest-environment jsdom

import type { VirtualListDataState } from '@repo/ui/components/VirtualList';
import type { SelectFilter } from '@repo/ui/types/filterOperators.types';
import type { RefObject } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  countVisibleTagsMock,
  getLatestVirtualListProps,
  mockUseClickOutside,
  setLatestVirtualListProps,
  triggerOutsideClick,
} = vi.hoisted(() => {
  let latestVirtualListProps:
    | undefined
    | {
        readonly dataState: VirtualListDataState;
        readonly filter: SelectFilter;
        readonly hasCheckboxes: boolean;
        readonly hasSelectAll: boolean;
        readonly listMaxHeight: string;
        readonly onChange: (filter?: SelectFilter) => void;
        readonly onFetchInitial?: () => Promise<void> | void;
        readonly onFetchMore?: () => Promise<void> | void;
        readonly shouldFillHeight: boolean;
      };
  let onClickOutside: (() => void) | undefined;

  return {
    countVisibleTagsMock: vi.fn(() => 1),
    getLatestVirtualListProps: () => latestVirtualListProps,
    mockUseClickOutside: vi.fn(
      (args: {
        readonly onClickOutside: () => void;
        readonly ref: RefObject<HTMLDivElement | null>;
      }) => {
        onClickOutside = args.onClickOutside;
      },
    ),
    setLatestVirtualListProps: (
      props: typeof latestVirtualListProps | undefined,
    ) => {
      latestVirtualListProps = props;
    },
    triggerOutsideClick: () => {
      onClickOutside?.();
    },
  };
});

vi.mock('@repo/ui/components/VirtualList', () => ({
  VirtualList: (
    props: NonNullable<Parameters<typeof setLatestVirtualListProps>[0]>,
  ) => {
    setLatestVirtualListProps(props);
    return <div data-testid='virtual-list'>Virtual list</div>;
  },
}));

vi.mock('@repo/ui/hooks', () => ({
  useClickOutside: mockUseClickOutside,
}));

vi.mock('./utils', async () => {
  const actual = await vi.importActual<typeof import('./utils')>('./utils');

  return {
    ...actual,
    countVisibleTags: countVisibleTagsMock,
  };
});

import { VirtualSelect } from './VirtualSelect.component';

const resizeObserverCallbackRef: {
  current: ResizeObserverCallback | undefined;
} = {
  current: undefined,
};

beforeEach(() => {
  resizeObserverCallbackRef.current = undefined;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      public constructor(callback: ResizeObserverCallback) {
        resizeObserverCallbackRef.current = callback;
      }

      public disconnect() {
        // noop
      }

      public observe() {
        // noop
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('VirtualSelect', () => {
  it('maps static options into VirtualList data and reports the newly selected value in single mode', async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <VirtualSelect
        mode='single'
        onChange={onChange}
        onOpenChange={onOpenChange}
        options={[
          { label: 'Alpha', value: 'alpha-id' },
          { label: 'Bravo', value: 'bravo-id' },
        ]}
        selected={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));

    expect(screen.getByTestId('virtual-list').textContent).toBe('Virtual list');
    expect(getLatestVirtualListProps()?.dataState.data).toEqual([
      'Alpha',
      'Bravo',
    ]);
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, true);
    const firstUseClickOutsideCallArgs = mockUseClickOutside.mock.calls[0]?.[0];
    expect(firstUseClickOutsideCallArgs).toBeDefined();
    expect(firstUseClickOutsideCallArgs?.ref.current).not.toBeNull();

    await act(async () => {
      getLatestVirtualListProps()?.onChange({
        type: 'select',
        values: ['Bravo'],
      });
    });

    expect(onChange).toHaveBeenCalledWith(['bravo-id']);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('does not open when busy and renders a disabled trigger', () => {
    render(
      <VirtualSelect
        isBusy
        mode='single'
        onChange={() => void 0}
        options={['Alpha', 'Bravo']}
        selected={[]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Select...' });

    expect(trigger.hasAttribute('disabled')).toBe(true);

    fireEvent.click(trigger);

    expect(screen.queryByTestId('virtual-list')).toBeNull();
  });

  it('closes when the outside-click handler fires', async () => {
    const onOpenChange = vi.fn();

    render(
      <VirtualSelect
        mode='single'
        onChange={() => void 0}
        onOpenChange={onOpenChange}
        options={['Alpha', 'Bravo']}
        selected={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));
    expect(screen.getByTestId('virtual-list').textContent).toBe('Virtual list');

    act(() => {
      triggerOutsideClick();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('virtual-list')).toBeNull();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('removes a selected tag in multi mode and recalculates visible tags', () => {
    const onChange = vi.fn();
    countVisibleTagsMock.mockReturnValue(1);

    render(
      <VirtualSelect
        mode='multi'
        onChange={onChange}
        options={[
          { label: 'Alpha', value: 'alpha-id' },
          { label: 'Bravo', value: 'bravo-id' },
        ]}
        selected={['alpha-id', 'bravo-id']}
      />,
    );

    act(() => {
      resizeObserverCallbackRef.current?.([], {} as ResizeObserver);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(countVisibleTagsMock).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(['bravo-id']);
  });

  it('keeps multi-select open and forwards the full selected value list', async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <VirtualSelect
        mode='multi'
        onChange={onChange}
        onOpenChange={onOpenChange}
        options={[
          { label: 'Alpha', value: 'alpha-id' },
          { label: 'Bravo', value: 'bravo-id' },
        ]}
        selected={['alpha-id']}
      />,
    );

    const trigger = document.querySelector('[aria-haspopup="listbox"]');

    if (trigger === null) {
      throw new Error('Expected virtual select trigger to exist');
    }

    fireEvent.click(trigger);

    await act(async () => {
      getLatestVirtualListProps()?.onChange({
        type: 'select',
        values: ['Alpha', 'Bravo'],
      });
    });

    expect(onChange).toHaveBeenCalledWith(['alpha-id', 'bravo-id']);
    expect(onOpenChange).not.toHaveBeenLastCalledWith(false);
  });
});
