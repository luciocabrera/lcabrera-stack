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

  it('renders level-2 and level-3 headings with their own tags', () => {
    render(<MarkdownRenderer content={'## Section\n\n### Subsection'} />);

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Section',
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'Subsection',
    );
  });

  it('renders links as anchors carrying the href', () => {
    render(<MarkdownRenderer content={'[docs](https://example.test/docs)'} />);

    const link = screen.getByRole('link', { name: 'docs' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.test/docs');
  });

  it('renders blockquotes as blockquote elements', () => {
    render(<MarkdownRenderer content={'> quoted wisdom'} />);

    const quote = document.querySelector('blockquote');
    expect(quote).not.toBeNull();
    expect(quote?.textContent).toContain('quoted wisdom');
  });

  it('renders ordered lists as <ol> with their items', () => {
    render(<MarkdownRenderer content={'1. first\n2. second'} />);

    const orderedList = document.querySelector('ol');
    expect(orderedList).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders inline code spans as <code>', () => {
    render(<MarkdownRenderer content={'Use `npm run build` to compile.'} />);

    const inlineCode = screen.getByText('npm run build');
    expect(inlineCode.tagName).toBe('CODE');
  });
});
