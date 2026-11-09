import { colors } from '#ui/design-system/tokens/colors.stylex';

export const PAGE_BACKGROUNDS = [
  colors.backgroundPrimary,
  colors.backgroundSecondary,
  colors.backgroundTertiary,
  colors.surfacePrimary,
  colors.surfaceSecondary,
  colors.surfaceElevated,
] as const;

export const STYLE_TEXT_CONTRAST_TITLE =
  '$theme $name ($foreground) meets WCAG AA on $background over $surface';
