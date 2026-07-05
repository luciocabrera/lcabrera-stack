import * as stylex from '@stylexjs/stylex';

import { colors } from '../tokens/colors.stylex';

export const lightTheme = stylex.createTheme(colors, {
  /* Base brand anchors */
  // brandPrimary: 'oklch(48% 0.05 266)',
  brandPrimary: '#ffffff00', // 'oklch(0.24 0.12 259.78 / 0.88)',
  brandSecondary: 'oklch(48% 0.05 266)',
  // brandSecondary: 'oklch(49% 0.06 300)',
  success: 'oklch(52% 0.06 160)',
  warning: 'oklch(44% 0.08 80)',
  error: 'oklch(0.48095 0.14876 27.27312)',
  info: 'oklch(66% 0.19 220)',

  glassBackgroundColorPrimary: '#ffffffc9', // '#ffffff85', //'#0000002b',
  glassBackgroundColorSecondary: '#ffffff4d',
  glassBackgroundColorTertiary: '#ffffff85', //

  glassBackdropFilterPrimary: 'blur(42px) brightness(.9)',

  glassBackdropFilterSecondary: 'blur(42px) saturate(0.9)',
  gradientLinearBackground:
    'linear-gradient(90deg, #213c71a8, #21183896, #6e00c3b0)',
  // gradientLinearBackground:
  //   'linear-gradient(45deg, rgba(90, 144, 255, 0.95), rgba(40, 228, 194, 0.86), rgba(196, 120, 255, 0.84), rgba(126, 158, 255, 0.64))',
  gradientRadialBackground:
    'radial-gradient(46% 52% at 18% 25%, #5a90fff2, transparent 71%), radial-gradient(44% 44% at 82% 24%, #96ffec9e, transparent 71%), radial-gradient(52% 56% at 84% 82%, #c478ff6e, transparent 73%), radial-gradient(40% 40% at 53% 62%, #7e9effa3, transparent 74%)',
  // 'radial-gradient(46% 52% at 18% 25%, rgba(90, 144, 255, 0.95), transparent 71%), radial-gradient(44% 44% at 82% 24%, rgba(40, 228, 194, 0.86), transparent 71%), radial-gradient(52% 56% at 84% 82%, rgba(196, 120, 255, 0.84), transparent 73%), radial-gradient(40% 40% at 53% 62%, rgba(126, 158, 255, 0.64), transparent 74%)',

  gradientOpacityPrimary: '0.5',
  gradientOpacitySecondary: '0.9',

  /* Derivatives using OKLCH math */
  brandPrimaryHover: 'oklch(from brandPrimary l-0.05 c+0.01 h)',
  brandPrimaryActive: 'oklch(from brandPrimary l-0.10 c+0.02 h)',
  brandPrimaryText: 'lab(12 34.23 -54.75 / 0.76)', // 'oklch(from brandPrimary l+0.10 c+0.05 h)',

  brandSecondaryHover: 'oklch(from brandSecondary l-0.05 c+0.01 h)',
  brandSecondaryActive: 'oklch(from brandSecondary l-0.10 c+0.02 h)',
  brandSecondaryText: 'oklch(100% 0 0)',

  /* Semantic backgrounds (using lightened washed chroma) */
  brandPrimaryBackground: 'oklch(92% 0.02 266)',
  brandPrimaryCardText: 'oklch(35% 0.08 266)',

  errorBackground: 'oklch(92% 0.03 25 / 0.32)',
  errorCardText: 'oklch(45% 0.12 25)',
  errorHover: 'oklch(from error l-0.07 c+0.02 h)',
  errorText: 'oklch(100% 0 0)',

  successBackground: 'oklch(92% 0.02 160 / 0.32)',
  successCardText: 'oklch(38% 0.09 160)',
  successHover: 'oklch(from success l-0.07 c+0.01 h)',
  successText: 'oklch(100% 0 0)',

  warningBackground: 'oklch(92% 0.03 80 / 0.32)',
  warningCardText: 'oklch(32% 0.11 80)',
  warningHover: 'oklch(from warning l-0.07 c+0.03 h)',
  warningText: 'oklch(100% 0 0)',

  infoBackground: 'oklch(92% 0.03 220 / 0.32)',
  infoHover: 'oklch(from info l-0.10 c+0.03 h)',
  infoText: 'oklch(100% 0 0)',

  /* Neutral scale (unified grey ramp for typography & surfaces) */
  backgroundPrimary: 'oklch(99% 0 0)', // white
  backgroundSecondary: 'oklch(97.5% 0.006 250)', // #f8f9fa equivalent
  backgroundTertiary: 'oklch(95% 0.005 250)', // #f1f3f5
  surfacePrimary: 'lab(100 0 0 / 0.66)', // 'oklch(99% 0 0)',
  surfaceSecondary: 'oklch(97.5% 0.003 250)',
  surfaceElevated: '#efeded99', // 'oklch(100% 0 0)',
  surfaceStripe: 'oklch(0% 0 0 / 0.02)',

  borderPrimary: 'lab(12 34.23 -54.75 / 0.76)', // 'oklch(86% 0.004 250)',
  borderSecondary: 'oklch(92% 0.004 250)',
  borderFocus: 'oklch(from brandPrimary l+0.10 c+0.05)',

  /* Text scale mapped properly to lightness */
  textPrimary: 'lab(12 34.23 -54.75 / 0.76)', //'oklch(25% 0.01 250)', // replaces #212529
  textSecondary: 'lab(45 20 -30 / 0.8)', // replaces #495057
  textTertiary: 'lab(53 0.01 250)', // replaces #6c757d
  textInverse: 'lab(100 0 0)',

  disabled: 'oklch(92% 0.004 250)',
  disabledText: 'oklch(69% 0.01 250)',

  hover: 'oklch(0% 0 0 / 0.04)', // rgba(0,0,0,.04)
  active: 'oklch(0% 0 0 / 0.08)', // rgba(0,0,0,.08)
  overlay: 'oklch(0% 0 0 / 0.5)', // modal/dialog backdrop
  patternDot: 'oklch(90% 0.004 250)', // subtle light-grey dots on the light background
  shadowHover:
    '0 20px 25px -5px oklch(0% 0 0 / 0.15), 0 10px 10px -5px oklch(0% 0 0 / 0.08)',
});
