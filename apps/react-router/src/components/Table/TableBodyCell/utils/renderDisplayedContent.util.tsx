import type { ReactNode } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TableColumnDataType } from '@/components/Table/Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type RenderDisplayedContentArgs = {
  readonly content: ReactNode;
  readonly dataType: TableColumnDataType;
  readonly hasCustomContent: boolean;
};

export const renderDisplayedContent = ({
  content,
  dataType,
  hasCustomContent,
}: RenderDisplayedContentArgs) => {
  if (hasCustomContent) {
    return content;
  }

  return (
    <span
      title={typeof content === 'string' ? content : undefined}
      {...stylex.props(
        tableBodyCellStyles.textContent,
        dataType === 'boolean' && tableBodyCellStyles.booleanContent,
      )}
    >
      {content}
    </span>
  );
};
