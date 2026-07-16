# NotificationContext Architecture

Global in-memory notification state managed via an external store pattern (mirrors `GlobalSettingsContext`).

## Purpose

Provide a reusable notification system with:

- app-wide provider scope
- auto-dismiss timers
- manual dismiss actions
- per-notification placement and variant

## Public API (barrel `index.ts`)

- `NotificationProvider` — React provider component
- `AppNotification`, `NotificationPlacement` — shared types

## Context Value

```typescript
{
  notificationsStore: TStore<NotificationState>; // external store
  timeoutMapRef: {
    current: Map<string, ReturnType<typeof setTimeout>>;
  }
}
```

`timeoutMapRef` is exposed alongside the store so action hooks can share the same timer map without re-creating it.

## State Shape (`NotificationState`)

```typescript
{
  defaultDurationMs: number;       // seeded from provider props
  defaultPlacement: NotificationPlacement;
  notifications: readonly AppNotification[];
}
```

## Selectors (`selectors/`)

| Selector              | Returns                      |
| --------------------- | ---------------------------- |
| `useGetNotifications` | `readonly AppNotification[]` |

Selectors subscribe via `useSyncExternalStore` through `useNotificationStore`.

## Actions (`actions/`)

| Action                          | Signature                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `useNotifyAction`               | `() => (args: NotifyArgs) => string` — adds notification, schedules timer, returns ID |
| `useDismissNotificationAction`  | `() => (id: string) => void` — cancels timer, removes notification                    |
| `useDismissNotificationsAction` | `() => () => void` — cancels all timers, clears notifications                         |

## Timer Lifecycle

A `Map<id, timeout>` ref (`timeoutMapRef`) is created in the provider and passed via context.

- `useNotifyAction`: schedules `setTimeout` when `durationMs > 0`; callback filters the store and removes the timer entry
- `useDismissNotificationAction`: calls `clearTimeout` and removes the timer entry
- `useDismissNotificationsAction`: iterates and clears all timeouts, then clears the map
- Provider `useEffect` cleanup: clears all timeouts on unmount

## Internal Files

- `NotificationContext.constants.ts` — defaults and `INITIAL_NOTIFICATION_STATE`
- `useNotificationContextValue.hook.ts` — raw context access with provider guard
- `useNotificationStore.hook.ts` — generic selector hook (`useSyncExternalStore` wrapper)
- `utils/createNotificationId.service.ts` — ID generation (effectful service: clock/crypto/counter)

- On `dismissNotifications` / unmount: clear all timeouts
