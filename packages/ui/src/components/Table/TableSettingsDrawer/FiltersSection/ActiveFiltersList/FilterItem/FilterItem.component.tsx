import { Button } from '@repo/ui/components/Button';
import { MenuCloseIcon } from '@repo/ui/components/Icons';
import { useSetTableSettingsExpandedFilters } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { FilterInputs } from '@repo/ui/components/Table/filters/FilterInputs';
import { LIST_MAX_HEIGHT } from '@repo/ui/components/VirtualList/VirtualList.constants';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { FilterItemProps } from './FilterItem.types';

import { useSetColumnFilters } from '../../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../../TableDrawerContext/selectors';
import { isFilterValid } from '../../utils/isFilterValid.util';
import { styles } from './FilterItem.stylex';

/**
 * One active-filter row: expand/collapse toggle, validity badge, remove
 * button, and the type-specific filter inputs. Owns its store wiring:
 * reads/writes the drawer filters and the persisted expanded-filters state
 * itself.
 */
export const FilterItem = ({
  column,
  columnKey,
  filter,
  isBusy,
}: FilterItemProps) => {
  const filters = useGetColumnFilters();
  const expandedFilters = useGetTableSettingsExpandedFilters();
  const setColumnFilters = useSetColumnFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();

  const isExpanded = expandedFilters.includes(columnKey);
  const isValid = isFilterValid(filter);

  const handleRemove = () => {
    const remainingFilters = Object.fromEntries(
      Object.entries(filters).filter(([key]) => key !== columnKey),
    );
    setColumnFilters(remainingFilters);
    setExpandedFilters(expandedFilters.filter((key) => key !== columnKey));
  };

  const handleToggleExpanded = () => {
    setExpandedFilters(
      isExpanded
        ? expandedFilters.filter((key) => key !== columnKey)
        : [...expandedFilters, columnKey],
    );
  };

  const handleFilterChange = (newFilter?: FilterItemProps['filter']) => {
    if (newFilter) {
      setColumnFilters({ ...filters, [columnKey]: newFilter });
      return;
    }

    handleRemove();
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
