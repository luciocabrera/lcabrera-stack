import * as stylex from '@stylexjs/stylex';

/**
 * Color Tokens - Theme Variables
 * These will be overridden by specific themes
 */

export const colors = stylex.defineVars({
  active: 'var(--active)',
  // Background colors
  backgroundPrimary: 'var(--background-primary)',
  backgroundSecondary: 'var(--background-secondary)',

  backgroundTertiary: 'var(--background-tertiary)',
  borderFocus: 'var(--border-focus)',
  // Border colors
  borderPrimary: 'var(--border-primary)',

  borderSecondary: 'var(--border-secondary)',
  // Brand colors
  brandPrimary: 'var(--brand-primary)',
  brandPrimaryActive: 'var(--brand-primary-active)',
  brandPrimaryBackground: 'var(--brand-primary-background)',
  brandPrimaryCardText: 'var(--brand-primary-card-text)',
  brandPrimaryHover: 'var(--brand-primary-hover)',

  brandPrimaryText: 'var(--brand-primary-text)',
  brandPrimaryTextActive: 'var(--brand-primary-text-active)',
  brandSecondary: 'var(--brand-secondary)',
  brandSecondaryActive: 'var(--brand-secondary-active)',

  brandSecondaryHover: 'var(--brand-secondary-hover)',
  brandSecondaryText: 'var(--brand-secondary-text)',
  disabled: 'var(--disabled)',
  disabledText: 'var(--disabled-text)',

  error: 'var(--error)',
  errorBackground: 'var(--error-background)',
  errorCardText: 'var(--error-card-text)',
  errorHover: 'var(--error-hover)',
  errorText: 'var(--error-text)',

  // Interactive states
  hover: 'var(--hover)',
  overlay: 'var(--overlay)',
  // Shadows
  shadowHover: 'var(--shadow-hover)',
  info: 'var(--info)',
  infoBackground: 'var(--info-background)',
  infoHover: 'var(--info-hover)',

  infoText: 'var(--info-text)',
  // Semantic colors
  success: 'var(--success)',
  successBackground: 'var(--success-background)',
  successCardText: 'var(--success-card-text)',
  successHover: 'var(--success-hover)',

  successText: 'var(--success-text)',
  surfaceElevated: 'var(--surface-elevated)',
  // Surface colors (for cards, modals, etc.)
  surfacePrimary: 'var(--surface-primary)',
  surfaceSecondary: 'var(--surface-secondary)',
  surfaceStripe: 'var(--surface-stripe)',

  textInverse: 'var(--text-inverse)',
  // Text colors
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',

  warning: 'var(--warning)',
  warningBackground: 'var(--warning-background)',
  warningCardText: 'var(--warning-card-text)',
  warningHover: 'var(--warning-hover)',
  warningText: 'var(--warning-text)',
});
