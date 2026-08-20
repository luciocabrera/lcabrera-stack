import * as stylex from '@stylexjs/stylex';

import { useGetTableLocale } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_SHARE_OF_TOTAL_LABEL,
  TABLE_SHARE_UNAVAILABLE_GLYPH,
  TABLE_SHARE_UNAVAILABLE_LABEL,
} from '#ui/components/Table/Table.constants';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { TableGroupShareValueProps } from './TableGroupShareValue.types';

import { useGetTableShareDenominator } from '../../utils/useGetTableShareDenominator.hook';
import { tableGroupShareStyles } from '../TableGroupShare.stylex';
import { formatSharePercent } from '../utils/formatSharePercent.util';
import { resolveShareRatio } from '../utils/resolveShareRatio.util';

/**
 * The percentage and its bar, for a column that is showing a share.
 *
 * Split from `TableGroupShare` so the denominator is read **only where a share
 * was asked for**. A hook cannot be called conditionally, so the check and the
 * work have to live in different components — and the work is a fold over every
 * row, which every measure cell would otherwise pay for on a table with no
 * share turned on at all (#648).
 *
 * **The denominator is the grand total, and the accessible text says so**
 * (ADR-086). This grid shows the same measure at several levels at once, so
 * position cannot carry which total a percentage is of.
 *
 * **The bar is decorative; the number is the content.** It is `aria-hidden` and
 * carries no `role`: it depicts a value that is already text beside it, and a
 * `progressbar` would announce the quantity twice and imply a task in progress.
 */
export const TableGroupShareValue = ({
  columnKey,
  fn,
  value,
}: TableGroupShareValueProps) => {
  const denominator = useGetTableShareDenominator({ columnKey, fn });
  const locale = useGetTableLocale();

  const ratio = resolveShareRatio({ denominator, value });

  if (ratio === undefined) {
    return (
      <span
        {...stylex.props(tableGroupShareStyles.absent)}
        data-testid='table-group-share-absent'
      >
        <span aria-hidden='true'>{TABLE_SHARE_UNAVAILABLE_GLYPH}</span>
        <span {...stylex.props(accessibility.visuallyHidden)}>
          {TABLE_SHARE_UNAVAILABLE_LABEL}
        </span>
      </span>
    );
  }

  // Named rather than nested into the style call below: the clamp is a
  // decision about the bar, not about the number, and the two read as one
  // expression when they are written as one.
  const barWidth = `${Math.min(Math.abs(ratio), 1) * 100}%`;
  const formatted = formatSharePercent({ locale, ratio });

  return (
    <span
      {...stylex.props(tableGroupShareStyles.container)}
      data-testid='table-group-share'
    >
      <span {...stylex.props(tableGroupShareStyles.value)}>
        <span aria-hidden='true'>{formatted}</span>
        <span {...stylex.props(accessibility.visuallyHidden)}>
          {`${formatted} ${TABLE_SHARE_OF_TOTAL_LABEL}`}
        </span>
      </span>
      <span
        aria-hidden='true'
        {...stylex.props(tableGroupShareStyles.barTrack)}
        data-testid='table-group-share-bar'
      >
        {/*
         * Clamped to the track: a share can exceed 100% where the measure and
         * the total have opposite signs, and a bar wider than its own track
         * would paint outside the cell. The number beside it still reads the
         * unclamped value, which is the one the data supports.
         */}
        <span {...stylex.props(tableGroupShareStyles.barFill(barWidth))} />
      </span>
    </span>
  );
};
