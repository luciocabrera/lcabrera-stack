// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { VirtualListDataState } from '../VirtualList.types';

import { VirtualListProvider } from '../contexts';
import { VirtualListFooter } from './VirtualListFooter.component';

afterEach(cleanup);

type ProviderShellProps = {
  readonly children: ReactNode;
  readonly dataState: VirtualListDataState;
  readonly hasCheckboxes?: boolean;
  readonly selectedValues?: readonly string[];
};

const ProviderShell = ({
  children,
  dataState,
  hasCheckboxes = true,
  selectedValues = [],
}: ProviderShellProps) => (
  <VirtualListProvider
    dataState={dataState}
    filter={{ type: 'select', values: selectedValues }}
    listState={{ hasCheckboxes, hasSelectAll: true, onChange: vi.fn() }}
  >
    {children}
  </VirtualListProvider>
);

const loadedDataState: VirtualListDataState = {
  data: ['Alpha', 'Beta', 'Gamma'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

describe('VirtualListFooter', () => {
  it('renders nothing while no options are loaded', () => {
    const { container } = render(
      <ProviderShell
        dataState={{
          data: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
        }}
      >
        <VirtualListFooter />
      </ProviderShell>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows the loaded count with the total when available', () => {
    render(
      <ProviderShell dataState={{ ...loadedDataState, totalCount: 10 }}>
        <VirtualListFooter />
      </ProviderShell>,
    );

    expect(screen.getByText('Loaded: 3 / 10')).toBeTruthy();
  });

  it('appends the loading indicators', () => {
    render(
      <ProviderShell dataState={{ ...loadedDataState, isLoadingMore: true }}>
        <VirtualListFooter />
      </ProviderShell>,
    );

    expect(screen.getByText(/Loading more\.\.\./)).toBeTruthy();
  });

  it('renders the three filter-mode buttons with checkboxes enabled', () => {
    render(
      <ProviderShell dataState={loadedDataState} selectedValues={['Beta']}>
        <VirtualListFooter />
      </ProviderShell>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('Show all options (3)')).toBeTruthy();
    expect(screen.getByText('Show only selected options (1)')).toBeTruthy();
    expect(screen.getByText('Show only unselected options (2)')).toBeTruthy();
  });

  it('hides the filter-mode buttons without checkboxes', () => {
    render(
      <ProviderShell dataState={loadedDataState} hasCheckboxes={false}>
        <VirtualListFooter />
      </ProviderShell>,
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
