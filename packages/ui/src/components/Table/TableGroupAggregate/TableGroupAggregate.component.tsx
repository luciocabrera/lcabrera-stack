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

/**
 * A group row's cell content in every column but a group-key one: **the single
 * measure that column is**, or a dash saying the column carries none.
 *
 * **One cell, one measure** (#869). A column carrying several aggregates used
 * to render all of them here, side by side in the source column's one cell —
 * two truncated numbers under a header that named neither, sortable and
 * resizable neither separately nor at all. `withAggregateColumns` now replaces
 * a measured column with one derived column per aggregate, so this cell asks
 * which measure it *is* rather than which measures its column has.
 *
 * **The match is by token, never by parsing the key.** A derived column's key
 * is `toTableAggregateToken`'s spelling of the aggregate it carries, so
 * comparing tokens answers exactly. Reading the key apart instead would have to
 * guess where the column key ends, and a consumer's key may legitimately
 * contain the separator — the parser exists for the URL, where the surrounding
 * vocabulary is closed, and its ambiguity is real here where it is not.
 *
 * **The measure's own name is not repeated in the cell.** The header states it
 * now, once, under the source column's label — which is the whole point of
 * giving each measure a column of its own.
 *
 * **The dash is a rendered character with a spoken equivalent beside it.** A
 * standalone em dash may or may not be announced depending on the reader's
 * punctuation verbosity, so the state is carried by text rather than by the
 * glyph (ADR-065 leaves the cell's accessible equivalent to this slice). It is
 * reduced-opacity rather than blank because blank already means "this row has
 * no value here" — a claim about the data — and zero would state a number
 * nobody computed.
 *
 * **A filtered column's aggregate says so, and the filter belongs to the
 * source column.** A `WHERE` filter runs before aggregation, so a total over a
 * filtered column is a total over the rows that survived it — correct SQL, and
 * a label that lies by omission unless the cell states it. The indicator is
 * read for the aggregate's own column rather than for this cell's derived key,
 * which holds no filter and never could.
 *
 * **The value is formatted here, by the same call a data cell makes.** The
 * aggregate arrives raw and the derived column already carries the `dataType`
 * an aggregate answers in — `count` over a currency column is a tally, not
 * money — so a `sum` under a currency header renders as currency without the
 * grouped service knowing anything about presentation. Sharing
 * `renderCellContent` rather than reimplementing it is what keeps a group row's
 * number and the numbers beneath it in one format; two formatters drift the
 * first time either gains an option.
 */
export const TableGroupAggregate = ({
  columnKey,
  summary,
}: TableGroupAggregateProps) => {
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
