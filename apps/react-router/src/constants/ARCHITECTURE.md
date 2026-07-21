# constants/ Architecture

App-wide constant values that are genuinely local to this application.

Most of what this folder used to hold has moved. The API host configuration is
now `@repo/api`'s `config/config.constants.ts` (typed by
`@repo/api/config/config.types`), and the filter-operator, global-settings and
pinning-preference option sets moved to `@repo/ui/constants/` alongside the
components that read them. What remains is the one constant that cannot be
shared: this app's own identity.

## Placement Rule

Use this folder for app-wide, cross-domain constants imported by multiple
features or layers of **this app**.

Keep constants colocated with their domain when they are implementation details
of one feature or utility. And prefer `@repo/ui` or `@repo/utils` when the value
is meaningful to more than one app — a constant two apps need is a shared
artifact, not an app-level one.

Quick decision guide:

- Add to `src/constants` when the constant is shared across domains **and**
  specific to this app.
- Keep it local when it is only meaningful inside one domain module.
- Promote it to a package when a second app would need the same value.

## File Index

| File               | Contents                                     |
| ------------------ | -------------------------------------------- |
| `app.constants.ts` | `APP_ID` — stable per-application identifier |

---

## `app.constants.ts`

`APP_ID` namespaces the persisted cookie and storage keys written by `@repo/ui`.

Because the Table and its settings live in the shared package and are reused
across apps, two apps can legitimately use the same `persistenceKey` (e.g.
`"orders"`). Scoping keys with this id keeps each app's persisted settings
isolated from the other's.

Keep it unique per application and stable over time — changing it invalidates
every previously persisted setting for this app.
