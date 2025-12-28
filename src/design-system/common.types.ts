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
