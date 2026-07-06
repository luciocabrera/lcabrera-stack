import type { VirtualListDataState } from '@repo/ui/components/VirtualList';

import { VirtualSelect } from '@repo/ui/components/VirtualSelect';
import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';

import {
  FETCH_DELAY_MS,
  FETCH_PAGE_SIZE,
  LARGE_DATASET,
  STATIC_FRUITS,
} from '../showcaseData.util';
import { ShowcaseSection } from '../ShowcaseSection';
import { ShowcaseSubsection } from '../ShowcaseSubsection';
import { styles } from './VirtualSelectSection.stylex';

export const VirtualSelectSection = () => {
  const [singleSelected, setSingleSelected] = useState<string[]>([]);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [alwaysOpenSelected, setAlwaysOpenSelected] = useState<string[]>([]);
  const [fetchSelected, setFetchSelected] = useState<string[]>([]);
  const [fetchDataState, setFetchDataState] = useState<VirtualListDataState>({
    data: [],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    totalCount: LARGE_DATASET.length,
  });

  const fetchedCountRef = useRef(0);

  const handleFetchInitial = () => {
    setFetchDataState({
      data: [],
      hasMore: true,
      isLoading: true,
      isLoadingMore: false,
      totalCount: LARGE_DATASET.length,
    });
    fetchedCountRef.current = 0;

    setTimeout(() => {
      const page = LARGE_DATASET.slice(0, FETCH_PAGE_SIZE);
      fetchedCountRef.current = FETCH_PAGE_SIZE;
      setFetchDataState({
        data: page,
        hasMore: FETCH_PAGE_SIZE < LARGE_DATASET.length,
        isLoading: false,
        isLoadingMore: false,
        totalCount: LARGE_DATASET.length,
      });
    }, FETCH_DELAY_MS);
  };

  const handleFetchMore = () => {
    setFetchDataState((prev) => ({ ...prev, isLoadingMore: true }));

    setTimeout(() => {
      const nextCount = fetchedCountRef.current + FETCH_PAGE_SIZE;
      const nextPage = LARGE_DATASET.slice(0, nextCount);
      fetchedCountRef.current = nextCount;
      setFetchDataState({
        data: nextPage,
        hasMore: nextCount < LARGE_DATASET.length,
        isLoading: false,
        isLoadingMore: false,
        totalCount: LARGE_DATASET.length,
      });
    }, FETCH_DELAY_MS);
  };

  return (
    <ShowcaseSection title='VirtualSelect'>
      <ShowcaseSubsection title='Single Select (static options)'>
        <div {...stylex.props(styles.selectWrapper)}>
          <VirtualSelect
            mode='single'
            onChange={setSingleSelected}
            options={STATIC_FRUITS}
            placeholder='Pick a fruit...'
            selected={singleSelected}
          />
        </div>
        <p {...stylex.props(styles.resultText)}>
          Selected:{' '}
          {singleSelected.length > 0 ? singleSelected.join(', ') : '(none)'}
        </p>
      </ShowcaseSubsection>

      <ShowcaseSubsection title='Multi Select (static options)'>
        <div {...stylex.props(styles.selectWrapper)}>
          <VirtualSelect
            mode='multi'
            onChange={setMultiSelected}
            options={STATIC_FRUITS}
            placeholder='Pick fruits...'
            selected={multiSelected}
          />
        </div>
        <p {...stylex.props(styles.resultText)}>
          Selected:{' '}
          {multiSelected.length > 0 ? multiSelected.join(', ') : '(none)'}
        </p>
      </ShowcaseSubsection>

      <ShowcaseSubsection
        title={`Fetch Mode (5,000 items, paginated ${FETCH_PAGE_SIZE} at a time)`}
      >
        <div {...stylex.props(styles.selectWrapper)}>
          <VirtualSelect
            dataState={fetchDataState}
            mode='multi'
            onChange={setFetchSelected}
            onFetchInitial={handleFetchInitial}
            onFetchMore={handleFetchMore}
            placeholder='Search cities...'
            selected={fetchSelected}
            shouldShowLoadedCount
          />
        </div>
        <p {...stylex.props(styles.resultTextCompact)}>
          Selected:{' '}
          {fetchSelected.length > 0 ? fetchSelected.join(', ') : '(none)'}
        </p>
      </ShowcaseSubsection>

      <ShowcaseSubsection title='Always Open (isAlwaysOpen)'>
        <div {...stylex.props(styles.selectWrapper)}>
          <VirtualSelect
            isAlwaysOpen
            mode='multi'
            onChange={setAlwaysOpenSelected}
            options={STATIC_FRUITS}
            placeholder='Pick fruits...'
            selected={alwaysOpenSelected}
          />
        </div>
        <p {...stylex.props(styles.resultText)}>
          Selected:{' '}
          {alwaysOpenSelected.length > 0
            ? alwaysOpenSelected.join(', ')
            : '(none)'}
        </p>
      </ShowcaseSubsection>
    </ShowcaseSection>
  );
};
