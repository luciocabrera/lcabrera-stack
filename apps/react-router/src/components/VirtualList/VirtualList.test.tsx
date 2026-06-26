// @vitest-environment jsdom

import type { ChangeEvent } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { VirtualListDataState } from './VirtualList.types';

const {
  MockVirtualListBody,
  MockVirtualListFooter,
  MockVirtualListHeader,
  capturedBodyProps,
  capturedHeaderProps,
} = vi.hoisted(() => {
  const capturedHeaderProps: { current: Record<string, unknown> } = {
    current: {},
  };
  const capturedBodyProps: { current: Record<string, unknown> } = {
    current: {},
  };
  const capturedFooterProps: { current: Record<string, unknown> } = {
    current: {},
  };

  const MockVirtualListHeader = vi.fn(
    (props: {
      readonly name?: string;
      readonly onClearSearch: () => void;
      readonly onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
      readonly searchTerm: string;
    }) => {
      capturedHeaderProps.current = props as Record<string, unknown>;
      return (
        <div data-testid='virtual-list-header'>
          <input
            data-testid='search-input'
            onChange={props.onSearchChange}
            value={props.searchTerm}
          />
          <button
            data-testid='clear-search'
            onClick={props.onClearSearch}
            type='button'
          >
            Clear
          </button>
        </div>
      );
    },
  );

  const MockVirtualListBody = vi.fn(
    (props: { readonly selectedValues: readonly string[] }) => {
      capturedBodyProps.current = props as Record<string, unknown>;
      return <div data-testid='virtual-list-body' />;
    },
  );

  const MockVirtualListFooter = vi.fn((props: Record<string, unknown>) => {
    capturedFooterProps.current = props;
    return <div data-testid='virtual-list-footer' />;
  });

  return {
    MockVirtualListBody,
    MockVirtualListFooter,
    MockVirtualListHeader,
    capturedBodyProps,
    capturedFooterProps,
    capturedHeaderProps,
  };
});

vi.mock('./VirtualListHeader', () => ({
  VirtualListHeader: MockVirtualListHeader,
}));

vi.mock('./VirtualListBody', () => ({
  VirtualListBody: MockVirtualListBody,
}));

vi.mock('./VirtualListFooter', () => ({
  VirtualListFooter: MockVirtualListFooter,
}));

import { VirtualList } from './VirtualList.component';

afterEach(cleanup);

const baseDataState: VirtualListDataState = {
  data: ['Alpha', 'Beta', 'Gamma'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

describe('VirtualList', () => {
  it('renders the header, body, and footer', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    expect(screen.getByTestId('virtual-list-header')).not.toBeNull();
    expect(screen.getByTestId('virtual-list-body')).not.toBeNull();
    expect(screen.getByTestId('virtual-list-footer')).not.toBeNull();
  });

  it('passes empty selectedValues to body when no filter is provided', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    expect(capturedBodyProps.current['selectedValues']).toEqual([]);
  });

  it('passes filter.values as selectedValues to body', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        filter={{ type: 'select', values: ['Alpha', 'Beta'] }}
        onChange={vi.fn()}
      />,
    );

    expect(capturedBodyProps.current['selectedValues']).toEqual([
      'Alpha',
      'Beta',
    ]);
  });

  it('starts with an empty searchTerm passed to the header', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    expect(capturedHeaderProps.current['searchTerm']).toBe('');
  });

  it('updates searchTerm in the header when the input changes', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'Alp' },
    });

    expect(capturedHeaderProps.current['searchTerm']).toBe('Alp');
  });

  it('clears searchTerm when the clear callback is invoked', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'Alpha' },
    });
    fireEvent.click(screen.getByTestId('clear-search'));

    expect(capturedHeaderProps.current['searchTerm']).toBe('');
  });

  it('passes the searchTerm down to the body', () => {
    render(<VirtualList dataState={baseDataState} onChange={vi.fn()} />);

    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'Gam' },
    });

    expect(capturedBodyProps.current['searchTerm']).toBe('Gam');
  });

  it('passes shouldFillHeight to the body', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        onChange={vi.fn()}
        shouldFillHeight
      />,
    );

    expect(capturedBodyProps.current['shouldFillHeight']).toBe(true);
  });

  it('passes listMaxHeight to the body', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        listMaxHeight='20rem'
        onChange={vi.fn()}
      />,
    );

    expect(capturedBodyProps.current['listMaxHeight']).toBe('20rem');
  });

  it('passes the name to the header', () => {
    render(
      <VirtualList
        dataState={baseDataState}
        name='country-filter'
        onChange={vi.fn()}
      />,
    );

    expect(capturedHeaderProps.current['name']).toBe('country-filter');
  });
});
