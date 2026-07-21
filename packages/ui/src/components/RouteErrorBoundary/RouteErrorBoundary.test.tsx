// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { navigateMock, revalidateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  revalidateMock: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
  useRevalidator: () => ({ revalidate: revalidateMock }),
}));

vi.mock('@lcabrera/ui/components/Button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    readonly children: ReactNode;
    readonly onClick?: () => void;
  }) => (
    <button onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@lcabrera/ui/components/Icons', () => ({
  ErrorDescriptive: () => <svg data-testid='error-icon' />,
}));

vi.mock('@lcabrera/ui/components/Title', () => ({
  Title: ({ children }: { readonly children: ReactNode }) => (
    <h1>{children}</h1>
  ),
}));

import { RouteErrorBoundary } from './RouteErrorBoundary.component';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
  revalidateMock.mockReset();
});

describe('RouteErrorBoundary', () => {
  it('renders the default title when none is provided', () => {
    render(
      <RouteErrorBoundary
        defaultMessage='Something failed'
        error={undefined}
      />,
    );

    expect(screen.getByRole('heading').textContent).toBe('An error occurred');
  });

  it('renders a custom title when provided', () => {
    render(
      <RouteErrorBoundary
        defaultMessage='Oops'
        error={undefined}
        title='Custom Error Title'
      />,
    );

    expect(screen.getByRole('heading').textContent).toBe('Custom Error Title');
  });

  it('renders the error icon', () => {
    render(
      <RouteErrorBoundary defaultMessage='Failed' error={new Error('boom')} />,
    );

    expect(screen.getByTestId('error-icon')).not.toBeNull();
  });

  it('shows the error message in dev mode when error is an Error instance', () => {
    render(
      <RouteErrorBoundary
        defaultMessage='Fallback message'
        error={new Error('Specific error message')}
      />,
    );

    // In vitest (dev mode), import.meta.env.DEV is true so the error.message is shown
    expect(screen.getByText('Specific error message')).not.toBeNull();
  });

  it('shows the defaultMessage when error is not an Error instance', () => {
    render(
      <RouteErrorBoundary
        defaultMessage='Default fallback'
        error='string error'
      />,
    );

    expect(screen.getByText('Default fallback')).not.toBeNull();
  });

  it('navigates to "/" when Home button is clicked', () => {
    render(
      <RouteErrorBoundary defaultMessage='Failed' error={new Error('err')} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /home/i }));

    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('calls revalidate when Retry button is clicked', () => {
    render(
      <RouteErrorBoundary defaultMessage='Failed' error={new Error('err')} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });
});
