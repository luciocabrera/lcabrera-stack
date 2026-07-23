// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RootErrorBoundary } from './RootErrorBoundary.component';

afterEach(() => {
  cleanup();
});

describe('RootErrorBoundary', () => {
  it('renders the fallback heading', () => {
    render(<RootErrorBoundary error={undefined} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Oops!');
  });

  it('renders no stack block for a non-Error value', () => {
    const { container } = render(<RootErrorBoundary error='boom' />);

    expect(container.querySelector('pre')).toBeNull();
  });

  it('surfaces the Error message and stack in development builds', () => {
    // Vitest runs with import.meta.env.DEV === true, so an Error instance
    // takes the dev branch that reveals its message and stack. The stack is
    // auto-populated by the Error constructor and includes the message.
    const error = new Error('database connection refused');

    render(<RootErrorBoundary error={error} />);

    expect(screen.getByText('database connection refused')).not.toBeNull();
    const stackBlock = document.querySelector('pre code');
    expect(stackBlock).not.toBeNull();
    expect(stackBlock?.textContent).toContain('database connection refused');
  });
});
