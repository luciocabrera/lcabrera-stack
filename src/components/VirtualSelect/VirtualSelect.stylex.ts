import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const localStyles = stylex.create({
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
  container: {
    position: 'relative',
    width: '100%',
  },
  containerFill: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  dropdown: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    borderWidth: '1px',
    backgroundColor: colors.surfacePrimary,
    display: 'flex',
    flexDirection: 'column',
    marginTop: spacing.sm,
  },
  dropdownAbsolute: {
    boxShadow: shadows.lg,
    position: 'absolute',
    zIndex: zIndex.dropdown,
    left: 0,
    marginTop: spacing.sm,
    right: 0,
    top: '100%',
  },
  dropdownStatic: {
    position: 'relative',
  },
  dropdownStaticFill: {
    flex: '1',
    position: 'relative',
    minHeight: 0,
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
  triggerClamped: {
    overflow: 'hidden',
    maxHeight: '5rem',
  },
  triggerStatic: {
    cursor: 'default',
  },
});

/** Maximum visible height (px) for the trigger area before tags overflow */
export const TRIGGER_MAX_HEIGHT = 80;

export const styles = {
  chevron: localStyles.chevron,
  container: localStyles.container,
  containerFill: localStyles.containerFill,
  dropdownAbsolute: localStyles.dropdownAbsolute,
  dropdownBase: localStyles.dropdown,
  dropdownStatic: localStyles.dropdownStatic,
  dropdownStaticFill: localStyles.dropdownStaticFill,
  overflowTag: localStyles.overflowTag,
  trigger: localStyles.trigger,
  triggerClamped: localStyles.triggerClamped,
  triggerStatic: localStyles.triggerStatic,
  triggerLabel: localStyles.triggerLabel,
  triggerOpen: localStyles.triggerOpen,
  triggerPlaceholder: localStyles.triggerPlaceholder,
};
