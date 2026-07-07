# ADR-024: User/role management UI + per-instance grants editor

**Status:** Accepted

## Context

Phase-3 requirement (interview decision 7, "full scope this phase
including user/role management UI"): the RBAC foundation (0008/ADR-017 —
users, roles, permissions, role_permissions, user_roles, resource_grants,
`fn_assert_permission`) gets its management surface: admin pages for
users and roles, a per-instance grants editor on the project page, and
the password-rotation flow the seeded admin default has been waiting for.

## Decision

### 1. Management functions + views (migration 0016)

The RBAC tables gain read views (`v_roles`, `v_permissions`,
`v_user_roles`, `v_role_permissions`, `v_resource_grants` — none existed)
and p_user_id-first write functions: `fn_create_user` / `fn_update_user`
/ `fn_set_user_password` / `fn_replace_user_roles`, `fn_create_role` /
`fn_update_role` / `fn_replace_role_permissions`,
`fn_create_resource_grant` / `fn_delete_resource_grant` (soft delete —
grants carry full audit). Beyond the usual permission asserts, the
functions carry **lockout guards** that pure permission checks cannot
express: you cannot disable your own account, strip your own admin role,
disable or re-permission the seeded admin role, disable the system
account, or make the system account loginable. Username and role_name
are immutable natural keys (the guards reference them; the admin routes
are keyed by them). Replace-style writes validate every id in the
requested set and reject unknowns explicitly.

**Self-service password change needs no role permission**:
`fn_set_user_password` allows p_user_id = target for any enabled user —
that is the "change the default admin password" flow (ADR-017's flagged
default) without granting viewers any user-management power. Password
hashing (scrypt) stays inside packages/scan-ingestion
(`createUser`/`setUserPassword` hash internally); hashes never cross the
package boundary in either direction.

### 2. Query layer

One util per management operation under `queries/` (auto-exported), plus
list/read utils (`getUserListView`, `getUserWithRoles`,
`getRoleListView`, `getRoleWithPermissions`, `getAllPermissions`,
`getProjectGrants`). Route gating reuses the EXISTING
`checkUserPermission` (ADR-017's non-throwing face of
fn_assert_permission — rediscovered after almost duplicating it; its
`{allowed, reason}` shape carries the DB's own message into the 403).

### 3. UI (`/cqms/admin/users`, `/cqms/admin/roles`)

Both lists follow the scanners-list convention (ADR-023): Table **crud
metadata** with the natural key (`username` / `role_name`) as the
`isPrimaryKey` column — create/view/edit navigation comes entirely from
the Table. No crud delete: users and roles soft-retire via enabled.
Forms follow new/edit-project (shared Form, Zod-in-action, typed field
errors; role/permission multi-selects stream via the
TriggerScanForm `use()` contract). The user editor covers display name,
enabled, role set and an optional new password; the role editor covers
description, enabled and the permission matrix (multi-select of
action × resource type).

Route access is gated by `requirePermission` (requireUser →
checkUserPermission → 403 with the DB's reason) — route-level ONLY, the
write functions still assert inside Postgres. Loaders gate on
read/create/update of `user`/`role` respectively, so the pages 403 for
non-admins (verified live).

### 4. Grants editor on project detail

An "Access Grants" section on the project page (admin-only: the loader
checks `update` on `project` — the same permission
fn_create_resource_grant requires — and ships no user/grant data
otherwise). Fetcher forms post `grant-add` / `grant-delete` intents to
the project-detail action; options are a curated list ("Trigger scans"
= execute:scan — exactly the tuple `fn_create_run` asserts (0009) —
"Ingest scan results" = update:scan, "Edit project" = update:project),
each with resource_id = the project uuid. Read grants are deliberately
absent: list reads are not per-instance gated today.

The trigger-scan action now catches fn_create_run's typed rejection and
renders it as a field error — found live when the viewer's denied POST
hit the 500 boundary instead of the form (the error message was right,
the surface was wrong).

## Verification performed

- Suites green: scan-ingestion **176/176** (6 new: a real-DB management
  flow test covering create→login, viewer read-only denials, the
  per-instance execute/scan grant opening exactly one door and closing on
  revoke, self-service + admin password rotation, every lockout guard,
  and custom-role permission assignment with unknown-id rejection);
  admin_system **25/25**; lint + typecheck clean; migration 0016 applied
  to live `cqms_db`.
- **Live UI E2E** (real HTTP against the dev server): admin created
  `zz-e2e-viewer` (viewer role) through the real form → the viewer logged
  in, got **403** on both admin pages, **200** on the read-only project
  list, and a **typed "Permission denied" field error** on trigger-scan;
  admin added the execute:scan grant through the grants panel → the
  viewer's retry created a real run (302 to the run page); admin rotated
  the viewer's password via edit-user → old password re-renders the login
  form, new password logs in; grant revoked through the panel (0 active
  grants). E2E artifacts fully cleaned (run, grants, user).
