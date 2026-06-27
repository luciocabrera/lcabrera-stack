import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { FilterInputs } from '@/components/Table/filters/FilterInputs';
import { LIST_MAX_HEIGHT } from '@/components/VirtualList/VirtualList.constants';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { HandleToggleArgs } from '../ActiveFiltersList.types';
import type { FilterItemProps } from './FilterItem.types';

import { isFilterValid } from '../../isFilterValid.util';
import { styles } from './FilterItem.stylex';

export const FilterItem = ({
  column,
  columnKey,
  expandedFilters,
  filter,
  isBusy,
  onRemove,
  onToggle,
  onToggleExpanded,
}: FilterItemProps) => {
  const isExpanded = expandedFilters.has(columnKey);
  const isValid = isFilterValid(filter);
  const handleRemove = () => {
    onRemove(columnKey);
  };
  const handleToggleExpanded = () => {
    onToggleExpanded(columnKey);
  };
  const handleFilterChange = (newFilter: HandleToggleArgs['filter']) => {
    onToggle({ columnKey, filter: newFilter });
  };
  return (
    <div
      {...stylex.props(styles.filterItem)}
      data-testid={`filter-item-${columnKey}`}
    >
      {isBusy && (
        <div {...stylex.props(styles.busyOverlay)}>
          <div {...stylex.props(styles.busyWave)} />
        </div>
      )}
      <div {...stylex.props(styles.filterItemHeader)}>
        <button
          {...stylex.props(styles.filterToggle)}
          disabled={isBusy}
          onClick={handleToggleExpanded}
          type='button'
        >
          <span {...stylex.props(styles.filterToggleIcon)}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span {...stylex.props(styles.filterItemLabel)}>
            {column.label}
            {!isValid && (
              <span {...stylex.props(styles.invalidBadge)}> ⚠️ Invalid</span>
            )}
          </span>
        </button>
        <Button
          aria-label={`Remove ${column.label} filter`}
          color='ghost'
          icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
          isBusy={isBusy}
          onClick={handleRemove}
          size='mini'
          tooltipContent={`Remove ${column.label} filter`}
          width='auto'
        />
      </div>
      {isExpanded && (
        <div {...stylex.props(styles.filterItemContent)}>
          <FilterInputs
            columnKey={columnKey}
            filter={filter}
            listMaxHeight={LIST_MAX_HEIGHT}
            onChange={handleFilterChange}
          />
        </div>
      )}
    </div>
  );
};
