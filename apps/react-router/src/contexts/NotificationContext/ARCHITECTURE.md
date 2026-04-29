# NotificationContext Architecture

Global in-memory notification state and actions.

## Purpose

Provide a reusable notification system with:

- app-wide provider scope
- auto-dismiss timers
- manual dismiss actions
- per-notification placement and variant

## Public API

- `NotificationProvider`
- `NotificationContext`
- `useNotificationContextValue`
- types from `NotificationContext.types.ts`

## Internal Files

- `NotificationContext.constants.ts` stores provider defaults
- `createNotificationId.util.ts` stores notification ID generation

## State Shape

`notifications` is a readonly list of `AppNotification` objects.

Each notification includes:

- `id`
- `message`
- optional `title`
- `variant`
- `placement`
- `durationMs`

## Actions

- `notify(args)` creates and schedules a notification
- `dismissNotification(id)` removes one notification and clears its timer
- `dismissNotifications()` clears all notifications and timers

## Timer Lifecycle

A `Map<id, timeout>` tracks auto-dismiss timers.

- On `notify`: schedule timeout when `durationMs > 0`
- On `dismissNotification`: clear timeout for that id
- On `dismissNotifications` / unmount: clear all timeouts
