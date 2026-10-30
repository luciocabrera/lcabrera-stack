import type { HTMLAttributes } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TextElement, TextProps } from './Text.types';

import { styles } from './Text.stylex';

export const Text = <TElement extends TextElement = 'p'>({
  as: tagName = 'p',
  children,
  customStylex,
  isMono = false,
  isTabular = false,
  size = 'md',
  tone = 'primary',
  weight,
  ...props
}: TextProps<TElement>) => {
  const Tag: TextElement = tagName;
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
