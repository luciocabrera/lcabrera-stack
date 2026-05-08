// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppNavigation } from './AppNavigation.component';

afterEach(cleanup);

describe('AppNavigation', () => {
  it('renders the configured route links and theme toggle', () => {
    const handleToggleTheme = vi.fn();

    render(
      <MemoryRouter>
        <AppNavigation isDarkMode={false} onToggleTheme={handleToggleTheme} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Enterprise Orders/i }),
    ).toBeDefined();
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows the launcher after unpinning the sidebar', () => {
    render(
      <MemoryRouter>
        <AppNavigation isDarkMode onToggleTheme={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Unpin navigation/i }));

    expect(
      screen.getByRole('button', { name: /Open navigation/i }),
    ).toBeDefined();
  });
});
