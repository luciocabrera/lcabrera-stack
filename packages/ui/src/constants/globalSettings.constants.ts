import type { RadioOption } from '@lcabrera/ui/components/RadioOptionGroup';
import type { AppNotification } from '@lcabrera/ui/contexts/NotificationContext/NotificationContext.types';
import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationSizePreference,
} from '@lcabrera/ui/types/globalSettings.types';

export const NAVIGATION_SIZE_PREFERENCE_OPTIONS: readonly RadioOption<GlobalNavigationSizePreference>[] =
  [
    {
      description: 'Smallest icons and tightest padding',
      label: 'Compact',
      value: 'compact',
    },
    {
      description: 'Smaller icons and reduced padding',
      label: 'Small',
      value: 'small',
    },
    {
      description: 'Default icon sizes and spacing',
      label: 'Medium',
      value: 'medium',
    },
    {
      description: 'Larger icons and more padding',
      label: 'Large',
      value: 'large',
    },
  ];

export const NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS: readonly RadioOption<GlobalNavigationCollapsedPreference>[] =
  [
    {
      description: 'Navigation bar starts expanded on page load',
      label: 'Start Expanded',
      value: 'expanded',
    },
    {
      description: 'Navigation bar starts collapsed on page load',
      label: 'Start Collapsed',
      value: 'collapsed',
    },
  ];

export const PERSIST_COOKIE_ACTION = '/_action/persist-cookie';
export const MAX_COOKIE_ENTRY_VALUE_LENGTH = 10_000;

export const PERSISTENCE_SIZE_WARNING: Omit<
  AppNotification,
  'id' | 'placement'
> = {
  durationMs: 10_000,
  message:
    'This table state is too large to save safely. Remove some filters or sorting before applying the change.',
  title: 'Table state too large',
  variant: 'error' as const,
};
