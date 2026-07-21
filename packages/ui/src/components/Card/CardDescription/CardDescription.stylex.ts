import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const cardDescriptionStyles = stylex.create({
  description: {
    margin: 0,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    marginTop: spacing.xs,
  },
});
