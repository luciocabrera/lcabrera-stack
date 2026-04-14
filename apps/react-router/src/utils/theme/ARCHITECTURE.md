# Theme Utilities Architecture

Theme-domain cookie management — reading and writing the user's preferred theme across SSR and client code.

## Files

| File                         | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `themeCookie.constants.ts`   | `THEME_COOKIE_NAME`, `THEME_COOKIE_MAX_AGE_DAYS` shared cookie constants |
| `getThemeFromCookie.util.ts` | Server-side theme cookie reader                                          |
| `setThemeCookie.util.ts`     | Client-side theme cookie writer                                          |

## Function Responsibilities

| Function             | Side   | Description                                                                           |
| -------------------- | ------ | ------------------------------------------------------------------------------------- |
| `getThemeFromCookie` | server | Reads theme from a `Cookie:` header string; returns `ThemeMode` or `undefined`        |
| `setThemeCookie`     | client | Writes theme to `document.cookie` with 1-year expiry + `SameSite=Lax`; SSR-safe guard |

## Consumers

- `src/root/root.loader.ts` — reads theme on every SSR request
- `src/contexts/ThemeContext/ThemeContext.provider.tsx` — writes theme when user toggles
