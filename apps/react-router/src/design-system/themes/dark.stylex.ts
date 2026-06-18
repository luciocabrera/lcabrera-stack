import * as stylex from '@stylexjs/stylex';

import { colors } from '../tokens/colors.stylex';

export const darkTheme = stylex.createTheme(colors, {
  /* --- Brand Base Colors --- */
  // brandPrimary: 'oklch(68% 0.06 266)', // lighter for dark backgrounds
  // brandSecondary: 'oklch(63% 0.06 300)',
  // success: 'oklch(70% 0.06 160)',
  // warning: 'oklch(64% 0.08 80)',
  // error: 'oklch(74% 0.10 25)',
  // info: 'oklch(78% 0.19 220)',
  // brandPrimary: 'oklch(48% 0.05 266)',
  // brandSecondary: 'oklch(49% 0.06 300)',
  brandPrimary: 'lab(9.51012% -.812642 -2.82544)', //, 'linear-gradient(45deg, #00000078, #14224575, #21183896)', //  'lab(12 7.13 20.12 / 0.42)', // 'lab(50 -18.73 58.87 / 0.17)', // 'lab(34 -14.67 46.32 / 0.6)', //,lab(11 13.52 -40.39)', //'oklch(0.36 0.15 261.66)',
  brandSecondary: 'oklch(48% 0.05 266)',
  success: 'oklch(52% 0.06 160)',
  warning: 'oklch(44% 0.08 80)',
  error: 'oklch(0.48095 0.14876 27.27312)',
  info: 'oklch(66% 0.19 220)',

  glassBackgroundColorPrimary: '#1211119e', //'#0000002b',
  glassBackgroundColorSecondary: 'lab(10 -0.81 -2.83 / 0.51)',
  glassBackgroundColorTertiary: 'lab(0 0 0 / 0.08)', //
  glassBackdropFilter: 'blur(42px) saturate(0.9)',

  //lab(73 -27.69 88 / 0.75)
  /* Derivatives (reverse logic vs light theme) */
  brandPrimaryHover: 'oklch(from brandPrimary l+0.06 c+0.01)',
  brandPrimaryActive: 'oklch(from brandPrimary l-0.08 c+0.01)',

  brandPrimaryBackground: 'oklch(28% 0.05 266)',
  brandPrimaryCardText: 'oklch(85% 0.08 266)',
  brandPrimaryText: 'oklch(100% 0 0)',
  brandPrimaryTextActive: 'lab(74 -29.14 91.81)',

  brandSecondaryHover: 'oklch(from brandSecondary l+0.06 c+0.02)',
  brandSecondaryActive: 'oklch(from brandSecondary l-0.08 c+0.02)',
  brandSecondaryText: 'oklch(100% 0 0)',

  /* Semantic Colors (dark UI tuned) */
  // errorBackground: 'oklch(28% 0.06 25)',

  errorBackground: 'oklch(92% 0.03 25 / 0.32)',
  errorCardText: 'oklch(88% 0.08 25)',
  errorHover: 'oklch(from error l+0.08 c+0.02 h)',
  errorText: 'oklch(100% 0 0)',

  // successBackground: 'oklch(0.29 0.1 155.23 / 0.5)',
  successBackground: 'oklch(92% 0.02 160 / 0.32)',
  successCardText: 'oklch(85% 0.07 160)',
  // successCardText: 'oklch(38% 0.09 160)',
  successHover: 'oklch(from success l+0.08 c+0.02 h)',
  successText: 'oklch(100% 0 0)',

  // warningBackground: 'oklch(0.32 0.07 77.86 / 0.49)',
  warningBackground: 'oklch(92% 0.03 80 / 0.32)',
  warningCardText: 'oklch(88% 0.09 80)',
  warningHover: 'oklch(from warning l+0.08 c+0.03 h)',
  warningText: 'oklch(100% 0 0)',

  // infoBackground: 'oklch(0.24 0.11 261.62 / 0.77)',
  infoBackground: 'oklch(92% 0.03 220 / 0.32)',
  infoHover: 'oklch(from info l+0.10 c+0.03 h)',
  infoText: 'oklch(100% 0 0)',

  /* --- Neutral System for Dark UI --- */
  backgroundPrimary: 'oklch(14% 0 0)', // base dark surface
  backgroundSecondary: 'oklch(18% 0.005 250)',
  backgroundTertiary: 'oklch(22% 0.008 250)',

  surfacePrimary: 'lab(4 -0.35 -1.26 / 0.48)', // 'oklch(17% 0.005 250)',
  surfaceSecondary: 'oklch(22% 0.008 250)',
  surfaceElevated: 'oklch(26% 0.008 250)',
  surfaceStripe: 'oklch(100% 0 0 / 0.02)',

  borderPrimary: 'oklch(34% 0.008 250)',
  borderSecondary: 'oklch(28% 0.005 250)',
  borderFocus: 'oklch(from brandPrimary l+0.12 c+0.05)',

  /* --- Typography Inversion --- */
  textPrimary: 'oklch(92% 0.01 250)', // light text
  textSecondary: 'oklch(75% 0.01 250)',
  textTertiary: 'oklch(60% 0.01 250)',
  textInverse: 'oklch(12% 0.01 250)',

  disabled: 'oklch(30% 0.01 250)',
  disabledText: 'oklch(54% 0.008 250)',

  /* Interaction + shadows */
  hover: 'oklch(100% 0 0 / 0.09)',
  active: 'oklch(100% 0 0 / 0.10)',
  overlay: 'oklch(0% 0 0 / 0.7)', // modal/dialog backdrop (darker for dark theme)
  shadowHover:
    '0 20px 25px -5px oklch(0% 0 0 / 0.45), 0 10px 10px -5px oklch(0% 0 0 / 0.28)',
});
