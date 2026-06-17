import * as stylex from '@stylexjs/stylex';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

import type { ListFilterMode, VirtualListProps } from './VirtualList.types';

import { LIST_MAX_HEIGHT } from './VirtualList.constants';
import { VirtualListBody } from './VirtualListBody';
import { VirtualListHeader } from './VirtualListHeader';
import { styles } from './VirtualList.stylex';
import { VirtualListFooter } from './VirtualListFooter';

export const VirtualList = ({
  dataState,
  filter,
  hasCheckboxes = true,
  hasSelectAll = true,
  listMaxHeight = LIST_MAX_HEIGHT,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight = false,
}: VirtualListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilterMode, setListFilterMode] = useState<ListFilterMode>('all');

  const { data } = dataState;

  // Derive selectedValues from filter prop - fully controlled by parent
  const selectedValues = filter?.values ?? [];

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualListHeader
        name={name}
        onClearSearch={handleClearSearch}
        onSearchChange={handleSearchChange}
        searchTerm={searchTerm}
      />
      <VirtualListBody
        dataState={dataState}
        hasCheckboxes={hasCheckboxes}
        hasSelectAll={hasSelectAll}
        listFilterMode={listFilterMode}
        listMaxHeight={listMaxHeight}
        onChange={onChange}
        onFetchInitial={onFetchInitial}
        onFetchMore={onFetchMore}
        searchTerm={searchTerm}
        selectedValues={selectedValues}
        shouldFillHeight={shouldFillHeight}
      />
      <VirtualListFooter
        dataState={dataState}
        effectiveOptions={data}
        hasCheckboxes={hasCheckboxes}
        listFilterMode={listFilterMode}
        selectedValues={selectedValues}
        setListFilterMode={setListFilterMode}
      />
    </div>
  );
};
