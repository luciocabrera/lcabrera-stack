import * as stylex from '@stylexjs/stylex';
import Markdown from 'react-markdown';

import type { Components } from 'react-markdown';

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

/**
 * Renders LLM-authored Markdown (scan reports) as sanitized HTML — safe by
 * default: `react-markdown` never interprets raw HTML embedded in the
 * source text unless the `rehype-raw` plugin is added, which this
 * deliberately omits, so no separate sanitizer is needed on top.
 */
export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => (
  <div {...stylex.props(styles.container)}>
    <Markdown components={components}>{content}</Markdown>
  </div>
);
