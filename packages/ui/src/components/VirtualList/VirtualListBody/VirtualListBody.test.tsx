// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { VirtualListProps } from '../VirtualList.types';

import { VirtualListProvider } from '../contexts';
import { VirtualListBody } from './VirtualListBody.component';

afterEach(cleanup);

type ProviderShellProps = Partial<VirtualListProps> & {
  readonly children: ReactNode;
};

const ProviderShell = ({
  children,
  dataState = {
    data: ['Argentina', 'Brazil'],
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
  },
  hasCheckboxes = true,
  hasSelectAll = true,
  onChange = vi.fn(),
  onFetchInitial,
}: ProviderShellProps) => (
  <VirtualListProvider
    dataState={dataState}
    listState={{ hasCheckboxes, hasSelectAll, onChange, onFetchInitial }}
  >
    {children}
  </VirtualListProvider>
);

describe('VirtualListBody', () => {
  it('renders the loading skeleton during the initial loading bootstrap', () => {
    const onFetchInitial = vi.fn();
    const { container } = render(
      <ProviderShell
        dataState={{
          data: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
        }}
        onFetchInitial={onFetchInitial}
      >
        <VirtualListBody />
      </ProviderShell>,
    );

    expect(container.firstChild).not.toBeNull();
    expect(screen.queryByText('No options found')).toBeNull();
    expect(onFetchInitial).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state when there are no options', () => {
    render(
      <ProviderShell
        dataState={{
          data: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
        }}
      >
        <VirtualListBody />
      </ProviderShell>,
    );

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('renders the virtualized options when data exists', () => {
    render(
      <ProviderShell>
        <VirtualListBody />
      </ProviderShell>,
    );

    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Argentina')).toBeTruthy();
    expect(screen.getByText('Brazil')).toBeTruthy();
  });

  it('emits onChange when an option is toggled', () => {
    const onChange = vi.fn();

    render(
      <ProviderShell hasSelectAll={false} onChange={onChange}>
        <VirtualListBody />
      </ProviderShell>,
    );

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    if (!firstCheckbox) {
      throw new Error('Expected at least one checkbox');
    }
    fireEvent.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['Argentina'],
    });
  });
});
