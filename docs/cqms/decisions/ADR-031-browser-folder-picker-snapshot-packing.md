# ADR-031: Browser folder-picker client-side snapshot packing

**Status:** Accepted
**Amends:** ADR-028 (adds a second browser sync channel alongside the raw `.zip`
upload — both POST through the same `sync-upload` action), ADR-029 (the browser
counterpart to the CLI push: same shared ignore-set, same repo-root-relative
POSIX zip keys, but zipping in the browser instead of the CLI).

## Context

Registering a project (ADR-028) leaves the code to arrive via a snapshot sync,
and the browser channel expected the user to hand-craft a `.zip`. The owner
asked (2026-07-14) for the ergonomic path instead: **pick the project folder,
have it packed automatically without `node_modules` (opt-in when a scanner
needs deps)**.

The governing constraint is the hosted, multi-developer model: in a real
deployment the server runs on a different machine than the code and **cannot
read a local path** the user types (this is exactly why ADR-028 dropped
`local_path`); a "server, zip this filesystem path" field would also be an
arbitrary-file-read surface. So the "pick a path → zip" step must run **on the
developer's machine**. Three mechanisms were weighed with the owner: extend the
CLI push (terminal-only), a dev-only server-reads-path field (breaks the hosted
model, security surface), or a **browser folder-picker that zips client-side**.
The owner chose the browser folder-picker — UI-native and production-safe (no
server filesystem access).

## Decision

- **Folder picker.** A file `<input>` with the non-standard `webkitdirectory`
  attribute (absent from `@types/react`, so set via a ref callback —
  `applyWebkitDirectory.util.ts` — not a typed JSX prop). Picking a folder
  yields every file below it with a `webkitRelativePath`.
- **Client-side pack, no server change.** `useFolderSnapshotUpload.hook.ts`
  filters the selection with the shared `IGNORED_DIRECTORIES` set, reads the
  included files, `zipSync`s them (fflate), and POSTs the archive through the
  **existing `sync-upload` action** (ADR-028) as `archive`. The server extractor,
  workspace discovery, and 200 MB cap are reused verbatim.
- **`node_modules` is opt-in; the rest is always excluded.**
  `resolveEffectiveIgnoredDirectories.util.ts` removes only `node_modules` from
  the ignore-set when the checkbox is on; `.git`/`build`/`dist`/`coverage`/… are
  derived or VCS noise and stay excluded regardless.
- **Zip keys are repo-root-relative POSIX paths.** `resolveArchiveEntryKey.util.ts`
  strips the picked-folder prefix that `webkitRelativePath` carries
  (`my-repo/src/x.ts` → `src/x.ts`), matching the CLI packer's `path.relative`
  convention so `extractZipArchive`'s zip-slip guard and `discoverProjectWorkspaces`
  (which reads `pnpm-workspace.yaml` at the extraction root) both resolve
  correctly — a folder-name prefix would nest everything one level too deep.
- **Placement / no drift.** `fflate` is added to `admin_system` for in-browser
  zipping; `IGNORED_DIRECTORIES` gains a subpath export from `scan-ingestion` so
  the packer (CLI, server file-inventory) and the browser share one ignore-set.
  The pure utils + the effect-owning hook are colocated with `ProjectSyncPanel`.
- **The raw `.zip` upload is kept** as a non-destructive fallback.

## Consequences

- A project can be synced from the UI by pointing at a folder — no CLI, no
  hand-made archive — and it works in the hosted model because the server never
  touches the developer's filesystem.
- **Watch-out — browser enumeration.** `webkitdirectory` surfaces _every_ file
  under the picked folder (including a fully-installed `node_modules`) before the
  ignore-filter runs, so a large repo with deps on disk enumerates tens of
  thousands of `File` handles even though their bytes are never read/zipped. The
  CLI push (ADR-029) walks the filesystem and never descends into ignored
  directories, so it stays the efficient channel for big repos.
- **Memory.** Included files are read and zipped in memory (fflate is synchronous
  and in-memory both ends), bounded by the existing 200 MB browser-sync cap;
  true streaming remains deferred (ADR-029).
- **Reuse.** The pack utils + hook are UI-agnostic; wiring the folder picker into
  the create-project form (one-step create + sync) is a straightforward
  follow-up that reuses them as-is.
