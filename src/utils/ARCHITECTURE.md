# Utils Architecture

Shared utility layer for formatting, URL state encoding/decoding, storage,
performance instrumentation, and environment-aware API URL resolution.

## Folder Structure

```
utils/
├── ARCHITECTURE.md                     -> This overview
├── index.ts                            -> Root barrel (currently exports shallowEqual)
├── api.ts                              -> API base URL resolution
├── createStaticFilterOptions.util.ts   -> Static filter options adapter
├── shallowEqual.util.ts                -> Shallow object equality helper
├── theme-cookie.util.ts                -> Theme cookie parse/read/write helpers
├── formatters/
│   └── ARCHITECTURE.md                 -> Detailed formatter utilities
├── storage/
│   └── ARCHITECTURE.md                 -> Cookie/localStorage utilities
├── performance/
│   └── ARCHITECTURE.md                 -> Render tracking utilities
└── urlState/
    └── ARCHITECTURE.md                 -> URL compact state serialization
```

## Dependency Overview

```mermaid
graph TD
  Utils[Utils folder]
  API[API utility]
  StaticFilters[Static filter options utility]
  Shallow[Shallow equal utility]
  ThemeCookie[Theme cookie utility]
  Formatters[Formatters utilities]
  Storage[Storage utilities]
  Perf[Performance utilities]
  URLState[URL state utilities]

  Utils --> API
  Utils --> StaticFilters
  Utils --> Shallow
  Utils --> ThemeCookie
  Utils --> Formatters
  Utils --> Storage
  Utils --> Perf
  Utils --> URLState

  API --> Constants[API constants]
  StaticFilters --> TableTypes[Table types]
  URLState --> TableTypes
  URLState --> FilterTypes[Filter operator types]
  ThemeCookie --> ThemeTypes[Theme types]
  Storage --> ThemeCookie
```

## Top-Level Utilities

### api.ts

Resolves API base URL through prioritized environment-aware strategies:

1. Request URL (SSR source of truth)
2. `VITE_API_URL`
3. SSR default localhost API host
4. Client-side hostname/protocol logic (dev proxy, private IPs, prod config)

```mermaid
flowchart TD
  A[Get API base URL] --> B{Request URL provided}
  B -- yes --> C[Parse URL]
  C --> D{Hostname is local private IP}
  D -- yes --> E[Return CONFIG.localhost.apiHost]
  D -- no --> F[Return protocol + hostname + /api]

  B -- no --> G{Environment API URL set}
  G -- yes --> H[Return env URL]
  G -- no --> I{Running on server}
  I -- yes --> J[Return CONFIG.localhost.apiHost]
  I -- no --> K{Development mode}
  K -- yes --> L[Return /api]
  K -- no --> M{Hostname is local private IP}
  M -- yes --> N[Return localhost config or protocol + ip + :3001/api]
  M -- no --> O[Return protocol + hostname + CONFIG.prod.apiHost]
```

Notes:

- Uses `isLocalIp` helper to detect localhost/private network ranges.
- Handles malformed request URL by falling through gracefully.

### createStaticFilterOptions.util.ts

Adapts static arrays to the async table filter-options contract.

```mermaid
flowchart TD
  A[Create static filter options] --> B[Return object with three functions]
  B --> C[fetchFilterOptions with skip and limit]
  C --> D[Sliced values: values.slice(skip, skip + limit)]
  D --> E[Resolve Promise with values + hasMore]
  B --> F[Filter options data selector]
  B --> G[filterOptionsDataTotalSelector with hasMore logic]
```

Notes:

- Preserves the same API contract as server-backed filter option fetchers.
- Supports pagination semantics for UI consistency.

### shallowEqual.util.ts

Performs shallow equality checks for object snapshots.

```mermaid
flowchart TD
  A[Shallow equal check] --> B{Same reference}
  B -- yes --> C[true]
  B -- no --> D{Either undefined}
  D -- yes --> E[false]
  D -- no --> F[Compare key counts]
  F --> G{Lengths equal}
  G -- no --> H[false]
  G -- yes --> I[Iterate keysA]
  I --> J{Other object has key and same value}
  J -- no --> K[false]
  J -- yes --> L{More keys}
  L -- yes --> I
  L -- no --> M[true]
```

Notes:

- Used by store/state layers to avoid unnecessary update notifications.
- Intentionally shallow: nested object differences require higher-level logic.

### theme-cookie.util.ts

Provides theme cookie parsing, reading, and writing (`light`/`dark`).

```mermaid
flowchart TD
  subgraph ReadPath
    A[Get theme from cookie header] --> B{Cookie header present}
    B -- no --> C[undefined]
    B -- yes --> D[parseCookies(cookieHeader)]
    D --> E[Read theme cookie]
    E --> F{Theme is dark or light}
    F -- yes --> G[Return ThemeMode]
    F -- no --> H[undefined]
  end

  subgraph WritePath
    I[Set theme cookie] --> J{Document exists}
    J -- no --> K[Return]
    J -- yes --> L[Compute max-age]
    L --> M[document.cookie = theme cookie string]
  end
```

Notes:

- `parseCookies` safely parses `name=value` pairs including values containing `=`.
- `setThemeCookie` has SSR guard and uses `SameSite=Lax`.

## Subfolder Documentation

- `formatters/ARCHITECTURE.md`
- `storage/ARCHITECTURE.md`
- `performance/ARCHITECTURE.md`
- `urlState/ARCHITECTURE.md`
