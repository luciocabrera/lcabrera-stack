import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { useGetNormalizedColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { FilterItemHeaderProps } from './FilterItemHeader.types';

import { useGetColumnFilters } from '../../../../TableDrawerContext/selectors';
import { isFilterValid } from '../../../utils/isFilterValid.util';
import { styles } from '../FilterItem.stylex';
import { useRemoveFilterItem } from '../useRemoveFilterItem.hook';

/**
 * Header row of one active filter: the expand/collapse toggle with the
 * column label and validity badge, plus the remove button. Owns its store
 * wiring: reads the row's filter, column label, and persisted expanded
 * state itself.
 */
export const FilterItemHeader = ({
  columnKey,
  isBusy,
}: FilterItemHeaderProps) => {
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();
  const expandedFilters = useGetTableSettingsExpandedFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();
  const removeFilterItem = useRemoveFilterItem();

  const label = normalizedColumns[columnKey]?.label ?? columnKey;
  const isExpanded = expandedFilters.includes(columnKey);
  const isValid = isFilterValid(filters[columnKey]);

  const handleToggleExpanded = () => {
    setExpandedFilters(
      isExpanded
        ? expandedFilters.filter((key) => key !== columnKey)
        : [...expandedFilters, columnKey],
    );
  };

  const handleRemove = () => {
    removeFilterItem(columnKey);
  };

  return (
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
          {label}
          {!isValid && (
            <span {...stylex.props(styles.invalidBadge)}> ⚠️ Invalid</span>
          )}
        </span>
      </button>
      <Button
        aria-label={`Remove ${label} filter`}
        icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
        isBusy={isBusy}
        onClick={handleRemove}
        size='mini'
        tooltipContent={`Remove ${label} filter`}
        variant='ghost'
      />
    </div>
  );
};
