// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { VirtualListDataState } from '../../VirtualList.types';

import {
  VirtualListConfigProvider,
  VirtualListDataProvider,
} from '../../contexts';
import { VirtualListBodyChildren } from './VirtualListBodyChildren.component';

afterEach(cleanup);

const Harness = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollContainerRef}>
      <VirtualListBodyChildren scrollContainerRef={scrollContainerRef} />
    </div>
  );
};

type RenderArgs = {
  readonly dataState: VirtualListDataState;
  readonly hasFetchInitial?: boolean;
};

const renderChildren = ({ dataState, hasFetchInitial = false }: RenderArgs) =>
  render(
    <VirtualListConfigProvider
      hasCheckboxes
      hasSelectAll
      onChange={vi.fn()}
      onFetchInitial={hasFetchInitial ? vi.fn() : undefined}
    >
      <VirtualListDataProvider
        dataState={dataState}
        hasSelectAll
        onFetchInitial={hasFetchInitial ? vi.fn() : undefined}
      >
        <Harness />
      </VirtualListDataProvider>
    </VirtualListConfigProvider>,
  );

describe('VirtualListBodyChildren', () => {
  it('renders the skeleton in loading mode', () => {
    renderChildren({
      dataState: {
        data: [],
        hasMore: false,
        isLoading: true,
        isLoadingMore: false,
      },
    });

    expect(screen.queryByText('No options found')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('renders the skeleton while bootstrapping via onFetchInitial', () => {
    renderChildren({
      dataState: {
        data: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      },
      hasFetchInitial: true,
    });

    expect(screen.queryByText('No options found')).toBeNull();
  });

  it('renders the empty state when no options match', () => {
    renderChildren({
      dataState: {
        data: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    expect(screen.getByText('No options found')).toBeTruthy();
  });

  it('renders the virtualized options with the select-all row', () => {
    renderChildren({
      dataState: {
        data: ['Alpha', 'Beta'],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      },
    });

    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });
});
