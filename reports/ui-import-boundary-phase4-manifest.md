# Phase 4 - UI Import Boundary Manifest (Baseline)

## Purpose

Track current `@lcabrera/ui` import usage across app consumers and drive the staged boundary-enforcement rollout.

Consumers scanned:

- `apps/admin_system/src`
- `apps/react-router/src`

Generated on: 2026-07-14

## Baseline import frequencies (combined)

- 25 `@lcabrera/ui/components/Form`
- 16 `@lcabrera/ui/components/Table/TableLayout`
- 16 `@lcabrera/ui/components/Table`
- 15 `@lcabrera/ui/components/SectionCard`
- 12 `@lcabrera/ui/components/StatusBadge`
- 11 `@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util`
- 7 `@lcabrera/ui/components/Button`
- 7 `@lcabrera/ui/design-system/tokens/base.stylex`
- 6 `@lcabrera/ui/design-system/tokens/colors.stylex`
- 6 `@lcabrera/ui/routing/appendPrimaryKeySorting.util`
- 6 `@lcabrera/ui/routing/sanitizeSorting.util`
- 5 `@lcabrera/ui/components/RouteErrorBoundary`
- 5 `@lcabrera/ui/components/Table/Table.types`
- 5 `@lcabrera/ui/hooks`
- 4 `@lcabrera/ui/components/Icons`
- 4 `@lcabrera/ui/components/NavLink`
- 4 `@lcabrera/ui/components/Table/Table.constants`
- 4 `@lcabrera/ui/routing/readTableLoaderStateFromRequest.util`
- 4 `@lcabrera/ui/routing/shouldRevalidatePersistCookieAction.util`
- 3 `@lcabrera/ui/routing/appendDistinctFilterDescriptors.util`
- 3 `@lcabrera/ui/types/ui.types`
- 3 `@lcabrera/ui/utils/formatters/formatCurrency.util`
- 3 `@lcabrera/ui/utils/typeGuards`
- 2 `@lcabrera/ui/components/AppDocument`
- 2 `@lcabrera/ui/components/AppProviders`
- 2 `@lcabrera/ui/components/AppShell`
- 2 `@lcabrera/ui/components/Card`
- 2 `@lcabrera/ui/components/JsonExplorer`
- 2 `@lcabrera/ui/components/Navbar/Navbar.types`
- 2 `@lcabrera/ui/components/RootErrorBoundary`
- 2 `@lcabrera/ui/components/Settings/Settings.component`
- 2 `@lcabrera/ui/components/Settings/settings.meta`
- 2 `@lcabrera/ui/components/Table/utils`
- 2 `@lcabrera/ui/components/TrendSparkline`
- 2 `@lcabrera/ui/entry/createHandleRequest.util`
- 2 `@lcabrera/ui/entry/hydrateApp.util`
- 2 `@lcabrera/ui/routing/getRootLoaderData.util`
- 2 `@lcabrera/ui/routing/persistCookie.action`
- 2 `@lcabrera/ui/utils/logger`
- 1 `@lcabrera/ui/components/MarkdownRenderer`
- 1 `@lcabrera/ui/components/SidePanel`
- 1 `@lcabrera/ui/components/Table/contexts/TableConfig/utils`
- 1 `@lcabrera/ui/components/Table/utils/inferTableColumnsFromJson.util`
- 1 `@lcabrera/ui/components/Tabs`
- 1 `@lcabrera/ui/components/VirtualList`
- 1 `@lcabrera/ui/components/VirtualSelect`
- 1 `@lcabrera/ui/contexts/NotificationContext`
- 1 `@lcabrera/ui/contexts/NotificationContext/actions`
- 1 `@lcabrera/ui/contexts/NotificationContext/selectors`
- 1 `@lcabrera/ui/design-system/constants`
- 1 `@lcabrera/ui/hooks/useTheme.hook`
- 1 `@lcabrera/ui/types/globalSettings.types`
- 1 `@lcabrera/ui/types/theme.types`
- 1 `@lcabrera/ui/utils/filters`
- 1 `@lcabrera/ui/utils/formatters/formatDate.util`

## Classification for rollout

### Promote to root `@lcabrera/ui`

- Core app shell and entry helpers (`AppProviders`, `AppShell`, `AppDocument`, `createHandleRequest`, `hydrateApp`)
- Route-level primitives (`TableLayout`, `Form`, `SectionCard`, `StatusBadge`, `Button`, `NavLink`, `RouteErrorBoundary`, `RootErrorBoundary`, `JsonExplorer`, `Tabs`, `TrendSparkline`, `MarkdownRenderer`)
- High-traffic shared types (`FieldNode`, `FieldErrors`, `TableColumn`, `SortingState`, `LayoutProps`, `Pagination`, `NavbarItemConfig`)
- Stable routing helpers (`getRootLoaderData`, `persistCookie.action`, `shouldRevalidatePersistCookieAction`)

### Temporary deep-import exceptions

- Deep Table internals/utilities (for example `createEmptyColumnsState.util`, `inferTableColumnsFromJson.util`, table context utilities)
- Style token imports under `@lcabrera/ui/design-system/tokens/*`
- Settings route module wiring via `Settings.component` and `settings.meta`

### Forbidden deep imports (Phase 4 start)

- `@lcabrera/ui/src/**` direct source internals
- `@lcabrera/ui/**/index` and `@lcabrera/ui/**/index.*` direct index file imports
- `@lcabrera/ui/**/*.component` direct implementation-file imports, except temporary settings route exception

## Enforcement status

- Shared lint boundary rule added in `packages/vite-configs/eslint.custom-rules.shared.config.mjs`.
- Current enforcement includes the forbidden patterns listed above.
- Temporary exception retained for `@lcabrera/ui/components/Settings/Settings.component`.

## Implementation progress

Completed in this wave:

- Added package root export surface in `packages/ui/package.json` with `"exports"` map including `"."` -> `./src/public-api.ts`.
- Added initial root public barrel `packages/ui/src/public-api.ts`.
- Migrated first consumer imports to root `@lcabrera/ui` in:
  - `apps/admin_system/src/entry.server.tsx`
  - `apps/admin_system/src/entry.client.tsx`
  - `apps/react-router/src/entry.server.tsx`
  - `apps/react-router/src/entry.client.tsx`
  - `apps/admin_system/src/root/Root.component.tsx`
  - `apps/react-router/src/root/Root.component.tsx`
  - `apps/admin_system/src/routes/cqms/cqms.errorBoundary.tsx`
  - `apps/react-router/src/routes/car-sales/car-sales.errorBoundary.tsx`
  - `apps/admin_system/src/routes/cqms/Cqms.component.tsx` (TableLayout only)
  - `apps/admin_system/src/routes/login/Login.component.tsx`

Completed in the latest migration wave:

- Expanded `packages/ui/src/public-api.ts` with additional promoted symbols:
  - `AppDocument`, `RootErrorBoundary`, `Button`, `JsonExplorer`, `NavLink`,
    `StatusBadge`, `Tabs`
  - exported types `LayoutProps`, `Pagination`
- Migrated additional consumer imports to root `@lcabrera/ui` in:
  - `apps/admin_system/src/root/Root.layout.tsx`
  - `apps/react-router/src/root/Root.layout.tsx`
  - `apps/admin_system/src/root/Root.errorBoundary.tsx`
  - `apps/react-router/src/root/Root.errorBoundary.tsx`
  - `apps/admin_system/src/routes/cqms/scan-detail/ScanDetail.component.tsx`
  - `apps/admin_system/src/routes/cqms/run-detail/RunDetail.component.tsx`
  - `apps/admin_system/src/routes/cqms/project-detail/ProjectDetail.component.tsx`
  - `apps/admin_system/src/routes/cqms/scanner-detail/ScannerDetail.component.tsx`
  - `apps/admin_system/src/routes/cqms/users/Users.component.tsx`
  - `apps/react-router/src/routes/enterprise-orders/EnterpriseOrders.component.tsx`
  - `apps/react-router/src/features/showcase/ShowcasePage/TableSection/TableSection.component.tsx`

Validation status after migration:

- `packages/ui`: `vp lint .` and `vp check` passed.
- `apps/admin_system`: `vp lint .` and `vp check` passed.
- `apps/react-router`: `vp lint .` and `vp check` passed.

## Next actions

1. Finish root-export migration in app consumers.
2. Shrink temporary deep-import exceptions.
3. Expand forbidden pattern set (for example selected `*.util` deep paths) once equivalent root exports are adopted.
