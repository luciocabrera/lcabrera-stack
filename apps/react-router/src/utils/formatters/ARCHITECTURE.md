# Formatters Utils Architecture

Locale-safe, SSR-consistent formatting helpers for numbers, currency, and dates.

## File Structure

```
formatters/
├── ARCHITECTURE.md
├── index.ts
├── formatters.constants.ts
├── getDefaultLocale.util.ts
├── getDateTimeFormatOptions.util.ts
├── parseDate.util.ts
├── formatDate.util.ts
├── formatCurrency.util.ts
└── formatNumber.util.ts
```

## Dependency Graph

```mermaid
graph TD
  Index[index.ts] --> Date[formatDate.util.ts]
  Index --> Currency[formatCurrency.util.ts]
  Index --> Number[formatNumber.util.ts]

  Date --> ParseDate[parseDate.util.ts]
  Date --> Locale[getDefaultLocale.util.ts]
  Date --> DateOpts[getDateTimeFormatOptions.util.ts]
  Date --> Constants[formatters.constants.ts]

  Currency --> Locale
  Currency --> Constants

  Number --> Locale
```

## Utilities

### formatters.constants.ts

Defines module defaults:

- `DEFAULT_LOCALE = 'en-US'`
- `DEFAULT_CURRENCY = 'USD'`
- `DEFAULT_DATE_PRESET = 'medium'`

```mermaid
flowchart TD
  A[formatters.constants.ts] --> B[DEFAULT_LOCALE]
  A --> C[DEFAULT_CURRENCY]
  A --> D[DEFAULT_DATE_PRESET]
```

### getDefaultLocale.util.ts

Returns deterministic locale default to avoid SSR/client hydration mismatches.

```mermaid
flowchart TD
  A[Get default locale] --> B[Return default locale]
```

### getDateTimeFormatOptions.util.ts

Maps date preset names to `Intl.DateTimeFormatOptions`.

```mermaid
flowchart TD
  A[Get date time format options] --> B{Preset value}
  B -- full --> C[Return date style full]
  B -- long --> D[Return date style long]
  B -- medium --> E[Return date style medium]
  B -- short --> F[Return date style short]
```

### parseDate.util.ts

Normalizes unknown date-like input into a valid `Date` or returns `undefined`.

```mermaid
flowchart TD
  A[Parse date input] --> B{Value is Date}
  B -- yes --> C[Return value]
  B -- no --> D{Value is string or number}
  D -- no --> E[undefined]
  D -- yes --> F[Create date from value]
  F --> G{Valid timestamp}
  G -- yes --> H[Return Date]
  G -- no --> I[undefined]
```

### formatDate.util.ts

Formats unknown value as localized date string with safe fallbacks.

```mermaid
flowchart TD
  A[Format date input] --> B[Parse date input]
  B --> C{Date exists}
  C -- no --> D{Value is string}
  D -- yes --> E[Return original string]
  D -- no --> F[Return empty string]

  C -- yes --> G[Resolve locale and preset defaults]
  G --> H[Get date time format options]
  H --> I{Intl format succeeds}
  I -- yes --> J[Return formatted date]
  I -- no --> K[Return local date string]
```

Key behavior:

- Accepts `unknown` input and defends against invalid date values.
- Preserves incoming string when parsing fails (useful for opaque backend values).

### formatCurrency.util.ts

Formats number as currency and normalizes symbol/sign output.

```mermaid
flowchart TD
  A[Format currency value] --> B[Resolve locale and currency]
  B --> C{Intl currency format succeeds}
  C -- no --> D[Return currency fallback string]
  C -- yes --> E[Get formatted string]
  E --> F[Regex normalize minus and spacing]
  F --> G[Return normalized currency string]
```

Normalization rules:

- Moves leading minus after currency symbol when needed.
- Ensures a space between symbol and numeric sign/value.

### formatNumber.util.ts

Formats number with optional precision controls.

```mermaid
flowchart TD
  A[Format number value] --> B[Resolve locale]
  B --> C[Build Intl options from defined digits]
  C --> D{Intl number format succeeds}
  D -- yes --> E[Return formatted number]
  D -- no --> F[Return number as string]
```

Key behavior:

- Omits undefined fraction digit options to avoid unintended defaults.
- Gracefully degrades when Intl fails.

## Barrel Exports

`index.ts` exports only the public formatter entry points:

- `formatCurrency`
- `formatDate`
- `formatNumber`
