import type { RadioOption } from '@/components/RadioOptionGroup';
import type { GlobalNavigationSizePreference } from '@/types/globalSettings.types';

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
