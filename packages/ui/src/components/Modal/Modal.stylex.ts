import {
  borderRadius,
  easing,
  spacing,
  transitions,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const modalStyles = stylex.create({
  body: {
    padding: spacing.lg,
    flex: '1',
    gap: spacing.md,
    //     transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    // backdropFilter: colors.glassBackdropFilterPrimary,
    // backgroundColor: colors.glassBackgroundColorPrimary,
    // backdropFilter: 'blur(30px)',
    // backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflowY: 'auto',
  },
  dialog: {
    // light variant
    // background-color: #ffffffad;
    // color: white;
    padding: 0,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.glassBackgroundColorPrimary,
    backgroundImage: `radial-gradient(46% 52% at 18% 25%, #5a90ff8c, #0000 71%), radial-gradient(44% 44% at 82% 24%, #28e4c24f, #0000 71%), radial-gradient(52% 56% at 84% 82%, #c478ff4d, #0000 73%), radial-gradient(40% 40% at 53% 62%, #7e9eff7a, #0000 74%)`,
    boxShadow: '0 12px 40px 20px #6a6a6a80',
    color: colors.textPrimary,
    textAlign: 'left',
    // zIndex: zIndex.modal,
    maxHeight: 'min(85vh, 600px)',
    width: 'min(90vw, 520px)',
    '::backdrop': {
      transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
      backdropFilter: 'blur(2px)',
      backgroundColor: colors.overlay,
      backgroundImage: `radial-gradient(46% 52% at 18% 25%, #5a90ff8c, #0000 71%), radial-gradient(44% 44% at 82% 24%, #28e4c269, #0000 71%), radial-gradient(52% 56% at 84% 82%, #c478ff45, #0000 73%), radial-gradient(40% 40% at 53% 62%, #7e9effa3, #0000 74%)`,
    },
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    // backdropFilter: 'blur(30px)',
    // backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
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
