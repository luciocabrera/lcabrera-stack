import {
  borderRadius,
  easing,
  spacing,
  transitions,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  body: {
    padding: spacing.md,
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  bodyHidden: {
    display: 'none',
  },
  caret: {
    borderColor: `${colors.textSecondary} transparent transparent transparent`,
    borderStyle: 'solid',
    borderWidth: '5px 4px 0 4px',
    transition: `transform ${transitions.fast} ${easing.easeInOut}`,
    flexShrink: 0,
    height: 0,
    width: 0,
  },
  caretCollapsed: {
    transform: 'rotate(-90deg)',
  },
  card: {
    borderColor: colors.borderSecondary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    backgroundColor: colors.surfacePrimary,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: `${spacing.sm} ${spacing.md}`,
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerButton: {
    borderStyle: 'none',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: 'inherit',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  headerOpen: {
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  label: {
    color: colors.textPrimary,
    fontWeight: 600,
  },
});
