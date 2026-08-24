import * as stylex from '@stylexjs/stylex';

import { TableGroupDisclosure } from '#ui/components/Table/TableGroupDisclosure';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupKeyCellProps } from './TableGroupKeyCell.types';

import { tableGroupKeyCellStyles } from './TableGroupKeyCell.stylex';
import { TableGroupKeyLink } from './TableGroupKeyLink';
import { resolveGroupKeyCellDisclosure } from './utils/resolveGroupKeyCellDisclosure.util';
import { resolveGroupKeyCellText } from './utils/resolveGroupKeyCellText.util';

/**
 * One line: wrapping is silently clipped against `rowHeight` (ADR-065).
 * Every drawn key cell reserves the chevron box, filled or not (ADR-080).
 */
export const TableGroupKeyCell = ({
  columnKey,
  disclosure,
  groupingKeys,
  isCarried,
  summary,
}: TableGroupKeyCellProps) => {
  const resolved = resolveGroupKeyCellText({
    columnKey,
    groupingKeys,
    summary,
  });

  if (resolved === undefined) return;

  const { isInnermost, text } = resolved;

  if (isCarried)
    return (
      <span
        {...stylex.props(accessibility.visuallyHidden)}
        data-testid='table-group-key-carried'
      >
        {text}
      </span>
    );

  const control = resolveGroupKeyCellDisclosure({ columnKey, disclosure });

  return (
    <span
      {...stylex.props(tableGroupKeyCellStyles.container)}
      data-testid='table-group-key-cell'
    >
      <TableGroupDisclosure
        disclosure={control?.disclosure}
        path={control?.path ?? summary.path}
      />
      <span
        {...stylex.props(
          tableGroupKeyCellStyles.text,
          summary.isSubtotal && tableGroupKeyCellStyles.subtotalText,
        )}
        title={text}
      >
        {isInnermost ? (
          <TableGroupKeyLink
            groupingKeys={groupingKeys}
            summary={summary}
            text={text}
          />
        ) : (
          text
        )}
      </span>
    </span>
  );
};
