# Artifact Inventory (`apps/react-router`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@repo/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). API-layer (browser fetch) and Postgres-access utilities live in `@repo/data-access` (`packages/data-access/src/`). This file tracks only artifacts genuinely local to this app.

---

## Routes

| Route                  | Location                     | Description                                                                                                                        |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/_api/filter-options` | `routes/api/filter-options/` | Resource route for `transport: 'loader'` filter-option descriptors (ADR-009); its loader calls the BFF `/api/distinct` server-side |
| `/wide-alltypes-150`   | `routes/wide-alltypes-150/`  | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation                                 |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
