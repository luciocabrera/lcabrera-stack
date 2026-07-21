import {
  borderRadius,
  easing,
  spacing,
  transitions,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const modalStyles = stylex.create({
  body: {
    padding: spacing.lg,
    flex: '1 1 auto',
    gap: spacing.md,
    display: 'flex',
    flexWrap: 'wrap',
    //     transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    // backdropFilter: colors.glassBackdropFilterPrimary,
    // backgroundColor: colors.glassBackgroundColorPrimary,
    // backdropFilter: 'blur(30px)',
    // backgroundColor: 'rgba(15, 23, 42, 0.45)',
    // display: 'flex',
    // flexDirection: 'column',
    minHeight: 0,
    overflowY: 'auto',
  },
  // The glass surface (backdrop-filter + translucent fill + gradient tint) is
  // supplied by the shared `surfaceStyles.glass` recipe, composed ahead of this
  // in Modal.component.tsx. Only the dialog's frame/layout live here.
  dialog: {
    padding: 0,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    boxShadow: '0 12px 40px 20px #6a6a6a80',
    color: colors.textPrimary,
    textAlign: 'left',
    maxHeight: 'min(85vh, 600px)',
    width: 'min(90vw, 520px)',
    '::backdrop': {
      transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
      backdropFilter: 'blur(2px)',
      backgroundColor: colors.overlay,
      backgroundImage: colors.glassGradientBackdrop,
    },
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    // backdropFilter: 'blur(30px)',
    // backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'flex-end',
    borderTopColor: colors.borderSecondary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  // header: {
  //   padding: spacing.lg,
  //   gap: spacing.sm,
  //   alignItems: 'flex-start',
  //   backdropFilter: 'blur(30px)',
  //   backgroundColor: 'rgba(15, 23, 42, 0.45)',
  //   display: 'flex',
  //   flexShrink: 0,
  //   justifyContent: 'space-between',
  //   borderBottomColor: colors.borderSecondary,
  //   borderBottomStyle: 'solid',
  //   borderBottomWidth: '1px',
  // },
});
