import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export type SectionCardProps = {
  readonly children: ReactNode;
  /** Lets the parent override width/height/etc — e.g. a Form's containing section. */
  readonly customStylex?: StyleXStyles;
  readonly description?: string;
  readonly title: string;
};
