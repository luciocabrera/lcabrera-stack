# Theme Utilities Architecture

Theme-domain cookie management — reading and writing the user's preferred theme across SSR and client code.

## Files

| File                         | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `themeCookie.constants.ts`   | `THEME_COOKIE_NAME` shared cookie constant               |
| `getThemeFromCookie.util.ts` | SSR + browser-safe theme cookie reader                   |
| `setThemeCookie.util.ts`     | Client-side trigger for server cookie persistence action |

## Function Responsibilities

| Function             | Side   | Description                                                                                                                                   |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `getThemeFromCookie` | shared | Reads theme from request cookie header and falls back to `document.cookie` in browser; accepts an optional `appId` to read the app-scoped key |
| `setThemeCookie`     | client | Persists theme exclusively through `/_action/persist-cookie`; accepts an optional `appId` to scope the cookie key                             |

## App scoping

Cookies are shared across ports on the same host, so `getThemeFromCookie` /
`setThemeCookie` accept an optional `appId` that scopes the key to
`{appId}-theme` (via `getAppScopedCookieKey`). The `appId` flows from each app's
`APP_ID` constant through the root loader (read) and `ThemeProvider` (write).

## Consumers

- `src/root/root.loader.ts` — reads theme on every SSR request
- `src/contexts/ThemeContext/ThemeContext.provider.tsx` — writes theme when user toggles
