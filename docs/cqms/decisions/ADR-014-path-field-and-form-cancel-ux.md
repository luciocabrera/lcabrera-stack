# ADR-014: Browsable `path` Form field + built-in Form Cancel/discard-changes flow

**Status:** Accepted

## Context

Two follow-up UX requests against CQMS's `new-project`/`edit-project` forms
(built in ADR-013):

1. `localPath` was a plain text input — the user has to know and type an
   absolute filesystem path by hand. Requested: something that lets the
   user _select_ the path, built as a genuinely reusable `Form` field type
   (not a CQMS-local one-off).
2. Every form needs an Accept/Cancel button pair, where Cancel returns the
   user to wherever they came from (or the entity's list route if there's
   no valid in-app place to return to), with a confirmation prompt if
   leaving would discard unsaved changes — and Accept should stay a no-op
   against the API when nothing changed.

Both decisions were confirmed with the user before implementation:

- **Directory browsing is deliberately unscoped** — no root sandbox. This
  is an internal tool for registering local repos that can live anywhere
  on the machine ("the user could have its code anywhere in their
  device"), so a restricted browse root would just get in the way. A
  security-review-driven task might revisit this; this ADR records it as
  a conscious product choice, not an oversight.
- **Accept/Cancel is `create`/`edit`'s default pair**, but per-form labels
  stay overridable — `trigger-scan` keeps "Start Scan" rather than a
  generic "Accept" since it's action-shaped, not CRUD-shaped.

## Decision

### 1. New `path` field type — `PathField` + `PathBrowserModal`

`Form.types.ts` gains `PathFieldDef<TValues>` (`BaseFieldDef` + `type:
'path'` + `browseAction: string`), added to the `LeafFieldDef` union and
registered in `FormField.constants.ts`'s `fieldRegistry` like every other
leaf type — no special-casing elsewhere (`flattenFields`/`getInitialValues`/
`validateFields` all already dispatch on `default:`/`typeof value`, not an
exhaustive `field.type` switch, so `path` needed no changes there).

`PathField.component.tsx` renders a real, editable `<input type="text">`
(so a known path can still be typed or pasted directly — the picker is a
convenience, not the only way in) plus a "Browse…" icon button that opens
`PathBrowserModal`, a small `Modal`-based directory drill-down:
breadcrumb-free (an "Up" button + the current path shown as text),
fetches its listing via `useFetcher().load(...)` against `browseAction`,
lets the user click into subdirectories, and "Select This Folder" writes
the currently-browsed path back into the field via the same
`useSetFieldValue` every other leaf field uses.

**`browseAction` is a URL string, not a callback** — the same reason
`Table`'s runtime columns and `Form`'s own `fields` stay data-agnostic
(ADR-005/TECH_SPEC §2.10): `PathField` doesn't know or care which app's
resource route it's hitting, only that the route matches
`BrowseDirectoryResult`'s contract. This is what makes the field
genuinely reusable across projects, per the explicit ask, rather than a
CQMS-specific "browse a project path" widget.

### 2. Directory listing is a shared, framework-server-only loader

`packages/ui/src/routing/browseDirectory.loader.ts` (+ `.types.ts`) — a
real Node `fs.promises.readdir` against `url.searchParams.get('path')`
(defaulting to `os.homedir()`), returning `{ entries, parentPath, path,
error? }`. Lives in `packages/ui/src/routing/` alongside
`persistCookie.action.ts` — that directory is already established as
"server-only loader/action logic shared across apps," not a
component-only package boundary; this loader never reaches the client
bundle since it only ever runs inside a `loader` export.

`admin_system`'s `routes/api/browse-directory/root.ts` is a one-line
re-export (`export { loader } from '@repo/ui/routing/browseDirectory.loader'`),
registered at `_action/browse-directory` — the exact same
thin-resource-route pattern `_action/persist-cookie` already established.
Any future app wanting a `path` field gets this for free by adding the
same one-line route file.

### 3. Form's Cancel button becomes built-in, not opt-in

Previously `FormProps.onCancel` was an optional callback — if a consumer
didn't pass one, no Cancel button rendered at all (true of all three
CQMS forms before this ADR). Replaced with a required `cancelTo: string`
prop; `FormBody` now always renders Cancel (whenever the footer renders —
`create`/`edit`, matching Accept) and owns the full navigation decision
itself:

- **No unsaved changes** → `goBack(cancelTo)` immediately.
- **Unsaved changes** (`isDirty` — the exact same computation the submit
  button already uses to gate `edit`-mode submission) → opens a new
  `ConfirmDialog` ("Discard changes?"); "Keep Editing" closes it with no
  navigation, "Discard Changes" proceeds with `goBack(cancelTo)`.

**`useBackNavigate`** (`packages/ui/src/hooks/`) implements "go back if
there's somewhere real to go back to, otherwise go to the fallback":
checks `window.history.state.idx` — react-router's own browser-history
position marker, `0`/absent meaning this page has no earlier entry in
this SPA session (a fresh load, a pasted URL, a bookmark) — and calls
`navigate(-1)` only when `idx > 0`, `navigate(cancelTo)` otherwise. This
is a generic hook, not Form-specific, deliberately placed in `hooks/`
rather than inside `Form/` so any future "Back" affordance can reuse the
same judgment call.

**`ConfirmDialog`** (`packages/ui/src/components/ConfirmDialog/`) is a
plain yes/no `Modal` composition with zero `Form` dependency — reusable
anywhere a destructive/irreversible action needs a second confirmation,
not baked into `Form` as a private delegate.

`submitLabel`'s default changed from `'Save'` to `'Accept'` (per the
explicit "create/edit forms should be Accept, Cancel" instruction).
`new-project`/`edit-project` dropped their explicit `submitLabel`
overrides (`'Register'`/`'Save'`) to pick up the new default;
`trigger-scan` keeps its explicit `'Start Scan'` override, confirming the
"other forms with different work can differ" carve-out.

**"Don't bother the API when nothing changed" was already correct** —
`FormBody`'s existing `isSubmitDisabled = isSubmitting || (mode === 'edit'
&& !isDirty)` already blocks a no-op Accept in edit mode; this ADR didn't
need to touch that logic, only reuse the same `isDirty` value for the
Cancel-confirmation gate.

### `cancelTo` per consumer

- `new-project`/`edit-project` → `/cqms/projects` (the project list — "the
  list of that entity," per the literal fallback description).
- `trigger-scan` → `` `/cqms/projects/view/${projectId}` `` (that
  project's own detail page, not the top-level list — trigger-scan is
  scoped to one project, so its natural "list" is that project's own run
  history).

## Consequences

- `Form`'s public API changed in a breaking way (`onCancel` removed,
  `cancelTo` now required) — acceptable since `Form` has exactly three
  consumers today, all updated in this same change.
- Every future `create`/`edit` form in this repo gets a correct,
  consistent Cancel/discard-changes flow for free, without each route
  hand-rolling its own navigation-plus-confirmation logic.
- The `path` field type and its `browseDirectory` loader are genuinely
  reusable — a future non-CQMS form needing a filesystem path picker adds
  one resource-route re-export, not a new component.

## Verification performed

`tsc -p tsconfig.app.json` (note: `tsc -p tsconfig.json` — the project's
root config, `"files": []` + `references` only — silently typechecks
nothing on its own; `tsconfig.app.json` is the real check), `vp lint`,
`vp fmt`, `vitest run` all clean across `packages/ui` (346 files / 1430
tests, including 3 new `browseDirectory.loader.test.ts` tests against a
real `mkdtempSync` directory — no mocked `fs` — 3 new
`PathBrowserModal.test.tsx` tests exercising the real loader end-to-end
through `createRoutesStub`, 3 new `ConfirmDialog.test.tsx` tests, 3 new
`useBackNavigate.hook.test.ts` tests, and 6 new `Form.test.tsx` cases
covering the full cancel/confirm/discard/keep-editing/default-label
matrix) and `apps/admin_system` (3 files / 15 tests). `apps/react-router`
unaffected (1/1, fmt/typecheck clean). `vp lint` also caught two genuine
`no-floating-promises` warnings (`useBackNavigate`'s `navigate(...)` calls
and `PathBrowserModal`'s `fetcher.load(...)` call) — both are fire-and-
forget by design (navigation and an in-flight fetcher load, neither has a
result this code needs to await), fixed with the `void` operator per the
rule's own suggested fix rather than suppressed.

Live E2E against a running `admin_system` dev server: `curl`'d
`/_action/browse-directory?path=/home/lucio/workspaces` and got back the
real directory listing of this machine's actual workspace folders
(confirming the deliberate no-scoping decision works as intended);
submitted a real `POST /cqms/projects/new` with a real `mktemp`-created
directory and confirmed the row was created (302 to the new project's
detail page); confirmed `/cqms/projects/edit/:id` pre-fills the `path`
field's text input with the real registered path; confirmed both
"Cancel" and "Accept" render in the server-rendered HTML, alongside the
(closed) `ConfirmDialog` markup. Test project row and temp directory
cleaned up afterward.
