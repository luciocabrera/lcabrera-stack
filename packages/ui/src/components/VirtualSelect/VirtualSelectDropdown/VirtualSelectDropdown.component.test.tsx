// @vitest-environment jsdom

import type { VirtualListDataState } from '@repo/ui/components/VirtualList';
import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getLatestVirtualListProps, setLatestVirtualListProps } = vi.hoisted(
  () => {
    let latestVirtualListProps:
      | undefined
      | {
          readonly dataState: VirtualListDataState;
          readonly filter: SelectFilter;
          readonly hasCheckboxes: boolean;
          readonly hasSelectAll: boolean;
          readonly listMaxHeight: string;
          readonly onChange: (filter?: SelectFilter) => void;
          readonly shouldFillHeight: boolean;
        };

    return {
      getLatestVirtualListProps: () => latestVirtualListProps,
      setLatestVirtualListProps: (
        props: typeof latestVirtualListProps | undefined,
      ) => {
        latestVirtualListProps = props;
      },
    };
  },
);

vi.mock('@repo/ui/components/VirtualList', () => ({
  VirtualList: (
    props: NonNullable<Parameters<typeof setLatestVirtualListProps>[0]>,
  ) => {
    setLatestVirtualListProps(props);
    return <div data-testid='virtual-list'>Virtual list</div>;
  },
}));

import { VirtualSelectDropdown } from './VirtualSelectDropdown.component';

const valueByLabel: Record<string, string> = {
  Alpha: 'alpha-id',
  Bravo: 'bravo-id',
};

const createProps = () => ({
  dataState: {
    data: ['Alpha', 'Bravo'],
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
  } satisfies VirtualListDataState,
  getValueFromLabel: (label: string) => valueByLabel[label] ?? label,
  isAlwaysOpen: false,
  isListVisible: true,
  listboxId: 'listbox-id',
  listMaxHeight: '18.75rem',
  mode: 'single' as const,
  onChange: vi.fn(),
  onClose: vi.fn(),
  selected: [] as readonly string[],
  selectedLabels: [] as readonly string[],
  shouldFillHeight: false,
});

afterEach(() => {
  setLatestVirtualListProps(undefined);
  cleanup();
});

describe('VirtualSelectDropdown', () => {
  it('renders nothing while the list is hidden', () => {
    const props = { ...createProps(), isListVisible: false };

    const { container } = render(<VirtualSelectDropdown {...props} />);

    expect(container.firstChild).toBeNull();
    expect(getLatestVirtualListProps()).toBeUndefined();
  });

  it('renders the listbox shell and forwards single-mode props to VirtualList', () => {
    const props = createProps();

    render(<VirtualSelectDropdown {...props} />);

    const listbox = screen.getByRole('listbox');

    expect(listbox.id).toBe('listbox-id');
    expect(screen.getByTestId('virtual-list').textContent).toBe('Virtual list');

    const virtualListProps = getLatestVirtualListProps();

    expect(virtualListProps?.dataState.data).toEqual(['Alpha', 'Bravo']);
    expect(virtualListProps?.filter).toEqual({ type: 'select', values: [] });
    expect(virtualListProps?.hasCheckboxes).toBe(false);
    expect(virtualListProps?.hasSelectAll).toBe(false);
    expect(virtualListProps?.listMaxHeight).toBe('18.75rem');
  });

  it('reports the newly picked value and closes after a single-mode change', () => {
    const props = createProps();

    render(<VirtualSelectDropdown {...props} />);

    getLatestVirtualListProps()?.onChange({
      type: 'select',
      values: ['Bravo'],
    });

    expect(props.onChange).toHaveBeenCalledWith(['bravo-id']);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards the full multi-mode selection and stays open', () => {
    const props = {
      ...createProps(),
      mode: 'multi' as const,
      selected: ['alpha-id'] as readonly string[],
      selectedLabels: ['Alpha'] as readonly string[],
    };

    render(<VirtualSelectDropdown {...props} />);

    const virtualListProps = getLatestVirtualListProps();

    expect(virtualListProps?.hasCheckboxes).toBe(true);
    expect(virtualListProps?.hasSelectAll).toBe(true);
    expect(virtualListProps?.filter).toEqual({
      type: 'select',
      values: ['Alpha'],
    });

    virtualListProps?.onChange({
      type: 'select',
      values: ['Alpha', 'Bravo'],
    });

    expect(props.onChange).toHaveBeenCalledWith(['alpha-id', 'bravo-id']);
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
