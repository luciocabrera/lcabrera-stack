import { SortAscIcon, SortDescIcon, SortNeutralIcon } from '@/components/Icons';

import type { SortIconProps } from './SortIcon.types';

export const SortIcon = ({ direction }: SortIconProps) => {
  if (direction === 'asc') {
    return <SortAscIcon />;
  }
  if (direction === 'desc') {
    return <SortDescIcon />;
  }
  return <SortNeutralIcon />;
};
