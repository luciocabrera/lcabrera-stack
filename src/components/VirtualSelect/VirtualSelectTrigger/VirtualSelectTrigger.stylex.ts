import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

/** Maximum visible height (px) for the trigger area before tags overflow */
export const TRIGGER_MAX_HEIGHT = 88;

export const styles = stylex.create({
  chevron: (isOpen: boolean) => ({
    borderColor: isOpen
      ? `transparent transparent ${colors.textSecondary} transparent`
      : `${colors.textSecondary} transparent transparent transparent`,
    borderStyle: 'solid',
    borderWidth: isOpen ? '0 4px 5px 4px' : '5px 4px 0 4px',
    flexShrink: 0,
    height: 0,
    marginLeft: 'auto',
    width: 0,
  }),
  overflowTag: {
    padding: `${spacing.xxs} ${spacing.xs}`,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    color: colors.textSecondary,
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightTight,
    whiteSpace: 'nowrap',
  },
  trigger: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
    },
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.xs,
    outline: 'none !important',
    alignContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    cursor: 'pointer',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    textAlign: 'left',
    minHeight: '2.25rem',
    width: '100%',
  },
  triggerClamped: {
    overflow: 'hidden',
    maxHeight: `${TRIGGER_MAX_HEIGHT}px`,
  },
  triggerLabel: {
    flex: '1 1 auto',
    overflow: 'hidden',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  triggerOpen: {
    borderColor: colors.borderPrimary,
  },
  triggerPlaceholder: {
    flex: '1 1 auto',
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    minWidth: 0,
  },
  triggerStatic: {
    cursor: 'default',
  },
});
