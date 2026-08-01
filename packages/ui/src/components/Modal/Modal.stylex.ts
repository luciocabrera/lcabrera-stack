import {
  borderRadius,
  easing,
  spacing,
  transitions,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const modalStyles = stylex.create({
  // A column, so a single child asking for `flex: 1 1 auto` receives the whole
  // body height and can run its own scroll region (see Form/FormBody) instead
  // of scrolling here — which is what pushes a form's footer out of view.
  // `overflowY` stays for plain content that does not manage its own height;
  // `scrollbarGutter: stable both-edges` holds that bar's space open either
  // way, so content never reflows the moment it grows past the height cap —
  // `both-edges` rather than the default single edge because an inset applied
  // to one side only reads as off-centre content.
  body: {
    scrollbarGutter: 'stable both-edges',
    padding: spacing.lg,
    flex: '1 1 auto',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
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
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'flex-end',
    borderTopColor: colors.borderSecondary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
