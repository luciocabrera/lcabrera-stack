import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type DescriptionListItem = {
  readonly term: string;
  readonly value: ReactNode;
};

export type DescriptionListLayout = 'grid' | 'inline';

export type DescriptionListProps = Omit<
  ComponentPropsWithoutRef<'dl'>,
  'children' | 'className' | 'style'
> & {
  readonly customStylex?: StyleXStyles;
  readonly items: readonly DescriptionListItem[];
  readonly layout?: DescriptionListLayout;
};
