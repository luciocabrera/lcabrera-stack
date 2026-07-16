import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  dropdownBase: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    borderWidth: '1px',
    backdropFilter: 'blur(25px)',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginTop: spacing.sm,
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
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
});
