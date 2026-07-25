# Global Settings Utilities Architecture

Utilities for serializing/deserializing global settings to a single cookie key with SSR-safe read support.

## Scope

- Read global settings from cookie string (`Cookie` header) and browser cookies.
- Validate and parse pinning + navigation preference slices from cookie payload,
  including order/pinning conflict defaults.
- Serialize global settings into a versioned JSON payload.
- Share cookie constants used by loader and context actions.

## Files

| File                                       | Description                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `getGlobalSettingsFromCookie.util.ts`      | Cookie read + version check; delegates slice parsing to the `to*` converters |
| `serializeGlobalSettingsForCookie.util.ts` | Serialize `GlobalSettingsState` to a versioned JSON payload                  |
| `toGlobalPinningPreferences.util.ts`       | Parse/validate the `pinning` payload slice                                   |
| `toGlobalNavigationPreferences.util.ts`    | Parse/validate the `navigation` payload slice                                |
| `isPinSide.util.ts`                        | Guard: pin side preference                                                   |
| `isPinConflictResolution.util.ts`          | Guard: pin-conflict resolution preference                                    |
| `isOrderConflictResolution.util.ts`        | Guard: order-conflict resolution preference                                  |
| `isUnpinConflictResolution.util.ts`        | Guard: unpin-conflict resolution preference                                  |
| `isNavigationSizePreference.util.ts`       | Guard: navigation size preference                                            |
| `isNavigationCollapsedPreference.util.ts`  | Guard: navigation collapsed/expanded preference                              |
| `globalSettings.constants.ts`              | Cookie key/version + the `*_VALUES` arrays backing every preference guard    |

Each guard's valid-value list lives in `globalSettings.constants.ts`; guards use
the shared `isObject` from `@/utils/typeGuards` for object narrowing. Only
`getGlobalSettingsFromCookie`, `serializeGlobalSettingsForCookie`, and the
cookie key are exposed through the barrel — guards and converters are internal.
