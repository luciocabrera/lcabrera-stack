import type { HTMLAttributes, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TextElement, TextProps } from './Text.types';

import { styles } from './Text.stylex';

export const Text: <TElement extends TextElement = 'p'>(
  props: TextProps<TElement>,
) => JSX.Element = ({
  as: Tag = 'p',
  children,
  customStylex,
  isMono = false,
  isTabular = false,
  size = 'md',
  tone = 'primary',
  weight,
  ...props
}: TextProps<TextElement>) => {
  const elementProps: HTMLAttributes<HTMLElement> = props;

  return (
    <Tag
      {...elementProps}
      {...stylex.props(
        styles.text,
        styles.size[size],
        styles.tone[tone],
        weight && styles.weight[weight],
        isMono && styles.mono,
        isTabular && styles.tabular,
        customStylex,
      )}
    >
      {children}
    </Tag>
  );
};
