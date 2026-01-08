import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
  input: {
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    position: 'absolute',
    whiteSpace: 'nowrap',
    height: '1px',
    width: '1px',
  },

  track: {
    padding: '2px',
    borderColor: {
      default: colors.borderPrimary,
      ':hover': colors.borderSecondary,
    },
    borderRadius: borderRadius.full,
    borderStyle: 'solid',
    borderWidth: '1px',
    transition: `background-color ${transitions.fast}, border-color ${transitions.fast}`,
    backgroundColor: colors.surfaceSecondary,

    cursor: 'pointer',
    display: 'inline-flex',
    position: 'relative',
    height: '24px',
    width: '44px',
  },
  track_checked: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
  },
  track_disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  track_focus: {
    outline: `2px solid ${colors.brandPrimary}`,
    outlineOffset: '2px',
  },
  thumb: {
    borderRadius: borderRadius.full,
    transition: `transform ${transitions.fast}`,
    backgroundColor: colors.surfacePrimary,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    transform: 'translateX(0)',
    height: '18px',
    width: '18px',
  },
  thumb_checked: {
    transform: 'translateX(20px)',
  },
  label: {
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: '0.875rem',
    userSelect: 'none',
  },
  label_disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
});
