// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderDisplayedContent } from './renderDisplayedContent.util';

afterEach(cleanup);

describe('renderDisplayedContent', () => {
  it('returns custom content unchanged', () => {
    render(
      <>
        {renderDisplayedContent({
          content: <strong>Custom content</strong>,
          dataType: 'string',
          hasCustomContent: true,
        })}
      </>,
    );

    const custom = screen.getByText('Custom content');

    expect(custom.tagName).toBe('STRONG');
  });

  it('wraps rendered string content in a span with a title', () => {
    render(
      <>
        {renderDisplayedContent({
          content: 'Alice',
          dataType: 'string',
          hasCustomContent: false,
        })}
      </>,
    );

    expect(screen.getByTitle('Alice').textContent).toBe('Alice');
  });
});
