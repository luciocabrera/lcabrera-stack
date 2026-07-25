export const GLOBAL_SETTINGS_COOKIE_KEY = 'global-settings';
export const GLOBAL_SETTINGS_COOKIE_VERSION = 1;

/** Valid values for the pin-side preference cookie slice */
export const PIN_SIDE_VALUES = ['closest-edge', 'left', 'right'] as const;

/** Valid values for the navigation size preference cookie slice */
export const NAVIGATION_SIZE_VALUES = [
  'compact',
  'large',
  'medium',
  'small',
] as const;

/** Valid values for the navigation collapsed preference cookie slice */
export const NAVIGATION_COLLAPSED_VALUES = ['collapsed', 'expanded'] as const;

/** Valid values for the pin-conflict resolution preference cookie slice */
export const PIN_CONFLICT_VALUES = [
  'move-column',
  'pin-all-between',
  'pin-only',
] as const;

/** Valid values for the order-conflict resolution preference cookie slice */
export const ORDER_CONFLICT_VALUES = [
  'pin-to-match-order',
  'remove-conflicting-pins',
  'reset-all-pins',
] as const;

/** Valid values for the unpin-conflict resolution preference cookie slice */
export const UNPIN_CONFLICT_VALUES = [
  'reorder-to-fill',
  'unpin-beyond',
] as const;
