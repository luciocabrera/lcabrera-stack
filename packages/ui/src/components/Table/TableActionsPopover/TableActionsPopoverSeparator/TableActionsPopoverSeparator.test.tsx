// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableActionsPopoverSeparator } from './TableActionsPopoverSeparator.component';

afterEach(cleanup);

describe('TableActionsPopoverSeparator', () => {
  it('renders a separator', () => {
    render(<TableActionsPopoverSeparator />);

    expect(screen.getByRole('separator')).not.toBeNull();
  });

  it('carries no content of its own', () => {
    render(<TableActionsPopoverSeparator />);

    expect(screen.getByRole('separator').textContent).toBe('');
  });
});
