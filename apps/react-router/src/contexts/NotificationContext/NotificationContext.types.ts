import type { ReactNode } from 'react';

import type { CardColor } from '@/components/Card';
import type { TStore } from '@/hooks';

export type AppNotification = {
  readonly durationMs: number;
  readonly id: string;
  readonly message: string;
  readonly placement: NotificationPlacement;
  readonly title?: string;
  readonly variant: CardColor;
};

export type NotificationContextValue = {
  readonly notificationsStore: TStore<NotificationState>;
  readonly timeoutMapRef: { readonly current: NotificationTimeoutMap };
};

export type NotificationPlacement =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

export type NotificationProviderProps = {
  readonly children: ReactNode;
  readonly defaultDurationMs?: number;
  readonly defaultPlacement?: NotificationPlacement;
};

export type NotificationState = {
  readonly defaultDurationMs: number;
  readonly defaultPlacement: NotificationPlacement;
  readonly notifications: readonly AppNotification[];
};

export type NotifyArgs = {
  readonly durationMs?: number;
  readonly message: string;
  readonly placement?: NotificationPlacement;
  readonly title?: string;
  readonly variant?: CardColor;
};

type NotificationTimeoutMap = Map<string, ReturnType<typeof setTimeout>>;
