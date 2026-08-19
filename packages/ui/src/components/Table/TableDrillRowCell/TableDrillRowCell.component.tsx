import * as stylex from '@stylexjs/stylex';
import { Link, useLocation } from 'react-router';

import { ErrorIcon } from '#ui/components/Icons';
import {
  useGetColumnFilters,
  useGetColumns,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  TABLE_DRILL_FAILED_LABEL,
  TABLE_DRILL_LOADING_LABEL,
} from '#ui/components/Table/Table.constants';

import type { TableDrillRowCellProps } from './TableDrillRowCell.types';

import { tableDrillRowCellStyles } from './TableDrillRowCell.stylex';
import { resolveDrillHandoffSearch } from './utils/resolveDrillHandoffSearch.util';
import { resolveDrillShortfallText } from './utils/resolveDrillShortfallText.util';

/**
 * What a grid-created drill row holds: the state of the fetch, or the way out
 * of it (ADR-079).
 *
 * These rows are **rows**, not an overlay, because `<tbody>` is sized from
 * `rows.length × rowHeight` — anything occupying vertical space has to be in
 * that array or the declared height stops matching what is painted (ADR-065).
 * The content sits in one cell and every other cell of the row is empty, so the
 * row's `gridcell` count matches every other row's and the focus model needs no
 * case for it (ADR-062).
 *
 * **The hand-off is a link and is not a tab stop.** ADR-062 gives the grid a
 * roving tab stop addressed by row key plus column key: exactly one element in
 * the whole grid is tabbable at a time, so a tabbable anchor here would insert a
 * second one inside a cell that already owns it — the same reason
 * `TableGroupDisclosure` is not a button. Unlike the chevron it stays **in** the
 * accessibility tree rather than being `aria-hidden`, because no row-level
 * attribute states it the way `aria-expanded` states expansion; a reader has to
 * be told it exists. Its keyboard path is `Enter` on the focused cell, handled
 * by the grid's own key map.
 *
 * **It wires its own filters and columns rather than taking them as props.** The
 * hand-off's URL is a question about the whole table's state, and a parent that
 * passed it down would have to compute one per drill row in the window — see the
 * thin-shell rule in `PATTERNS.md`.
 */
export const TableDrillRowCell = ({ marker }: TableDrillRowCellProps) => {
  const columns = useGetColumns();
  const columnFilters = useGetColumnFilters();
  const { search } = useLocation();

  if (marker.kind === 'loading') {
    return (
      <span
        {...stylex.props(
          tableDrillRowCellStyles.container,
          tableDrillRowCellStyles.muted,
        )}
        data-testid='table-drill-loading'
      >
        <span {...stylex.props(tableDrillRowCellStyles.text)}>
          {TABLE_DRILL_LOADING_LABEL}
        </span>
      </span>
    );
  }

  if (marker.kind === 'failed') {
    return (
      <span
        {...stylex.props(
          tableDrillRowCellStyles.container,
          tableDrillRowCellStyles.failed,
        )}
        data-testid='table-drill-failed'
      >
        <ErrorIcon size={14} />
        <span
          {...stylex.props(tableDrillRowCellStyles.text)}
          title={TABLE_DRILL_FAILED_LABEL}
        >
          {TABLE_DRILL_FAILED_LABEL}
        </span>
      </span>
    );
  }

  const { linked, plain } = resolveDrillShortfallText(marker.shortfall);
  const to = resolveDrillHandoffSearch({
    columnFilters,
    columns,
    path: marker.path,
    search,
  });

  // No link where a key cannot be expressed as a filter: navigating anyway
  // would open a table showing the wrong rows under the right heading. The
  // shortfall is still stated, because it is true either way.
  if (to === undefined) {
    return (
      <span
        {...stylex.props(
          tableDrillRowCellStyles.container,
          tableDrillRowCellStyles.muted,
        )}
        data-testid='table-drill-handoff-unavailable'
      >
        <span {...stylex.props(tableDrillRowCellStyles.text)}>{plain}</span>
      </span>
    );
  }

  return (
    <span
      {...stylex.props(tableDrillRowCellStyles.container)}
      data-testid='table-drill-handoff'
    >
      <Link
        {...stylex.props(
          tableDrillRowCellStyles.link,
          tableDrillRowCellStyles.text,
        )}
        aria-label={linked}
        tabIndex={-1}
        to={to}
      >
        {plain}
      </Link>
    </span>
  );
};
