import type { ComponentType } from 'react';

import type { IconProps } from '#ui/components/Icons';

export type SectionToolbarButton = {
  readonly icon: ComponentType<IconProps>;
  readonly isDisabled?: boolean;
  readonly key: string;
  readonly label: string;
  readonly onClick?: () => void;
};

export type SectionToolbarProps = {
  readonly buttons: readonly SectionToolbarButton[];
  readonly isBusy?: boolean;
  readonly variant?: 'footer' | 'toolbar';
};
