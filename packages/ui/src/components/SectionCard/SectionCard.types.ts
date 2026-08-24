import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type SectionCardProps = {
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly description?: string;
  readonly title: string;
};
