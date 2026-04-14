// @vitest-environment jsdom

import type { RefObject } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { VirtualListDataState } from '@/components/VirtualList';
import type { SelectFilter } from '@/types/filterOperators.types';

const {
  countVisibleTagsMock,
  getLatestVirtualListProps,
  mockUseClickOutside,
  setLatestVirtualListProps,
  triggerOutsideClick,
} = vi.hoisted(() => {
  let latestVirtualListProps:
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
      }
    | undefined;
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

vi.mock('@/components/VirtualList', () => ({
  VirtualList: (
    props: NonNullable<Parameters<typeof setLatestVirtualListProps>[0]>,
  ) => {
    setLatestVirtualListProps(props);
    return <div data-testid='virtual-list'>Virtual list</div>;
  },
}));

vi.mock('@/hooks', () => ({
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

afterEach(() => {
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
});
