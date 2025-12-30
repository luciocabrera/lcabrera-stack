import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';

export type TableRowProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: CustomStylex;
  isHeader?: boolean;
  isStriped?: boolean;
};
