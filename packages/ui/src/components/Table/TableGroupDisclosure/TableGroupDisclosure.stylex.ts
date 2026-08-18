import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

/** The box the chevron occupies, reserved whether or not one is drawn. */
const CONTROL_SIZE_PX = 16;

export const tableGroupDisclosureStyles = stylex.create({
  control: {
    alignItems: 'center',
    color: colors.brandPrimaryCardText,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    /**
     * The rotation is the state, so the two directions are one shape at two
     * angles rather than two icons that can drift apart. It is a transform, so
     * it changes nothing about the row's box — the height invariant `TableRow`
     * pins is untouched (ADR-065).
     */
    transform: 'rotate(0deg)',
    transitionDuration: {
      default: '120ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transitionProperty: 'transform',
    height: CONTROL_SIZE_PX,
    width: CONTROL_SIZE_PX,
  },
  expanded: {
    transform: 'rotate(90deg)',
  },
  /** Keeps a childless row's label aligned with its siblings' (see the component). */
  spacer: {
    display: 'inline-block',
    flexShrink: 0,
    height: CONTROL_SIZE_PX,
    width: CONTROL_SIZE_PX,
  },
});
