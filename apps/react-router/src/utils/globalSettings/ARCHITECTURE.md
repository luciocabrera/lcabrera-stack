# Global Settings Utilities Architecture

Utilities for serializing/deserializing global settings to a single cookie key with SSR-safe read support.

## Scope

- Read global settings from cookie string (`Cookie` header) and browser cookies.
- Validate and parse pinning + navigation preference slices from cookie payload,
  including order/pinning conflict defaults.
- Serialize global settings into a versioned JSON payload.
- Share cookie constants used by loader and context actions.
