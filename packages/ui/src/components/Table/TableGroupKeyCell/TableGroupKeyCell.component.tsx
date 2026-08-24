import * as stylex from '@stylexjs/stylex';

import { TableGroupDisclosure } from '#ui/components/Table/TableGroupDisclosure';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupKeyCellProps } from './TableGroupKeyCell.types';

import { tableGroupKeyCellStyles } from './TableGroupKeyCell.stylex';
import { TableGroupKeyLink } from './TableGroupKeyLink';
import { resolveGroupKeyCellDisclosure } from './utils/resolveGroupKeyCellDisclosure.util';
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
 * **Only the row's own innermost level links to the group's rows.** Every
 * filled key cell describes the same group, so linking each one would put two
 * or three identical links on a row and leave no cell that means "this group"
 * rather than "one of its ancestors". The innermost key is the level the row
 * *is*, which is the one a reader clicks to see inside it.
 *
 * **A fold control leads the level it folds, in that level's own column**
 * (#802). A row states its ancestors and does not own them, so those are the
 * levels it can fold — and its own innermost level, being the row itself, folds
 * nothing: `resolveGroupKeyCellDisclosure` answers `undefined` there and
 * `TableGroupDisclosure` draws the spacer, which is the box the link above sits
 * beside. See `TableGroupDisclosure` for why the control is not a button.
 *
 * **Every drawn key cell reserves the chevron's box, filled or not.** Only some
 * rows of a key column offer a control — a subtotal does not fold the level it
 * totals while that level is open — and without the reserved space those rows'
 * labels would sit a chevron's width off from their siblings' in the same
 * column.
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
