import * as stylex from '@stylexjs/stylex';
import {
  type InfiniteData,
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  startTransition,
  type UIEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { useLoaderData, useSearchParams } from 'react-router';

import type { WideAlltypes150Response } from '@/services';

import { wideAlltypes150Api } from '@/services';

import type { loader } from './wide-alltypes-150-tanstack.loader';
import type {
  ResolveNextPageParamArgs,
  WideAlltypes150TanStackTableContentProps,
} from './WideAlltypes150TanStack.types';

import {
  COLUMN_DEFINITIONS,
  ESTIMATED_ROW_HEIGHT,
  FETCH_SIZE,
  ROW_OVERSCAN,
  SCROLL_FETCH_THRESHOLD,
} from './WideAlltypes150TanStack.constants';
import {
  toTanStackSortingState,
  toWideAlltypes150ApiSorting,
  toWideAlltypes150SortSearchParam,
} from './wide-alltypes-150-tanstack.sorting.util';
import { styles } from './wide-alltypes-150-tanstack.stylex';

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  });

const getSortIndicator = (direction: 'asc' | 'desc' | false) => {
  if (direction === 'asc') {
    return '▲';
  }

  if (direction === 'desc') {
    return '▼';
  }

  return '↕';
};

const resolveNextPageParam = ({
  allPages,
  lastPage,
}: ResolveNextPageParamArgs): number | undefined => {
  const loadedRowCount = allPages.reduce(
    (accumulator, page) => accumulator + page.data.length,
    0,
  );

  if (loadedRowCount >= lastPage.total) {
    return undefined;
  }

  return loadedRowCount;
};

const WideAlltypes150TanStackTableContent = ({
  initialPage,
  initialSorting,
  initialSortParam,
}: WideAlltypes150TanStackTableContentProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>(() => initialSorting);
  const tableContainerReference = useRef<HTMLDivElement | null>(null);
  const apiSorting = toWideAlltypes150ApiSorting(sorting);
  const sortParam = toWideAlltypes150SortSearchParam(sorting) ?? '';
  const { data, error, fetchNextPage, isError, isFetching } = useInfiniteQuery<
    WideAlltypes150Response,
    Error,
    InfiniteData<WideAlltypes150Response, number>,
    readonly ['wide-alltypes-150-tanstack', string],
    number
  >({
    // eslint-disable-next-line local-rules/destructuring-for-functions
    getNextPageParam: (lastPage, allPages) =>
      resolveNextPageParam({ allPages, lastPage }),
    initialData:
      sortParam === initialSortParam
        ? {
            pageParams: [0],
            pages: [initialPage],
          }
        : undefined,
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) =>
      wideAlltypes150Api.fetchPaginated({
        limit: FETCH_SIZE,
        skip: pageParam,
        sorting: apiSorting,
      }),
    queryKey: ['wide-alltypes-150-tanstack', sortParam],
    refetchOnWindowFocus: false,
  });

  const flatData = data.pages.flatMap((page) => page.data);
  const totalRowCount = data.pages[0]?.total ?? 0;
  const table = useReactTable({
    columns: [...COLUMN_DEFINITIONS],
    data: flatData,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: {
      sorting,
    },
  });
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    getScrollElement: () => tableContainerReference.current,
    measureElement:
      typeof globalThis !== 'undefined' &&
      !globalThis.navigator.userAgent.includes('Firefox')
        ? (element) => element.getBoundingClientRect().height
        : undefined,
    overscan: ROW_OVERSCAN,
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === 'function' ? updater(sorting) : updater;
    const nextSearchParams = new URLSearchParams(searchParams);
    const nextSortParam = toWideAlltypes150SortSearchParam(nextSorting);

    if (nextSortParam) {
      nextSearchParams.set('sort', nextSortParam);
    } else {
      nextSearchParams.delete('sort');
    }

    startTransition(() => {
      setSorting(nextSorting);
      setSearchParams(nextSearchParams, { replace: true });
    });

    rowVirtualizer.scrollToIndex(0);
  };

  table.setOptions((previousOptions) => ({
    ...previousOptions,
    onSortingChange: handleSortingChange,
  }));

  const fetchMoreOnBottomReached = async (
    containerElement: HTMLDivElement | null,
  ): Promise<void> => {
    if (!containerElement || isFetching || flatData.length >= totalRowCount) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = containerElement;

    if (scrollHeight - scrollTop - clientHeight < SCROLL_FETCH_THRESHOLD) {
      await fetchNextPage();
    }
  };

  const fetchMoreOnBottomReachedEffect = useEffectEvent(
    (containerElement: HTMLDivElement | null): void => {
      void fetchMoreOnBottomReached(containerElement);
    },
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>): void => {
    void fetchMoreOnBottomReached(event.currentTarget);
  };

  useEffect(() => {
    fetchMoreOnBottomReachedEffect(tableContainerReference.current);
  }, [flatData.length, isFetching, totalRowCount]);

  if (isError) {
    throw error;
  }

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerCopy)}>
          <h1 {...stylex.props(styles.title)}>
            Wide All-Types 150 with TanStack Table
          </h1>
          <p {...stylex.props(styles.description)}>
            A sibling TanStack experiment for 150 PostgreSQL-backed columns,
            server-side sorting, infinite loading, and virtualized rows.
          </p>
        </div>
        <div {...stylex.props(styles.statusPill)}>
          {flatData.length} of {totalRowCount} rows loaded
        </div>
      </div>
      {import.meta.env.DEV ? (
        <p {...stylex.props(styles.devNotice)}>
          Virtualized table performance is reduced in development mode. The
          production build is the real benchmark.
        </p>
      ) : undefined}
      <div {...stylex.props(styles.tableSurface)}>
        <div
          {...stylex.props(styles.tableScroller)}
          onScroll={handleScroll}
          ref={tableContainerReference}
        >
          <table {...stylex.props(styles.table)}>
            <thead {...stylex.props(styles.tableHead)}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} {...stylex.props(styles.headerRow)}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    const sortedState = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        {...stylex.props(styles.headerCell)}
                        style={{ width: `${header.getSize()}px` }}
                      >
                        <button
                          {...stylex.props(
                            styles.headerButton,
                            isSortable && styles.headerButtonSortable,
                            sortedState && styles.headerButtonSorted,
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          type='button'
                        >
                          <span {...stylex.props(styles.headerLabel)}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          <span {...stylex.props(styles.sortIndicator)}>
                            {getSortIndicator(sortedState)}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              {...stylex.props(styles.tableBody)}
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];

                if (!row) {
                  return;
                }

                const visibleCells = row.getVisibleCells();

                return (
                  <tr
                    data-index={virtualRow.index}
                    key={row.id}
                    ref={rowVirtualizer.measureElement}
                    {...stylex.props(styles.bodyRow)}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {visibleCells.map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        {...stylex.props(
                          styles.bodyCell,
                          cellIndex === visibleCells.length - 1 &&
                            styles.bodyCellLast,
                        )}
                        style={{ width: `${cell.column.getSize()}px` }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div {...stylex.props(styles.footer)}>
          <span>
            Server-side sorting with route-local TanStack Query cache.
          </span>
          <span {...stylex.props(isFetching && styles.footerFetching)}>
            {isFetching ? 'Fetching more rows…' : 'Scroll to load more'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Route component for the TanStack-based wide-alltypes table page.
 */
export const WideAlltypes150TanStackPage = () => {
  const { initialPage, initialSortParam, sorting } =
    useLoaderData<typeof loader>();
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <WideAlltypes150TanStackTableContent
        initialPage={initialPage}
        initialSorting={toTanStackSortingState(sorting)}
        initialSortParam={initialSortParam}
      />
    </QueryClientProvider>
  );
};
