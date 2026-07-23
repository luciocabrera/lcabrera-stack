// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Navbar } from './Navbar.component';

afterEach(() => {
  cleanup();
});

type MockButtonProps = {
  readonly children?: ReactNode;
  readonly onClick?: () => void;
};

type MockNavLinkProps = {
  readonly children?: ReactNode;
  readonly to?: string;
};

const MockButton = vi.hoisted(() => {
  return function MockButton({ children, onClick }: MockButtonProps) {
    return (
      <button onClick={onClick} type='button'>
        {children}
      </button>
    );
  };
});

const MockNavLink = vi.hoisted(() => {
  return function MockNavLink({ children, to }: MockNavLinkProps) {
    return <a href={to}>{children}</a>;
  };
});

vi.mock('@lcabrera/ui/components/Button', () => ({
  Button: MockButton,
}));

vi.mock('@lcabrera/ui/components/NavLink', () => ({
  NavLink: MockNavLink,
}));

describe('Navbar', () => {
  it('renders a navigation element', () => {
    render(<Navbar items={[]} />);
    expect(screen.getByRole('navigation')).not.toBeNull();
  });

  it('renders button items', () => {
    const onClick = vi.fn();
    render(<Navbar items={[{ label: 'Refresh', onClick, type: 'button' }]} />);
    const button = screen.getByRole('button', { name: 'Refresh' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders link items', () => {
    render(<Navbar items={[{ label: 'Home', to: '/home', type: 'link' }]} />);
    expect(screen.getByText('Home').textContent).toBe('Home');
  });
});
