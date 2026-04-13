import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  containerFill: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  }, //isOperatorOpen
  dropdownBase: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    borderWidth: '1px',
    // backgroundColor: colors.surfacePrimary,
    // backgroundColor: colors.surfaceSecondary,
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
});
