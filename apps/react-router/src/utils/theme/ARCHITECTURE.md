# Theme Utilities Architecture

Theme-domain cookie management — reading and writing the user's preferred theme across SSR and client code.

## Files

| File                         | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `themeCookie.constants.ts`   | `THEME_COOKIE_NAME`, `THEME_COOKIE_MAX_AGE_DAYS` shared cookie constants |
| `getThemeFromCookie.util.ts` | SSR + browser-safe theme cookie reader                                   |
| `setThemeCookie.util.ts`     | Client-side theme cookie writer                                          |

## Function Responsibilities

| Function             | Side   | Description                                                                                 |
| -------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `getThemeFromCookie` | shared | Reads theme from request cookie header and falls back to `document.cookie` in browser       |
| `setThemeCookie`     | client | Writes theme to `document.cookie` and mirrors persistence through `/_action/persist-cookie` |

## Consumers

- `src/root/root.loader.ts` — reads theme on every SSR request
- `src/contexts/ThemeContext/ThemeContext.provider.tsx` — writes theme when user toggles
