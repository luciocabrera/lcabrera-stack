// import type {
//   CompiledStyles,
//   InlineStyles,
//   StyleXArray,
// } from '@stylexjs/stylex';

// export type CustomStylex = StyleXArray<
//   | boolean
//   | CompiledStyles
//   | null
//   | Readonly<[CompiledStyles, InlineStyles]>
//   | undefined
// >;

export type DesignSystemColor =
  | 'danger-ghost'
  | 'error'
  | 'ghost'
  | 'outline'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';

export type DesignSystemOrientation = 'horizontal' | 'vertical';

export type DesignSystemSize = 'embedded' | 'lg' | 'md' | 'mini' | 'sm';

export type DesignSystemStyle = 'elevated' | 'flat' | 'solid';

export type DesignSystemWidth = 'auto' | 'full';
