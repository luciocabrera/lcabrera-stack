// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { VirtualListFooter } from './VirtualListFooter.component.tsx';

afterEach(() => {
  cleanup();
});

const dataStateBase = {
  data: ['Option A', 'Option B'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  totalCount: 2,
};

describe('VirtualListFooter', () => {
  it('renders nothing when data is empty', () => {
    const { container } = render(
      <VirtualListFooter
        dataState={{ ...dataStateBase, data: [] }}
        effectiveOptions={[]}
        hasCheckboxes
        listFilterMode='all'
        selectedValues={[]}
        setListFilterMode={() => void 0}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders loaded count when data has items', () => {
    render(
      <VirtualListFooter
        dataState={dataStateBase}
        effectiveOptions={['Option A', 'Option B']}
        hasCheckboxes
        listFilterMode='all'
        selectedValues={[]}
        setListFilterMode={() => void 0}
      />,
    );
    expect(screen.getByText(/Loaded: 2/).textContent).toContain('Loaded: 2');
  });

  it('includes total count when totalCount is finite and non-zero', () => {
    render(
      <VirtualListFooter
        dataState={{ ...dataStateBase, totalCount: 10 }}
        effectiveOptions={['Option A', 'Option B']}
        hasCheckboxes
        listFilterMode='all'
        selectedValues={[]}
        setListFilterMode={() => void 0}
      />,
    );
    expect(screen.getByText(/Loaded: 2/).textContent).toContain('/ 10');
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <VirtualListFooter
        dataState={{ ...dataStateBase, isLoading: true }}
        effectiveOptions={['Option A', 'Option B']}
        hasCheckboxes
        listFilterMode='all'
        selectedValues={[]}
        setListFilterMode={() => void 0}
      />,
    );
    expect(screen.getByText(/Loaded:/).textContent).toContain('Loading...');
  });
});
