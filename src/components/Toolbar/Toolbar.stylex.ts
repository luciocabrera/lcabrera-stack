import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing, transitions } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  item: {
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    textDecoration: 'none',
    transition: `background-color ${transitions.fast}`,
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    outlineOffset: {
      ':focus-visible': 2,
    },
    width: '100%',
  },

  itemActive: {
    backgroundColor: colors.brandPrimaryBackground,
    color: colors.brandPrimary,
    fontWeight: 600,
  },

  itemIcon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: 20,
    width: 20,
  },

  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  toolbar: (orientation: 'horizontal' | 'vertical') => ({
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    containerName: 'toolbar',
    containerType: 'inline-size',
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
    width: '100%',
  }),

  toolbarHorizontal: {
    '@container toolbar (max-width: 400px)': {
      flexDirection: 'column',
    },
  },

  toolbarItem: {
    flex: '0 0 auto',
    display: 'flex',
  },

  toolbarItemResponsive: {
    '@container toolbar (max-width: 400px)': {
      flex: '1 1 100%',
    },
  },
});
