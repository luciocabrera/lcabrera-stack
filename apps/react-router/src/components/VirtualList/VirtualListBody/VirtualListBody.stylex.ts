import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  noResults: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
  },
  optionsList: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.xs,
    overflow: 'hidden',
    backgroundColor: colors.surfacePrimary,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  optionsListFill: {
    flex: '1',
    overflow: 'hidden',
    minHeight: 0,
  },
  sentinel: {
    pointerEvents: 'none',
    height: '1px',
    width: '1px',
  },
  virtualContainer: (height: string) => ({
    position: 'relative',
    height,
    overflowX: 'hidden',
    overflowY: 'auto',
  }),
  virtualContainerFill: {
    flex: '1',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
});
