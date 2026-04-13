// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CardTitle } from './CardTitle.component.tsx';

afterEach(cleanup);

describe('CardTitle', () => {
  it("renders children inside an h3 with data-testid='card-title'", () => {
    render(<CardTitle>My Title</CardTitle>);

    const title = screen.getByTestId('card-title');
    expect(title.tagName).toBe('H3');
    expect(title.textContent).toContain('My Title');
  });

  it('renders icon slot when icon prop is provided', () => {
    render(
      <CardTitle icon={<span data-testid='title-icon'>🔔</span>}>
        Title with Icon
      </CardTitle>,
    );

    expect(screen.getByTestId('title-icon')).not.toBeNull();
  });
});
