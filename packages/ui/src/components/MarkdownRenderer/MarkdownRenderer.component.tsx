import type { Components } from 'react-markdown';

import * as stylex from '@stylexjs/stylex';
import Markdown from 'react-markdown';

import type { MarkdownRendererProps } from './MarkdownRenderer.types';

import { styles } from './MarkdownRenderer.stylex';

const components: Components = {
  a: (props) => <a {...props} {...stylex.props(styles.link)} />,
  blockquote: (props) => (
    <blockquote {...props} {...stylex.props(styles.blockquote)} />
  ),
  code: (props) => <code {...props} {...stylex.props(styles.code)} />,
  h1: ({ children, ...props }) => (
    <h1 {...props} {...stylex.props(styles.heading1)}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 {...props} {...stylex.props(styles.heading2)}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} {...stylex.props(styles.heading3)}>
      {children}
    </h3>
  ),
  ol: (props) => <ol {...props} {...stylex.props(styles.list)} />,
  p: (props) => <p {...props} {...stylex.props(styles.paragraph)} />,
  pre: (props) => <pre {...props} {...stylex.props(styles.pre)} />,
  ul: (props) => <ul {...props} {...stylex.props(styles.list)} />,
};

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => (
  <div {...stylex.props(styles.container)}>
    <Markdown components={components}>{content}</Markdown>
  </div>
);
