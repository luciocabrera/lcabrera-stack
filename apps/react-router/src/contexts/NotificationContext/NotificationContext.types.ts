import type { ReactNode } from 'react';

import type { CardColor } from '@/components/Card';

export type AppNotification = {
  readonly durationMs: number;
  readonly id: string;
  readonly message: string;
  readonly placement: NotificationPlacement;
  readonly title?: string;
  readonly variant: CardColor;
};

export type NotificationContextValue = {
  readonly dismissNotification: (id: string) => void;
  readonly dismissNotifications: () => void;
  readonly notifications: readonly AppNotification[];
  readonly notify: (args: NotifyArgs) => string;
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

export type NotifyArgs = {
  readonly durationMs?: number;
  readonly message: string;
  readonly placement?: NotificationPlacement;
  readonly title?: string;
  readonly variant?: CardColor;
};
