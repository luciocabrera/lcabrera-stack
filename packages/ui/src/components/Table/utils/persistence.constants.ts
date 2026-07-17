export const PERSISTENCE_VERSION = 1;
export const DATA_STATE_SESSION_KEY_SUFFIX = 'dataState';

/**
 * Cookie slice suffix for the drawer UI state. It must be readable during SSR
 * (in the loader) so the drawer renders in its persisted state on the very
 * first paint — avoiding a hydration layout shift. Named `uiFlags` for
 * backwards compatibility with cookies already issued; it now carries the whole
 * `PersistedUiState`, not just the open/pinned booleans.
 */
export const UI_FLAGS_COOKIE_KEY_SUFFIX = 'uiFlags';
