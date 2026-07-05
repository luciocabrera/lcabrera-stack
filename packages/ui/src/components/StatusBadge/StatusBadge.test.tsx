// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusBadge } from './StatusBadge.component';

afterEach(cleanup);

describe('StatusBadge', () => {
  it.each([
    ['error', 'Failed'],
    ['info', 'Running'],
    ['neutral', 'Queued'],
    ['success', 'Succeeded'],
    ['warning', 'Partially Failed'],
  ] as const)('renders the %s tone with its label', (tone, label) => {
    render(<StatusBadge label={label} tone={tone} />);

    expect(screen.getByText(label).textContent).toBe(label);
  });
});
