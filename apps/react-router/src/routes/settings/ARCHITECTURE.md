# Settings Route Architecture

Settings route for global, cross-table user preferences.

## Purpose

Provides a central place to configure app-level preferences that apply to every table instance.

## Current Responsibility

- Render global pinning preference controls.
- Read preference values from GlobalSettingsContext selectors.
- Write preference values through GlobalSettingsContext actions.

## Scope Boundary

- Settings here are global/system-level, not table-specific.
- Table-specific state (filters, order, pinning slices) remains in table persistence.
