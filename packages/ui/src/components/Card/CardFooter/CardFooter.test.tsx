// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { CardFooter } from './CardFooter.component';

describe('CardFooter', () => {
  it("renders children inside a div with data-testid='card-footer'", () => {
    render(
      <CardFooter>
        <span>Footer content</span>
      </CardFooter>,
    );

    expect(screen.getByTestId('card-footer').textContent).toContain(
      'Footer content',
    );
  });
});
