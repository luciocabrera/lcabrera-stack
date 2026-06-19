import * as stylex from '@stylexjs/stylex';

import { TableDataProvider } from '@/components/Table/contexts/TableData';
import { TableBodyError } from '@/components/Table/TableBodyError';
import { styles as tableContentStyles } from '@/components/Table/TableContent/TableContent.stylex';
import { TableTitle } from '@/components/Table/TableTitle';

import type { TableDataErrorFallbackProps } from './TableDataErrorFallback.types';

import { styles } from './TableDataErrorFallback.stylex';

export const TableDataErrorFallback = ({
  error,
  onRetry,
}: TableDataErrorFallbackProps) => (
  <TableDataProvider dataState={{ data: [], isLoading: false, totalRows: 0 }}>
    <div {...stylex.props(tableContentStyles.wrapper)}>
      <div {...stylex.props(tableContentStyles.outerContainer)}>
        <TableTitle />
        <div {...stylex.props(styles.surface)}>
          <div {...stylex.props(styles.panelArea)}>
            <TableBodyError error={error} onRetry={onRetry} />
          </div>
        </div>
      </div>
    </div>
  </TableDataProvider>
);
