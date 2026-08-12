import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { FilterItemProps } from './FilterItem.types';

import { useGetColumnFilters } from '../../../TableDrawerContext/selectors';
import { styles } from './FilterItem.stylex';
import { FilterItemContent } from './FilterItemContent/FilterItemContent.component';
import { FilterItemHeader } from './FilterItemHeader/FilterItemHeader.component';

/**
 * One active-filter row; a thin shell composing the self-connected header
 * (toggle/label/remove) and, while expanded, the self-connected inputs body.
 * Reads only what gates rendering: the row's column and filter must still
 * exist, and the persisted expansion decides whether the body mounts.
 */
export const FilterItem = ({ columnKey, isBusy }: FilterItemProps) => {
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();
  const expandedFilters = useGetTableSettingsExpandedFilters();

  if (
    !Object.hasOwn(normalizedColumns, columnKey) ||
    !Object.hasOwn(filters, columnKey)
  ) {
    return;
  }

  const isExpanded = expandedFilters.includes(columnKey);

  return (
    <div
      {...stylex.props(styles.filterItem)}
      data-testid={`filter-item-${columnKey}`}
    >
      {Boolean(isBusy) && (
        <div {...stylex.props(styles.busyOverlay)}>
          <div {...stylex.props(styles.busyWave)} />
        </div>
      )}
      <FilterItemHeader columnKey={columnKey} isBusy={isBusy} />
      {isExpanded && <FilterItemContent columnKey={columnKey} />}
    </div>
  );
};
