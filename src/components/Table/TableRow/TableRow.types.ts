import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

export type TableRowProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: CustomStylex;
  isHeader?: boolean;
  isStriped?: boolean;
};
