import * as stylex from '@stylexjs/stylex';

import { FilterIcon } from '#ui/components/Icons/FilterIcon';
import {
  useGetHasColumnFilter,
  useGetNormalizedColumn,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableLocale } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_GROUP_FILTERED_AGGREGATE_LABEL,
  TABLE_GROUP_NO_AGGREGATE_GLYPH,
  TABLE_GROUP_NO_AGGREGATE_LABEL,
} from '#ui/components/Table/Table.constants';
import { renderCellContent } from '#ui/components/Table/TableBodyCell/utils/renderCellContent.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupAggregateProps } from './TableGroupAggregate.types';

import { tableGroupAggregateStyles } from './TableGroupAggregate.stylex';
import { TableGroupShare } from './TableGroupShare';
import { resolveAggregateDataType } from './utils/resolveAggregateDataType.util';

export const TableGroupAggregate = ({
  columnKey,
  summary,
}: TableGroupAggregateProps) => {
  // Compare tokens, never parse the key: a consumer key may contain the separator.
  const aggregate = summary.aggregates.find(
    (entry) => toTableAggregateToken(entry) === columnKey,
  );
  const column = useGetNormalizedColumn<Record<string, unknown>>(columnKey);
  const hasColumnFilter = useGetHasColumnFilter(
    aggregate?.columnKey ?? columnKey,
  );
  const locale = useGetTableLocale();

  if (aggregate === undefined) {
    return (
      <span
        {...stylex.props(tableGroupAggregateStyles.absent)}
        data-testid='table-group-aggregate-absent'
      >
        <span aria-hidden='true'>{TABLE_GROUP_NO_AGGREGATE_GLYPH}</span>
        <span {...stylex.props(accessibility.visuallyHidden)}>
          {TABLE_GROUP_NO_AGGREGATE_LABEL}
        </span>
      </span>
    );
  }

  return (
    <span {...stylex.props(tableGroupAggregateStyles.container)}>
      <span {...stylex.props(tableGroupAggregateStyles.measure)}>
        <span {...stylex.props(tableGroupAggregateStyles.value)}>
          {renderCellContent({
            // The derived column already carries the type an aggregate answers
            // in. The fallback is for a lookup that missed, and resolves from
            // the function alone so a `count` stays a tally rather than
            // inheriting a column type it never had.
            dataType:
              column?.dataType ??
              resolveAggregateDataType({
                columnDataType: undefined,
                fn: aggregate.fn,
              }),
            format: column?.format,
            label: column?.label,
            locale,
            value: aggregate.value,
          })}
        </span>
        <TableGroupShare
          columnKey={aggregate.columnKey}
          fn={aggregate.fn}
          value={aggregate.value}
        />
      </span>
      {hasColumnFilter && (
        <span
          {...stylex.props(tableGroupAggregateStyles.filterIndicator)}
          data-testid='table-group-aggregate-filtered'
          title={TABLE_GROUP_FILTERED_AGGREGATE_LABEL}
        >
          <FilterIcon size={12} />
          <span {...stylex.props(accessibility.visuallyHidden)}>
            {TABLE_GROUP_FILTERED_AGGREGATE_LABEL}
          </span>
        </span>
      )}
    </span>
  );
};
