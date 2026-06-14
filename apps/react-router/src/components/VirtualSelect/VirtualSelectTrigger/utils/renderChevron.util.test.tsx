// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderChevron } from './renderChevron.util';

afterEach(cleanup);

describe('renderChevron', () => {
  it('returns undefined when the trigger is always open', () => {
    expect(renderChevron(true, false)).toBeUndefined();
  });

  it('renders a chevron element when the trigger can toggle', () => {
    render(<>{renderChevron(false, true)}</>);

    expect(screen.getByText('', { selector: '[data-chevron]' })).toBeTruthy();
  });
});
