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
        <span {...stylex.props(tableGroupShareStyles.barFill(barWidth))} />
      </span>
    </span>
  );
};
