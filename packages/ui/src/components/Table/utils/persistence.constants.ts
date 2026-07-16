export const PERSISTENCE_VERSION = 1;
export const DATA_STATE_SESSION_KEY_SUFFIX = 'dataState';
export const UI_STATE_SESSION_KEY_SUFFIX = 'uiState';

/**
 * Cookie slice suffix for the small set of drawer flags that must be readable
 * during SSR (in the loader) so the drawer is rendered in its persisted
 * open/pinned state on the very first paint — avoiding a hydration layout shift.
 */
export const UI_FLAGS_COOKIE_KEY_SUFFIX = 'uiFlags';
