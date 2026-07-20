// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isIconOnly?: boolean;
  readonly tooltipContent?: string;
  readonly type?: string;
};

vi.mock('@repo/ui/components/Button', () => ({
  Button: ({ children, isIconOnly, tooltipContent, type }: MockButtonProps) => (
    <button
      aria-label='Log out'
      data-icon-only={String(isIconOnly)}
      data-tooltip={tooltipContent ?? 'none'}
      type={type === 'submit' ? 'submit' : 'button'}
    >
      {children}
    </button>
  ),
}));

vi.mock('react-router', () => ({
  Form: ({
    action,
    children,
    method,
  }: {
    readonly action: string;
    readonly children: ReactNode;
    readonly method: string;
  }) => (
    <form action={action} data-method={method}>
      {children}
    </form>
  ),
}));

import { LogoutControl } from './LogoutControl.component';

afterEach(() => {
  cleanup();
});

describe('LogoutControl', () => {
  it('renders a POST form to the logout route with a submit button', () => {
    const { container } = render(<LogoutControl isCollapsed={false} />);

    const form = container.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/logout');
    expect(form?.dataset.method).toBe('post');

    const button = screen.getByRole('button', { name: 'Log out' });
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.dataset.iconOnly).toBe('false');
    expect(button.dataset.tooltip).toBe('none');
  });

  it('is icon-only with a tooltip when the sidebar is collapsed', () => {
    render(<LogoutControl isCollapsed />);

    const button = screen.getByRole('button', { name: 'Log out' });
    expect(button.dataset.iconOnly).toBe('true');
    expect(button.dataset.tooltip).toBe('Log out');
  });
});
