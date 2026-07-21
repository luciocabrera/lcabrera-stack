/**
 * Stable per-application identifier.
 *
 * Used to namespace table (and other UI-package) persisted cookie / storage
 * keys. Because the Table and its settings live in the shared `@lcabrera/ui`
 * package and are reused across multiple apps, two apps can legitimately use
 * the same `persistenceKey` (e.g. `"orders"`). Scoping keys with this id keeps
 * each app's persisted settings isolated from the others.
 *
 * Keep this value unique per application and stable over time — changing it
 * invalidates previously persisted state for this app.
 */
export const APP_ID = 'react-router';
