# Settings Route Architecture

Settings route for global, cross-table user preferences.

## Purpose

Provides a central place to configure app-level preferences that apply to every table instance.

## Current Responsibility

- Render tabbed global preference controls (Pinning + Navigation).
- Manage global navigation size preference (`compact`, `small`, `medium`, `large`).
- Keep `medium` as the default when no persisted navigation size exists.
- Stage local draft changes until explicit user confirmation.
- Persist changes through GlobalSettingsContext actions only on `Accept`.
- Revert staged draft values back to persisted values on `Cancel`.

## Scope Boundary

- Settings here are global/system-level, not table-specific.
- Table-specific state (filters, order, pinning slices) remains in table persistence.
- Global navigation sizing is persisted here and consumed by `AppNavigation`.
- Runtime pin/unpin prompt answers do not persist global preferences.
- `Always ask` remains a settings-only preference value and is not shown in runtime prompt modals.
