// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { VirtualListProvider } from '../contexts';
import { VirtualListContent } from './VirtualListContent.component';

afterEach(cleanup);

const renderInFillMode = (shouldFillHeight: boolean) =>
  render(
    <VirtualListProvider
      dataState={{
        data: ['North', 'South'],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      }}
      listState={{ onChange: vi.fn(), shouldFillHeight }}
    >
      <VirtualListContent />
    </VirtualListProvider>,
  );

const searchGroup = () =>
  screen.getByPlaceholderText('Search options...').parentElement?.parentElement;

describe('VirtualListContent layout', () => {
  it('lets the search-and-list group fill the height only in fill mode', () => {
    renderInFillMode(false);
    const contentSizedClassName = searchGroup()?.className;
    cleanup();
    renderInFillMode(true);

    expect(searchGroup()?.className).not.toBe(contentSizedClassName);
  });
});
