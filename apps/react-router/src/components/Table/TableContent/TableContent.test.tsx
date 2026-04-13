// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableContent } from './TableContent.component.tsx';

const {
  useFetchMoreDataMock,
  useGetTableHasMoreMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useGetTableThresholdMock,
  useInfiniteScrollMock,
  useRenderTrackerMock,
  useToogleTableIsTableSettingsOpenMock,
} = vi.hoisted(() => ({
  useFetchMoreDataMock: vi.fn(() => vi.fn()),
  useGetTableHasMoreMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsLoadingMoreMock: vi.fn(),
  useGetTableThresholdMock: vi.fn(),
  useInfiniteScrollMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
  useToogleTableIsTableSettingsOpenMock: vi.fn(() => vi.fn()),
}));

function MockTableBase({ children }: { readonly children: ReactNode }) {
  return <table>{children}</table>;
}

function MockTableBody() {
  return <tbody data-testid='table-body' />;
}

function MockTableDrawersSection() {
  return <div data-testid='table-drawers' />;
}

function MockTableHeader() {
  return <thead data-testid='table-header' />;
}

function MockTableTitle({ actions }: { readonly actions?: ReactNode }) {
  return <div data-testid='table-title'>{actions}</div>;
}

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('../contexts/TableConfig/meta/actions', () => ({
  useToogleTableIsTableSettingsOpen: useToogleTableIsTableSettingsOpenMock,
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableThreshold: useGetTableThresholdMock,
}));

vi.mock('../contexts/TableData/data/actions', () => ({
  useFetchMoreData: useFetchMoreDataMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableHasMore: useGetTableHasMoreMock,
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

vi.mock('../hooks', () => ({
  useInfiniteScroll: useInfiniteScrollMock,
}));

vi.mock('../TableBase', () => ({
  TableBase: MockTableBase,
}));

vi.mock('../TableBody', () => ({
  TableBody: MockTableBody,
}));

vi.mock('../TableDrawersSection', () => ({
  TableDrawersSection: MockTableDrawersSection,
}));

vi.mock('../TableHeader', () => ({
  TableHeader: MockTableHeader,
}));

vi.mock('../TableTitle', () => ({
  TableTitle: MockTableTitle,
}));

describe('TableContent', () => {
  beforeEach(() => {
    useGetTableThresholdMock.mockReturnValue(200);
    useGetTableHasMoreMock.mockReturnValue(true);
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
  });

  afterEach(cleanup);

  it('locks scrolling during the initial loading state', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);

    render(<TableContent />);

    const tableBody = screen.getByTestId('table-body');
    const scrollContainer = tableBody.closest('[data-scroll-locked]');
    expect(scrollContainer).toBeInstanceOf(HTMLElement);
    if (!(scrollContainer instanceof HTMLElement)) {
      throw new TypeError('Expected scroll container to be an HTMLElement');
    }

    expect(scrollContainer.dataset.scrollLocked).toBe('true');
    expect(screen.getByTestId('table-header')).toBeTruthy();
    expect(screen.getByTestId('table-body')).toBeTruthy();
  });

  it('keeps scrolling enabled when idle', () => {
    render(<TableContent />);

    const tableBody = screen.getByTestId('table-body');
    const scrollContainer = tableBody.closest('[data-scroll-locked]');
    expect(scrollContainer).toBeInstanceOf(HTMLElement);
    if (!(scrollContainer instanceof HTMLElement)) {
      throw new TypeError('Expected scroll container to be an HTMLElement');
    }

    expect(scrollContainer.dataset.scrollLocked).toBe('false');
  });
});
