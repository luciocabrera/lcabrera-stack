// @vitest-environment jsdom

import type { RefObject } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { countVisibleTagsMock, mockUseClickOutside, triggerOutsideClick } =
  vi.hoisted(() => {
    let onClickOutside: (() => void) | undefined;

    return {
      countVisibleTagsMock: vi.fn(() => 1),
      mockUseClickOutside: vi.fn(
        (args: {
          readonly onClickOutside: () => void;
          readonly ref: RefObject<HTMLDivElement | null>;
        }) => {
          onClickOutside = args.onClickOutside;
        },
      ),
      triggerOutsideClick: () => {
        onClickOutside?.();
      },
    };
  });

vi.mock('@lcabrera/ui/hooks', async () => {
  const actual =
    await vi.importActual<typeof import('@lcabrera/ui/hooks')>(
      '@lcabrera/ui/hooks',
    );

  return {
    ...actual,
    useClickOutside: mockUseClickOutside,
  };
});

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
  it('maps static options into the list and reports the newly selected value in single mode', async () => {
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

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeTruthy();
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, true);
    const firstUseClickOutsideCallArgs = mockUseClickOutside.mock.calls[0]?.[0];
    expect(firstUseClickOutsideCallArgs).toBeDefined();
    expect(firstUseClickOutsideCallArgs?.ref.current).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Bravo' }));

    expect(onChange).toHaveBeenCalledWith(['bravo-id']);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
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

    expect(screen.queryByRole('listbox')).toBeNull();
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
    expect(screen.getByRole('listbox')).toBeTruthy();

    act(() => {
      triggerOutsideClick();
    });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('removes a selected tag in multi mode through the toggle-option action', () => {
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

  it('keeps multi-select open and forwards the full selected value list', () => {
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

    const bravoRow = screen.getByText('Bravo').closest('label');

    if (bravoRow === null) {
      throw new Error('Expected the Bravo option row to exist');
    }

    fireEvent.click(within(bravoRow).getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(['alpha-id', 'bravo-id']);
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenLastCalledWith(false);
  });

  it('fires onFetchInitial on mount now that the data provider lives on the select', () => {
    const onFetchInitial = vi.fn();

    render(
      <VirtualSelect
        dataState={{
          data: [],
          hasMore: false,
          isLoading: true,
          isLoadingMore: false,
        }}
        mode='multi'
        onChange={() => void 0}
        onFetchInitial={onFetchInitial}
        selected={[]}
      />,
    );

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onFetchInitial).toHaveBeenCalledTimes(1);
  });
});
