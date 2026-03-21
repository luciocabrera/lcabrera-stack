// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Card } from './Card.component';

afterEach(cleanup);

describe('Card', () => {
  it('renders children inside a div with data-testid=\'card\'', () => {
    render(<Card><p>Card content</p></Card>);

    expect(screen.getByTestId('card').textContent).toContain('Card content');
  });

  it('forwards native div attributes', () => {
    render(<Card aria-label='My card' id='test-card'>Content</Card>);

    const card = screen.getByTestId('card');
    expect(card.getAttribute('id')).toBe('test-card');
    expect(card.getAttribute('aria-label')).toBe('My card');
  });
});
