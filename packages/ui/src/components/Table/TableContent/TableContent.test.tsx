// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { TableContent } from './TableContent.component';

const {
  useFetchMoreDataMock,
  useGetColumnsMock,
  useGetTableCrudMock,
  useGetTableDeleteActionPathMock,
  useGetTableHasMoreMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useGetTableIsRoundedMock,
  useGetTableThresholdMock,
  useGetTableTitleSingularMock,
  useInfiniteScrollMock,
  useToogleTableIsTableSettingsOpenMock,
} = vi.hoisted(() => ({
  useFetchMoreDataMock: vi.fn(() => vi.fn()),
  useGetColumnsMock: vi.fn(() => []),
  useGetTableCrudMock: vi.fn(),
  useGetTableDeleteActionPathMock: vi.fn(),
  useGetTableHasMoreMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsLoadingMoreMock: vi.fn(),
  useGetTableIsRoundedMock: vi.fn(),
  useGetTableThresholdMock: vi.fn(),
  useGetTableTitleSingularMock: vi.fn(),
  useInfiniteScrollMock: vi.fn(),
  useToogleTableIsTableSettingsOpenMock: vi.fn(() => vi.fn()),
}));

const MockTableBase = vi.hoisted(() => {
  return function MockTableBase({
    children,
  }: {
    readonly children: ReactNode;
  }) {
    return <table>{children}</table>;
  };
});

const MockTableBody = vi.hoisted(() => {
  return function MockTableBody() {
    return <tbody data-testid='table-body' />;
  };
});

const MockTableDrawersSection = vi.hoisted(() => {
  return function MockTableDrawersSection() {
    return <div data-testid='table-drawers' />;
  };
});

const MockTableHeader = vi.hoisted(() => {
  return function MockTableHeader() {
    return <thead data-testid='table-header' />;
  };
});

const MockTableTitle = vi.hoisted(() => {
  return function MockTableTitle({
    actions,
  }: {
    readonly actions?: ReactNode;
  }) {
    return <div data-testid='table-title'>{actions}</div>;
  };
});

vi.mock('../contexts/TableConfig/grouping/actions', () => ({
  useSyncColumnAxisColumns: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/actions', () => ({
  useToogleTableIsTableSettingsOpen: useToogleTableIsTableSettingsOpenMock,
}));

vi.mock('../contexts/TableConfig/columns/selectors', () => ({
  useGetColumns: useGetColumnsMock,
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableCrud: useGetTableCrudMock,
  useGetTableDeleteActionPath: useGetTableDeleteActionPathMock,
  useGetTableIsRounded: useGetTableIsRoundedMock,
  useGetTableThreshold: useGetTableThresholdMock,
  useGetTableTitleSingular: useGetTableTitleSingularMock,
}));

vi.mock('../contexts/TableData/data/actions', () => ({
  useFetchMoreData: useFetchMoreDataMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableHasMore: useGetTableHasMoreMock,
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

vi.mock('../hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hooks')>()),
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

type ReadClosestElementArgs = {
  readonly selector: string;
  readonly testId: string;
};

const readClosestElement = ({ selector, testId }: ReadClosestElementArgs) => {
  const node = screen.getByTestId(testId).closest(selector);
  expect(node).toBeInstanceOf(HTMLElement);
  if (!(node instanceof HTMLElement)) {
    throw new TypeError('Expected container to be an HTMLElement');
  }
  return node;
};

const mockElementScrollTo = (element: HTMLElement) => {
  const scrollToMock = vi.fn();
  Object.defineProperty(element, 'scrollTo', {
    configurable: true,
    value: scrollToMock,
    writable: true,
  });
  return scrollToMock;
};

describe('TableContent', () => {
  beforeEach(() => {
    useGetTableThresholdMock.mockReturnValue(200);
    useGetTableTitleSingularMock.mockReturnValue('Order');
    useGetTableHasMoreMock.mockReturnValue(true);
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    useGetTableIsRoundedMock.mockReturnValue(false);
  });

  afterEach(cleanup);

  it('locks scrolling during the initial loading state', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);

    render(<TableContent />);

    const scrollContainer = readClosestElement({
      selector: '[data-scroll-locked]',
      testId: 'table-body',
    });

    expect(scrollContainer.dataset.scrollLocked).toBe('true');
    expect(screen.getByTestId('table-header')).toBeTruthy();
    expect(screen.getByTestId('table-body')).toBeTruthy();
  });

  it('keeps scrolling enabled when idle', () => {
    render(<TableContent />);

    expect(
      readClosestElement({
        selector: '[data-scroll-locked]',
        testId: 'table-body',
      }).dataset.scrollLocked,
    ).toBe('false');
  });

  it('renders square corners by default', () => {
    render(<TableContent />);

    expect(
      readClosestElement({
        selector: '[data-rounded]',
        testId: 'table-body',
      }).dataset.rounded,
    ).toBe('false');
  });

  it('rounds the table card when isRounded is enabled', () => {
    useGetTableIsRoundedMock.mockReturnValue(true);

    render(<TableContent />);

    const outerContainer = readClosestElement({
      selector: '[data-rounded]',
      testId: 'table-body',
    });

    expect(outerContainer.dataset.rounded).toBe('true');
    expect(
      screen.getByTestId('table-body').closest('[data-scroll-locked]'),
    ).not.toBe(outerContainer);
  });

  it('scrolls to top when query loading completes', () => {
    let isLoadingState = true;
    useGetTableIsLoadingMock.mockImplementation(() => isLoadingState);

    const { rerender } = render(<TableContent />);
    const scrollToMock = mockElementScrollTo(
      readClosestElement({
        selector: '[data-scroll-locked]',
        testId: 'table-body',
      }),
    );

    isLoadingState = false;
    rerender(<TableContent />);

    expect(scrollToMock).toHaveBeenCalledWith({
      behavior: 'auto',
      left: 0,
      top: 0,
    });
  });

  it('does not scroll to top during load-more transitions', () => {
    let isLoadingMoreState = false;
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockImplementation(() => isLoadingMoreState);

    const { rerender } = render(<TableContent />);
    const scrollToMock = mockElementScrollTo(
      readClosestElement({
        selector: '[data-scroll-locked]',
        testId: 'table-body',
      }),
    );

    isLoadingMoreState = true;
    rerender(<TableContent />);
    isLoadingMoreState = false;
    rerender(<TableContent />);

    expect(scrollToMock).not.toHaveBeenCalled();
  });
});
