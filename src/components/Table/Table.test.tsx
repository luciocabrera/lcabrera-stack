// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Table } from './Table.component';

type MockTableContentProps = {
  readonly onLoadMore?: unknown;
};

type MockTableDataProviderProps = {
  readonly children: ReactNode;
  readonly dataState: {
    readonly data: readonly Record<string, unknown>[];
    readonly isLoading: boolean;
    readonly totalRows: number;
  };
};

const useRenderTrackerMock = vi.fn();

const MockTableDataProvider = ({
  children,
  dataState,
}: MockTableDataProviderProps) => (
  <div data-state={JSON.stringify(dataState)} data-testid='provider'>
    {children}
  </div>
);

const MockTableContent = ({ onLoadMore }: MockTableContentProps) => (
  <div data-has-load-more={String(Boolean(onLoadMore))} data-testid='content' />
);

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('./contexts', () => ({
  TableDataProvider: MockTableDataProvider,
}));

vi.mock('./TableContent', () => ({
  TableContent: MockTableContent,
}));

describe('Table', () => {
  it('maps response into provider state using selectors', () => {
    type Response = {
      readonly rows: { readonly id: number }[];
      readonly total: number;
    };

    render(
      <Table
        dataSelector={(response: Response) => [...response.rows]}
        dataTotalSelector={(response: Response) => response.total}
        isLoading
        response={{ rows: [{ id: 1 }], total: 999 }}
      />,
    );

    const provider = screen.getByTestId('provider');
    const state = JSON.parse(provider.dataset.state ?? '{}') as {
      data: readonly { id: number }[];
      isLoading: boolean;
      totalRows: number;
    };

    expect(state.data).toEqual([{ id: 1 }]);
    expect(state.isLoading).toBe(true);
    expect(state.totalRows).toBe(999);
    expect(screen.getByTestId('content').dataset.hasLoadMore).toBe('false');
  });

  it('renders without wrapper when flex wrapper is disabled', () => {
    type Response = {
      readonly rows: { readonly id: number }[];
    };

    const { container } = render(
      <Table
        dataSelector={(response: Response) => [...response.rows]}
        isFlexWrapperEnabled={false}
        response={{ rows: [{ id: 1 }] }}
      />,
    );

    const root = container.firstElementChild as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(root?.dataset.testid).toBe('provider');
  });
});
