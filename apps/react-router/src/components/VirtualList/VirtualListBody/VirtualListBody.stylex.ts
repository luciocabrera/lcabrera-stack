import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const localStyles = stylex.create({
  noResults: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
  },
  optionsList: {
    backgroundColor: colors.surfacePrimary,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  optionsListFill: {
    flex: '1',
    minHeight: 0,
    overflow: 'hidden',
  },
  virtualContainer: (height: string) => ({
    height,
    overflowX: 'hidden',
    overflowY: 'auto',
    position: 'relative',
  }),
  virtualContainerFill: {
    flex: '1',
    overflowX: 'hidden',
    overflowY: 'auto',
    position: 'relative',
  },
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
  virtualScrollArea: (height: number) => ({
    height,
    position: 'relative',
  }),
});

export const styles = {
  noResults: localStyles.noResults,
  optionsList: localStyles.optionsList,
  optionsListFill: localStyles.optionsListFill,
  virtualContainer: localStyles.virtualContainer,
  virtualContainerFill: localStyles.virtualContainerFill,
  virtualOffset: localStyles.virtualOffset,
  virtualScrollArea: localStyles.virtualScrollArea,
};
