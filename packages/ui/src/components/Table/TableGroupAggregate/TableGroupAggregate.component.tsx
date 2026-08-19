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
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupAggregateProps } from './TableGroupAggregate.types';

import { TableGroupShare } from './TableGroupShare';
import { tableGroupAggregateStyles } from './TableGroupAggregate.stylex';
import { resolveAggregateDataType } from './utils/resolveAggregateDataType.util';

/**
 * A group row's cell content in every column but the hierarchy one: the
 * aggregate selected on that column, or a dash saying none was.
 *
 * **The dash is a rendered character with a spoken equivalent beside it.** A
 * standalone em dash may or may not be announced depending on the reader's
 * punctuation verbosity, so the state is carried by text rather than by the
 * glyph (ADR-065 leaves the cell's accessible equivalent to this slice). It is
 * reduced-opacity rather than blank because blank already means "this row has
 * no value here" — a claim about the data — and zero would state a number
 * nobody computed.
 *
 * **A filtered column's aggregate says so.** A `WHERE` filter on a column runs
 * before aggregation, so a total over a filtered column is a total over the
 * rows that survived the filter — correct SQL, and a label that lies by
 * omission unless the cell states it. The indicator is read from the columns
 * store here rather than passed in, so the cell that renders the number is the
 * one that answers for it.
 *
 * **The value is formatted here, by the same call a data cell makes.** The
 * aggregate arrives raw and this cell resolves its own column from the store,
 * so a `sum` under a currency header renders as currency and an `avg` honours
 * that column's fraction digits — without the grouped service knowing anything
 * about presentation. Sharing `renderCellContent` rather than reimplementing it
 * is what keeps a group row's number and the numbers beneath it in one format;
 * two formatters drift the first time either gains an option.
 */
export const TableGroupAggregate = ({
  columnKey,
  summary,
}: TableGroupAggregateProps) => {
  const hasColumnFilter = useGetHasColumnFilter(columnKey);
  const column = useGetNormalizedColumn<Record<string, unknown>>(columnKey);
  const locale = useGetTableLocale();
  const aggregate = summary.aggregates.find(
    (entry) => entry.columnKey === columnKey,
  );

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
      <span {...stylex.props(tableGroupAggregateStyles.value)}>
        {renderCellContent({
          dataType: resolveAggregateDataType({
            columnDataType: column?.dataType,
            fn: aggregate.fn,
          }),
          format: column?.format,
          label: column?.label,
          locale,
          value: aggregate.value,
        })}
      </span>
      <TableGroupShare columnKey={columnKey} value={aggregate.value} />
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
