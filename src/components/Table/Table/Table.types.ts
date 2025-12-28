import type { CompiledStyles, InlineStyles, StyleXArray } from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type TableCustomStylex = StyleXArray<
  boolean | CompiledStyles | null | Readonly<[CompiledStyles, InlineStyles]> | undefined
>;

export type TableDensity = 'comfortable' | 'compact';

export type TableProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: TableCustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};
