// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownRenderer } from './MarkdownRenderer.component';

afterEach(cleanup);

describe('MarkdownRenderer', () => {
  it('renders headings, paragraphs, and lists', () => {
    render(
      <MarkdownRenderer content={'# Title\n\nSome text.\n\n- one\n- two'} />,
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Title');
    expect(screen.getByText('Some text.')).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders fenced code blocks', () => {
    render(<MarkdownRenderer content={'```text\nconst x = 1;\n```'} />);

    expect(screen.getByText('const x = 1;').tagName).toBe('CODE');
  });

  it('does not interpret raw HTML embedded in the content', () => {
    render(<MarkdownRenderer content={'<script>window.x = 1</script>'} />);

    expect(document.querySelector('script')).toBeNull();
  });
});
