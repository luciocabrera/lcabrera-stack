// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderChevron } from './renderChevron.util';

afterEach(cleanup);

describe('renderChevron', () => {
  it('returns undefined when the trigger is always open', () => {
    expect(
      renderChevron({ isAlwaysOpen: true, isOpen: false }),
    ).toBeUndefined();
  });

  it('renders a chevron element when the trigger can toggle', () => {
    render(renderChevron({ isAlwaysOpen: false, isOpen: true }));

    expect(screen.getByText('', { selector: '[data-chevron]' })).toBeTruthy();
  });
});
