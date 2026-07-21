import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  buttonRow: {
    gap: spacing.xs,
    display: 'flex',
  },
  // The only hand-rolled icon span left. Button renders its `icon` slot *before*
  // the label, and this button mirrors the panel it opens by putting the icon on
  // the right, which the slot cannot express — so the icon stays a child here.
  // No margin: the button's own `gap: spacing.xs` already separates its children,
  // and the margin this used to carry was doubling that gap.
  iconRight: {
    alignItems: 'center',
    display: 'inline-flex',
  },
  panelContent: {
    marginTop: spacing.md,
  },
});
