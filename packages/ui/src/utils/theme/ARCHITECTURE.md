# Theme Utilities Architecture

Theme-domain cookie management — reading and writing the user's preferred theme across SSR and client code.

## Files

| File                         | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `themeCookie.constants.ts`   | `THEME_COOKIE_NAME` shared cookie constant               |
| `getThemeFromCookie.util.ts` | SSR + browser-safe theme cookie reader                   |
| `setThemeCookie.util.ts`     | Client-side trigger for server cookie persistence action |

## Function Responsibilities

| Function             | Side   | Description                                                                           |
| -------------------- | ------ | ------------------------------------------------------------------------------------- |
| `getThemeFromCookie` | shared | Reads theme from request cookie header and falls back to `document.cookie` in browser |
| `setThemeCookie`     | client | Persists theme exclusively through `/_action/persist-cookie`                          |

## Consumers

- `src/root/root.loader.ts` — reads theme on every SSR request
- `src/contexts/ThemeContext/ThemeContext.provider.tsx` — writes theme when user toggles
