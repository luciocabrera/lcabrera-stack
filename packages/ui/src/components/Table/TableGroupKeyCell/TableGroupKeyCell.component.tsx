import * as stylex from '@stylexjs/stylex';

import { TableGroupDisclosure } from '#ui/components/Table/TableGroupDisclosure';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupKeyCellProps } from './TableGroupKeyCell.types';

import { tableGroupKeyCellStyles } from './TableGroupKeyCell.stylex';
import { resolveGroupKeyCellText } from './utils/resolveGroupKeyCellText.util';

/**
 * A group row's cell content in one of its **own** key columns: that key's
 * value, under that key's header (ADR-080).
 *
 * There is no indentation here and no synthetic column to indent inside.
 * Depth is read from which key columns are filled, which is the one reading
 * that serves a rollup's tree and a cube's lattice alike — `path.length - 1`
 * is not a depth when a grouping set is an arbitrary subset.
 *
 * Everything is on **one line**, and that is a constraint rather than a style
 * choice: `TableRow` clamps `minHeight`/`maxHeight` to the store's `rowHeight`,
 * so a value allowed to wrap is not a taller row — it is a silently clipped
 * one, and `<tbody>`'s declared height stops matching what is painted
 * (ADR-065). The text ellipsizes instead, which is a truncation the reader can
 * see.
 *
 * **A carried level renders blank but is still announced.** An ancestor that
 * repeats the row above is not restated visually — that is the noise the
 * retired hierarchy column's indentation avoided — but an empty cell announces
 * as empty, so an ancestor that is only implied would be announced nowhere. The
 * value goes in visually-hidden text, which is what keeps the row a complete
 * sentence to a screen reader while staying quiet on screen.
 *
 * The disclosure chevron leads the row's **innermost** filled level and is the
 * row's only pointer path to expansion — see `TableGroupDisclosure` for why it
 * is not a button. The innermost level is never carried, so the chevron always
 * has a drawn cell to sit in.
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

  return (
    <span
      {...stylex.props(tableGroupKeyCellStyles.container)}
      data-testid='table-group-key-cell'
    >
      {Boolean(isInnermost) && (
        <TableGroupDisclosure disclosure={disclosure} path={summary.path} />
      )}
      <span
        {...stylex.props(
          tableGroupKeyCellStyles.text,
          summary.isSubtotal && tableGroupKeyCellStyles.subtotalText,
        )}
        title={text}
      >
        {text}
      </span>
    </span>
  );
};
