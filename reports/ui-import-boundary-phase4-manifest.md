# Phase 4 - UI Import Boundary Manifest (Baseline)

## Purpose

Track current `@repo/ui` import usage across app consumers and drive the staged boundary-enforcement rollout.

Consumers scanned:

- `apps/admin_system/src`
- `apps/react-router/src`

Generated on: 2026-07-14

## Baseline import frequencies (combined)

- 25 `@repo/ui/components/Form`
- 16 `@repo/ui/components/Table/TableLayout`
- 16 `@repo/ui/components/Table`
- 15 `@repo/ui/components/SectionCard`
- 12 `@repo/ui/components/StatusBadge`
- 11 `@repo/ui/components/Table/utils/createEmptyColumnsState.util`
- 7 `@repo/ui/components/Button`
- 7 `@repo/ui/design-system/tokens/base.stylex`
- 6 `@repo/ui/design-system/tokens/colors.stylex`
- 6 `@repo/ui/routing/appendPrimaryKeySorting.util`
- 6 `@repo/ui/routing/sanitizeSorting.util`
- 5 `@repo/ui/components/RouteErrorBoundary`
- 5 `@repo/ui/components/Table/Table.types`
- 5 `@repo/ui/hooks`
- 4 `@repo/ui/components/Icons`
- 4 `@repo/ui/components/NavLink`
- 4 `@repo/ui/components/Table/Table.constants`
- 4 `@repo/ui/routing/readTableLoaderStateFromRequest.util`
- 4 `@repo/ui/routing/shouldRevalidatePersistCookieAction.util`
- 3 `@repo/ui/routing/appendDistinctFilterDescriptors.util`
- 3 `@repo/ui/types/ui.types`
- 3 `@repo/ui/utils/formatters/formatCurrency.util`
- 3 `@repo/ui/utils/typeGuards`
- 2 `@repo/ui/components/AppDocument`
- 2 `@repo/ui/components/AppProviders`
- 2 `@repo/ui/components/AppShell`
- 2 `@repo/ui/components/Card`
- 2 `@repo/ui/components/JsonExplorer`
- 2 `@repo/ui/components/Navbar/Navbar.types`
- 2 `@repo/ui/components/RootErrorBoundary`
- 2 `@repo/ui/components/Settings/Settings.component`
- 2 `@repo/ui/components/Settings/settings.meta`
- 2 `@repo/ui/components/Table/utils`
- 2 `@repo/ui/components/TrendSparkline`
- 2 `@repo/ui/entry/createHandleRequest.util`
- 2 `@repo/ui/entry/hydrateApp.util`
- 2 `@repo/ui/routing/getRootLoaderData.util`
- 2 `@repo/ui/routing/persistCookie.action`
- 2 `@repo/ui/utils/logger`
- 1 `@repo/ui/components/MarkdownRenderer`
- 1 `@repo/ui/components/SidePanel`
- 1 `@repo/ui/components/Table/contexts/TableConfig/utils`
- 1 `@repo/ui/components/Table/utils/inferTableColumnsFromJson.util`
- 1 `@repo/ui/components/Tabs`
- 1 `@repo/ui/components/VirtualList`
- 1 `@repo/ui/components/VirtualSelect`
- 1 `@repo/ui/contexts/NotificationContext`
- 1 `@repo/ui/contexts/NotificationContext/actions`
- 1 `@repo/ui/contexts/NotificationContext/selectors`
- 1 `@repo/ui/design-system/constants`
- 1 `@repo/ui/hooks/useTheme.hook`
- 1 `@repo/ui/types/globalSettings.types`
- 1 `@repo/ui/types/theme.types`
- 1 `@repo/ui/utils/filters`
- 1 `@repo/ui/utils/formatters/formatDate.util`

## Classification for rollout

### Promote to root `@repo/ui`

- Core app shell and entry helpers (`AppProviders`, `AppShell`, `AppDocument`, `createHandleRequest`, `hydrateApp`)
- Route-level primitives (`TableLayout`, `Form`, `SectionCard`, `StatusBadge`, `Button`, `NavLink`, `RouteErrorBoundary`, `RootErrorBoundary`, `JsonExplorer`, `Tabs`, `TrendSparkline`, `MarkdownRenderer`)
- High-traffic shared types (`FieldNode`, `FieldErrors`, `TableColumn`, `SortingState`, `LayoutProps`, `Pagination`, `NavbarItemConfig`)
- Stable routing helpers (`getRootLoaderData`, `persistCookie.action`, `shouldRevalidatePersistCookieAction`)

### Temporary deep-import exceptions

- Deep Table internals/utilities (for example `createEmptyColumnsState.util`, `inferTableColumnsFromJson.util`, table context utilities)
- Style token imports under `@repo/ui/design-system/tokens/*`
- Settings route module wiring via `Settings.component` and `settings.meta`

### Forbidden deep imports (Phase 4 start)

- `@repo/ui/src/**` direct source internals
- `@repo/ui/**/index` and `@repo/ui/**/index.*` direct index file imports
- `@repo/ui/**/*.component` direct implementation-file imports, except temporary settings route exception

## Enforcement status

- Shared lint boundary rule added in `packages/vite-configs/eslint.custom-rules.shared.config.mjs`.
- Current enforcement includes the forbidden patterns listed above.
- Temporary exception retained for `@repo/ui/components/Settings/Settings.component`.

## Implementation progress

Completed in this wave:

- Added package root export surface in `packages/ui/package.json` with `"exports"` map including `"."` -> `./src/public-api.ts`.
- Added initial root public barrel `packages/ui/src/public-api.ts`.
- Migrated first consumer imports to root `@repo/ui` in:
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
- Migrated additional consumer imports to root `@repo/ui` in:
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
