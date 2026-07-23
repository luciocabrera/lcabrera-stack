// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Card } from './Card.component';

afterEach(cleanup);

const customStyles = stylex.create({
  wide: { width: '40rem' },
});

describe('Card', () => {
  it('merges a customStylex override into the rendered className', () => {
    const { rerender } = render(<Card>Content</Card>);
    const baseClassName = screen.getByTestId('card').className;

    rerender(<Card customStylex={customStyles.wide}>Content</Card>);
    const withCustomStylex = screen.getByTestId('card').className;

    expect(withCustomStylex).not.toBe(baseClassName);
    expect(withCustomStylex.startsWith(baseClassName)).toBe(true);
  });

  it("renders children inside a div with data-testid='card'", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>,
    );

    expect(screen.getByTestId('card').textContent).toContain('Card content');
  });

  it('forwards native div attributes', () => {
    render(
      <Card aria-label='My card' id='test-card'>
        Content
      </Card>,
    );

    const card = screen.getByTestId('card');
    expect(card.getAttribute('id')).toBe('test-card');
    expect(card.getAttribute('aria-label')).toBe('My card');
  });
});
