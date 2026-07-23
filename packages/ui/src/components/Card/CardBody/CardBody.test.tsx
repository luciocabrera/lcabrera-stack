// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { CardBody } from './CardBody.component';

describe('CardBody', () => {
  it("renders children inside a div with data-testid='card-body'", () => {
    render(
      <CardBody>
        <p>Body content</p>
      </CardBody>,
    );

    expect(screen.getByTestId('card-body').textContent).toContain(
      'Body content',
    );
  });
});
