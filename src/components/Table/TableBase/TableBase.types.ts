import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from '@stylexjs/stylex';
import type { ComponentPropsWithoutRef } from 'react';

export type TableBaseProps = ComponentPropsWithoutRef<'table'> & {
  customStylex?: TableCustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};

export type TableCustomStylex = StyleXArray<
  | boolean
  | CompiledStyles
  | null
  | Readonly<[CompiledStyles, InlineStyles]>
  | undefined
>;

export type TableDensity = 'comfortable' | 'compact';
