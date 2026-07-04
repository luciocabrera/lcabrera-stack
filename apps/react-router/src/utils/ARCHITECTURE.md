# Utils Architecture

Shared utility layer for formatting, URL state encoding/decoding, storage, performance instrumentation, environment-aware API URL resolution, comparison helpers, runtime type guards, filter adapters, and theme cookie management.

## Folder Structure

```
utils/
├── ARCHITECTURE.md          -> This overview
├── index.ts                 -> Root barrel (re-exports shallowEqual from comparison/)
├── api/
│   └── ARCHITECTURE.md      -> API base URL resolution
├── comparison/
│   └── ARCHITECTURE.md      -> Shallow object equality helpers
├── filters/
│   └── ARCHITECTURE.md      -> Table filter-options adapters
├── formatters/
│   └── ARCHITECTURE.md      -> Locale-aware date/number/currency formatters
├── logger/
│   └── ARCHITECTURE.md      -> Level-aware, tree-shakeable application logger
├── performance/
│   └── ARCHITECTURE.md      -> Render tracking utilities
├── prefetch/
│   └── index.ts             -> Barrel: firePrefetch, prefetchNextPage, resolveFromCacheOrFetch
├── security/
│   └── ARCHITECTURE.md      -> Security helpers (CSP nonce parsing)
├── storage/
│   └── ARCHITECTURE.md      -> Cookie/localStorage read/write utilities
├── theme/
│   └── ARCHITECTURE.md      -> Theme cookie read/write helpers
├── typeGuards/
│   └── ARCHITECTURE.md      -> Shared runtime type guards (isObject)
└── urlState/
    └── ARCHITECTURE.md      -> URL compact state serialization
```

## Dependency Overview

```mermaid
graph TD
  API[api/]
  Comparison[comparison/]
  Filters[filters/]
  Formatters[formatters/]
  Logger[logger/]
  Performance[performance/]
  Prefetch[prefetch/]
  Security[security/]
  Storage[storage/]
  Theme[theme/]
  URLState[urlState/]

  API --> Constants[API constants]
  Filters --> TableTypes[Table types]
  Logger --> EnvVars[import.meta.env.VITE_LOG_LEVEL]
  Prefetch --> UITypes[PrefetchCache, Pagination types]
  URLState --> TableTypes
  URLState --> FilterTypes[Filter operator types]
  Theme --> ThemeTypes[Theme types]
```

## Subfolder Documentation

| Folder        | Description                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/`        | `getApiBaseUrl` — SSR/client-aware API base URL resolver                                                                                      |
| `comparison/` | `areArraysEqual` for ordered array equality plus `shallowEqual` for one-level object comparison                                               |
| `filters/`    | `createStaticFilterOptions` — static array → Table filter contract                                                                            |
| `formatters/` | `formatDate`, `formatCurrency`, `formatNumber`, `parseDate`, etc.                                                                             |
| `logger/`     | `createLogger`, `logger` — level-filtered, tree-shakeable app logging                                                                         |
| `prefetch/`   | `resolveFromCacheOrFetch`, `firePrefetch` — generic prefetch cache resolution and ref-applied prefetch firing; _internal:_ `prefetchNextPage` |
| `security/`   | `getRequestCspNonce` — standardized `x-csp-nonce` request header parser                                                                       |
| `storage/`    | `readFromCookie`, `writeToCookie`, `writeToLocalStorage`; _internal:_ `parseCookies`                                                          |
| `theme/`      | `getThemeFromCookie` (`getThemeFromCookie.util.ts`), `setThemeCookie` (`setThemeCookie.util.ts`)                                              |
| `typeGuards/` | `isObject` — shared non-null object guard used by services and cookie/payload validators                                                      |
| `urlState/`   | `encodeStateToURL`, `decodeStateFromURL`, `readTableStateFromURL`                                                                             |
