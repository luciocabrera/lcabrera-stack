// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { StatusBadge } from './StatusBadge.component';

afterEach(cleanup);

describe('StatusBadge', () => {
  it.each([
    { label: 'Failed', tone: 'error' },
    { label: 'Running', tone: 'info' },
    { label: 'Queued', tone: 'neutral' },
    { label: 'Succeeded', tone: 'success' },
    { label: 'Partially Failed', tone: 'warning' },
  ] as const)('renders the $tone tone with its label', ({ label, tone }) => {
    render(<StatusBadge label={label} tone={tone} />);

    expect(screen.getByText(label).textContent).toBe(label);
  });
});
