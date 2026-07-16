/**
 * Stable per-application identifier.
 *
 * Used to namespace app-level cookies (theme, global settings) and table
 * persisted keys. Because these UI pieces live in the shared `@repo/ui`
 * package and cookies are shared across ports on the same host, each app must
 * use a distinct id so preferences stay isolated per app.
 *
 * Keep this value unique per application and stable over time — changing it
 * invalidates previously persisted state for this app.
 */
export const APP_ID = 'admin-system';
