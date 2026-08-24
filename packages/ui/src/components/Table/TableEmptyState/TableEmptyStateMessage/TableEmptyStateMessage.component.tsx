import * as stylex from '@stylexjs/stylex';

import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableTitleSingular } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useGetTableDataError } from '#ui/components/Table/contexts/TableData/data/selectors';
import { toTableEmptyStateNotice } from '#ui/components/Table/TableEmptyState/utils/toTableEmptyStateNotice.util';

import { styles } from './TableEmptyStateMessage.stylex';

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
