// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CardHeader } from './CardHeader.component';

describe('CardHeader', () => {
  it("renders children inside a div with data-testid='card-header'", () => {
    render(
      <CardHeader>
        <span>Header content</span>
      </CardHeader>,
    );

    expect(screen.getByTestId('card-header').textContent).toContain(
      'Header content',
    );
  });
});
