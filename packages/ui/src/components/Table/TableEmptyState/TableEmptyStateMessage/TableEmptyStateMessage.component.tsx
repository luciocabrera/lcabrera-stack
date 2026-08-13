import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableTitleSingular } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useGetTableDataError } from '#ui/components/Table/contexts/TableData/data/selectors';
import { toTableEmptyStateNotice } from '#ui/components/Table/TableEmptyState/utils/toTableEmptyStateNotice.util';

import { styles } from './TableEmptyStateMessage.stylex';

/**
 * The heading and sentence inside the empty table body — "nothing matched", or
 * the refusal the endpoint returned instead of rows (#642).
 *
 * A self-connected delegate: it reads the read's outcome, the table's title and
 * the refused column's label itself, so the shell around it stays the sticky
 * sizing box it was and no parent drills a message through.
 *
 * The column lookup is unconditional because a hook has to be, and harmless:
 * with no refused column the key is the empty string, which no column is
 * declared under.
 */
export const TableEmptyStateMessage = () => {
  const error = useGetTableDataError();
  const titleSingular = useGetTableTitleSingular();

  const refusedColumnKey =
    error?.kind === 'grouping-refused' ? error.column : undefined;
  const refusedColumn = useGetNormalizedColumn<Record<string, unknown>>(
    refusedColumnKey ?? '',
  );

  const { message, title } = toTableEmptyStateNotice({
    // The header label is what the user picked the column by; the raw key is
    // the fallback for a refusal naming a column this table does not render.
    columnName: refusedColumn?.label ?? refusedColumnKey,
    error,
    titleSingular,
  });

  return (
    <>
      <h3 {...stylex.props(styles.title)}>{title}</h3>
      <p {...stylex.props(styles.message)}>{message}</p>
    </>
  );
};
