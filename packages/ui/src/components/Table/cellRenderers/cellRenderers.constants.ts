import type {
  TableCellRenderer,
  TableCellToneColors,
} from '#ui/components/Table/Table.types';

import { TABLE_CELL_BADGE_RENDERER } from '#ui/components/Table/TableCellBadge/TableCellBadge.constants';
import { TABLE_CELL_DELTA_RENDERER } from '#ui/components/Table/TableCellDelta/TableCellDelta.constants';
import { TABLE_CELL_TEXT_RENDERER } from '#ui/components/Table/TableCellText/TableCellText.constants';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const TABLE_CELL_NEUTRAL_TONE: TableCellToneColors = {
  background: colors.backgroundTertiary,
  text: colors.textSecondary,
};

export const TABLE_CELL_BUILT_IN_TONES: Readonly<
  Record<string, TableCellToneColors>
> = {
  error: { background: colors.error, text: colors.errorText },
  info: { background: colors.info, text: colors.infoText },
  neutral: TABLE_CELL_NEUTRAL_TONE,
  success: { background: colors.success, text: colors.successText },
  warning: { background: colors.warning, text: colors.warningText },
};

export const TABLE_CELL_BUILT_IN_RENDERERS: readonly TableCellRenderer[] = [
  TABLE_CELL_BADGE_RENDERER,
  TABLE_CELL_DELTA_RENDERER,
  TABLE_CELL_TEXT_RENDERER,
];
