# Storage Utils Architecture

Environment-safe persistence helpers for cookies and localStorage with SSR support.

## File Structure

```
storage/
├── ARCHITECTURE.md
├── index.ts
├── buildCookieString.util.ts
├── readFromCookie.util.ts
├── writeToCookie.util.ts
└── writeToLocalStorage.util.ts
```

## Dependency Graph

```mermaid
graph TD
  Index[Storage index] --> Read[Read from cookie utility]
  Index --> WriteCookie[Write to cookie utility]
  Index --> WriteLocal[Write to localStorage utility]

  WriteCookie --> BuildCookie[Build cookie string utility]
  Read --> Parse[Parse cookies helper]
```

## Utilities

### buildCookieString.util.ts

Builds a one-year cookie string with URL-encoded value.

```mermaid
flowchart TD
  A[buildCookieString args] --> B[Set expiry to now plus one year]
  B --> C[encodeURIComponent(value)]
  C --> D[Return cookie string with expires path and SameSite Lax]
```

Key behavior:

- Uses `encodeURIComponent` to preserve special characters.
- Forces site-wide path and lax same-site policy.

### readFromCookie.util.ts

Reads cookie value in browser or SSR context.

```mermaid
flowchart TD
  A[readFromCookie args] --> B{document exists and cookieString missing}
  B -- yes --> C[Parse browser cookies]
  C --> D[Return cookies[key]]

  B -- no --> E{cookieString provided}
  E -- yes --> F[Parse provided cookie string]
  F --> G[Return cookies[key]]
  E -- no --> H[Return undefined]
```

Key behavior:

- Uses `parseCookies` from theme cookie utility to keep parser logic shared.
- Supports SSR by accepting explicit `cookieString` input.

### writeToCookie.util.ts

Writes cookies in either server response headers or browser runtime.

```mermaid
flowchart TD
  A[writeToCookie args] --> B[buildCookieString]
  B --> C{headers provided}
  C -- yes --> D[Append Set Cookie header]
  C -- no --> E{document exists}
  E -- no --> F[Return]
  E -- yes --> G[Write browser cookie]
```

Key behavior:

- SSR path: appends `Set-Cookie` to response headers.
- Browser path: writes via `document.cookie`.
- No-op when called outside browser without `headers`.

### writeToLocalStorage.util.ts

Safely writes to localStorage without throwing on restricted environments.

```mermaid
flowchart TD
  A[writeToLocalStorage args] --> B{localStorage exists}
  B -- no --> C[Return]
  B -- yes --> D[try localStorage.setItem]
  D --> E{throws}
  E -- yes --> F[Swallow error]
  E -- no --> G[Done]
```

Key behavior:

- Designed to tolerate private mode, quota limits, and disabled storage.

## Barrel Exports

`index.ts` exports:

- `readFromCookie`
- `writeToCookie`
- `writeToLocalStorage`
