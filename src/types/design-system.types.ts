import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from '@stylexjs/stylex';

export type CustomStylex = StyleXArray<
  | boolean
  | CompiledStyles
  | null
  | Readonly<[CompiledStyles, InlineStyles]>
  | undefined
>;

export type DesignSystemColor =
  | 'error'
  | 'ghost'
  | 'outline'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';

export type DesignSystemOrientation = 'horizontal' | 'vertical';

export type DesignSystemSize = 'lg' | 'md' | 'sm';

export type DesignSystemStyle = 'elevated' | 'flat' | 'solid';

export type DesignSystemWidth = 'auto' | 'full';
