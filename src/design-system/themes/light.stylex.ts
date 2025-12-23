import * as stylex from '@stylexjs/stylex';

import { colors } from '../tokens/colors.stylex';

/**
 * Light Theme
 * Defines color values for light mode
 */

export const lightTheme = stylex.createTheme(colors, {
  active: 'rgba(0, 0, 0, 0.08)',
  // Background colors
  backgroundPrimary: '#ffffff',
  backgroundSecondary: '#f8f9fa',

  backgroundTertiary: '#f1f3f5',
  borderFocus: '#4263eb',
  // Border colors
  borderPrimary: '#dee2e6',

  borderSecondary: '#e9ecef',
  // Brand colors - Primary (Blue)
  // brandPrimary: '#202846ad',
  brandPrimary: '#4b5068',
  brandPrimaryActive: '#3d4254',
  brandPrimaryBackground: '#4263eb21',
  brandPrimaryCardText: '#2d3a5c',
  brandPrimaryHover: '#43495e',

  brandPrimaryText: '#ffffff',
  // Brand colors - Secondary (Purple)
  brandSecondary: '#584c64',
  brandSecondaryActive: '#483f51',

  brandSecondaryHover: '#50455a',
  brandSecondaryText: '#ffffff',
  disabled: '#e9ecef',
  disabledText: '#adb5bd',

  // Semantic colors - Error (Red)
  error: '#7e5151',
  errorBackground: '#dbb5b54d',
  errorCardText: '#6b3636',
  errorHover: '#6d4545',
  errorText: '#ffffff',

  // Interactive states
  hover: 'rgba(0, 0, 0, 0.04)',
  // Semantic colors - Info (Cyan)
  info: '#1098ad',
  infoBackground: '#4263eb21',
  infoHover: '#0c8599',

  infoText: '#ffffff',
  // Semantic colors - Success (Green)
  success: '#50665b',
  successBackground: '#7a947d3b',
  successCardText: '#2a4233',
  successHover: '#44564d',

  successText: '#ffffff',
  surfaceElevated: '#ffffff',
  // Surface colors
  surfacePrimary: '#ffffff',
  surfaceSecondary: '#f8f9fa',

  textInverse: '#ffffff',
  // Text colors
  textPrimary: '#212529',
  textSecondary: '#495057',
  textTertiary: '#6c757d',

  // Semantic colors - Warning (Yellow)
  warning:'#5C4A38',// '#8b7856',
  warningBackground: '#ecdfa75c',
  warningCardText: '#866201',
  warningHover: '#786849',
  warningText: '#ffffff',
});
