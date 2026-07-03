# API Utility Architecture

Resolves the correct API base URL and provides shared request helpers for use in loaders, actions, and client-side code across SSR and development environments.

## File

| File                                | Description                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `api.util.ts`                       | Exports `getApiBaseUrl(requestUrl?)` — resolves the API base URL                             |
| `buildPaginatedQueryParams.util.ts` | Builds `limit`/`skip`/`sort`/`filter` `URLSearchParams` shared by paginated service fetchers |
| `fetchAndValidate.util.ts`          | Fetches a URL, asserts OK, parses JSON, and validates the body shape via a type guard        |
| `fakeDelay.util.ts`                 | Simulated network latency helper for mock data paths                                         |

## Priority Strategy

```mermaid
flowchart TD
  A[getApiBaseUrl called] --> B{requestUrl provided?}
  B -- yes --> C[Parse request URL hostname]
  C --> D{Local / private IP?}
  D -- yes --> E[Return CONFIG.localhost.apiHost]
  D -- no --> F[Return protocol + hostname + /api]
  B -- no --> G{VITE_API_URL env set?}
  G -- yes --> H[Return env URL]
  G -- no --> I{Server-side rendering?}
  I -- yes --> J[Return CONFIG.localhost.apiHost]
  I -- no --> K{Dev mode?}
  K -- yes --> L[Return /api Vite proxy]
  K -- no --> M{Private IP?}
  M -- yes --> N[Return same hostname:3001/api]
  M -- no --> O[Return CONFIG.prod.apiHost]
```

## Consumers

- `src/services/carSales.api.ts`
- `src/services/enterpriseOrders.api.ts`
