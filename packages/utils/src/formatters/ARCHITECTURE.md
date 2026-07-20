# Formatters Utils Architecture

Locale-safe, SSR-consistent formatting helpers for numbers, currency, and dates.
Pure `Intl` wrappers with no React/DOM dependency — they live in `@repo/utils`
(the lowest layer) and are consumed by `@repo/ui` and the apps.

## File Structure

```
formatters/
├── ARCHITECTURE.md
├── format.types.ts
├── formatters.constants.ts
├── get-default-locale.util.ts
├── get-date-time-format-options.util.ts
├── parse-date.util.ts
├── format-date.util.ts
├── format-currency.util.ts
└── format-number.util.ts
```

## Dependency Graph

```mermaid
graph TD
  Date[format-date.util.ts]
  Currency[format-currency.util.ts]
  Number[format-number.util.ts]

  Date --> ParseDate[parse-date.util.ts]
  Date --> Locale[get-default-locale.util.ts]
  Date --> DateOpts[get-date-time-format-options.util.ts]
  Date --> Constants[formatters.constants.ts]

  Currency --> Locale
  Currency --> Constants

  Number --> Locale

  Date --> Types[format.types.ts]
  Currency --> Types
  Number --> Types
  DateOpts --> Types
```

## Utilities

### format.types.ts

Shared `Intl`-formatter option types (`CurrencyFormatOptions`,
`DateFormatOptions`, `DateFormatPreset`, `NumberFormatOptions`) consumed by the
formatters and by `@repo/ui`'s `Table.types`.

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

### get-default-locale.util.ts

Returns deterministic locale default to avoid SSR/client hydration mismatches.

```mermaid
flowchart TD
  A[Get default locale] --> B[Return default locale]
```

### get-date-time-format-options.util.ts

Maps date preset names to `Intl.DateTimeFormatOptions`.

```mermaid
flowchart TD
  A[Get date time format options] --> B{Preset value}
  B -- full --> C[Return date style full]
  B -- long --> D[Return date style long]
  B -- medium --> E[Return date style medium]
  B -- short --> F[Return date style short]
```

### parse-date.util.ts

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

### format-date.util.ts

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

### format-currency.util.ts

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

### format-number.util.ts

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

## Subpath Exports

`@repo/utils` uses **explicit per-file subpath exports** — there is no barrel.
Each helper is imported directly so consumers pull in exactly one:

- `@repo/utils/formatters/format-currency.util`
- `@repo/utils/formatters/format-date.util`
- `@repo/utils/formatters/format-number.util`
- `@repo/utils/formatters/parse-date.util`
- `@repo/utils/formatters/get-date-time-format-options.util`
- `@repo/utils/formatters/get-default-locale.util`
- `@repo/utils/formatters/formatters.constants`
- `@repo/utils/formatters/format.types`
