import * as stylex from '@stylexjs/stylex';

import { colors } from '../tokens/colors.stylex';

/**
 * Dark Theme
 * Defines color values for dark mode
 */

export const darkTheme = stylex.createTheme(colors, {
  active: 'rgba(255, 255, 255, 0.1)',
  // Background colors
  backgroundPrimary: '#1a1b1e',
  backgroundSecondary: '#25262b',

  backgroundTertiary: '#2c2e33',
  borderFocus: '#5c7cfa',
  // Border colors
  borderPrimary: '#373a40',

  borderSecondary: '#2c2e33',
  // Brand colors - Primary (Blue)
  brandPrimary: '#4b5068',
  brandPrimaryActive: '#3d4254',
  brandPrimaryBackground: '#4263eb21',
  brandPrimaryCardText: '#ffffff',
  brandPrimaryHover: '#43495e',

  brandPrimaryText: '#ffffff',
  // Brand colors - Secondary (Purple)
  brandSecondary: '#584c64',
  brandSecondaryActive: '#665872',

  brandSecondaryHover: '#60526b',
  brandSecondaryText: '#ffffff',
  disabled: '#373a40',
  disabledText: '#5c5f66',

  // Semantic colors - Error (Red)
  error: '#7e5151',
  errorBackground: '#dbb5b54d',
  errorCardText: '#ffffff',
  errorHover: '#8e5f5f',
  errorText: '#ffffff',

  // Interactive states
  hover: 'rgba(255, 255, 255, 0.05)',
  // Semantic colors - Info (Cyan)
  info: '#22b8cf',
  infoBackground: '#4263eb21',
  infoHover: '#3bc9db',

  infoText: '#1a1b1e',
  // Semantic colors - Success (Green)
  success: '#50665b',
  successBackground: '#7a947d3b',
  successCardText: '#ffffff',
  successHover: '#5d7267',

  successText: '#ffffff',
  surfaceElevated: '#373a40',
  // Surface colors
  surfacePrimary: '#25262b',
  surfaceSecondary: '#2c2e33',

  textInverse: '#1a1b1e',
  // Text colors
  textPrimary: '#f8f9fa',
  textSecondary: '#ced4da',
  textTertiary: '#adb5bd',

  // Semantic colors - Warning (Yellow)
  warning:'#5C4A38',// '#8b7856',
  warningBackground: '#ecdfa75c',
  warningCardText: '#ffffff',
  warningHover: '#9a8563',
  warningText: '#ffffff',
});
