import * as stylex from '@stylexjs/stylex';

import { useTableGroupTree } from '#ui/components/Table/hooks';
import { TableBodyRows } from '#ui/components/Table/TableBodyRows';
import { TableEmptyState } from '#ui/components/Table/TableEmptyState';

import { useGetTableIsLoading } from '../contexts/TableData/data/selectors';
import { styles } from './TableStaticBody.stylex';

export const TableStaticBody = () => {
  const isLoadingState = useGetTableIsLoading();
  const { rows } = useTableGroupTree();

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body)}>
      {!isLoadingState && rows.length === 0 ? (
        <TableEmptyState />
      ) : (
        <TableBodyRows
          endIndex={rows.length}
          isLoadingState={isLoadingState}
          startIndex={0}
        />
      )}
    </tbody>
  );
};
