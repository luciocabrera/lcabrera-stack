// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { VirtualListDataState } from '../VirtualList.types';

import { VirtualListProvider } from '../contexts';
import { VirtualListContent } from './VirtualListContent.component';

afterEach(cleanup);

const baseDataState: VirtualListDataState = {
  data: ['Alpha', 'Beta', 'Gamma'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

const renderContent = () =>
  render(
    <VirtualListProvider
      dataState={baseDataState}
      listState={{ hasCheckboxes: true, hasSelectAll: true, onChange: vi.fn() }}
    >
      <VirtualListContent />
    </VirtualListProvider>,
  );

describe('VirtualListContent', () => {
  it('composes the search header, the options body, and the footer', () => {
    renderContent();

    expect(screen.getByPlaceholderText('Search options...')).toBeTruthy();
    expect(screen.getByText('Select All')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
    expect(screen.getByText(/Loaded: 3/)).toBeTruthy();
  });

  it('renders without its own providers when they are mounted by a composing component', () => {
    const { container } = renderContent();

    expect(container.querySelectorAll('input[type="text"]')).toHaveLength(1);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });
});
