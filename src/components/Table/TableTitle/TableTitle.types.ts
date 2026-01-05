import type { ReactNode } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

export type TableTitleProps = {
  /** Optional actions to display on the right side */
  actions?: ReactNode;
  customStylex?: CustomStylex;
  /** Optional icon to display before the title */
  icon?: ReactNode;
  /** The title text */
  title?: string;
};
