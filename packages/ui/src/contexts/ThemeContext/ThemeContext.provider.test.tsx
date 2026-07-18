// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { use } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeContext } from './ThemeContext.context';
import { ThemeProvider } from './ThemeContext.provider';

/**
 * Reads the real ThemeContext value (not the globally-mocked `useTheme` hook)
 * so these tests exercise the provider's own state and callbacks, and exposes
 * buttons to drive `setTheme` / `toggleTheme`.
 */
const ThemeProbe = () => {
  const context = use(ThemeContext);

  if (context === undefined) {
    throw new Error('Expected ThemeProvider to supply a context value');
  }

  const { isDarkMode, setTheme, theme, toggleTheme } = context;
  const handleSetDark = () => setTheme('dark');

  return (
    <div>
      <output data-testid='theme'>{theme}</output>
      <output data-testid='dark'>{String(isDarkMode)}</output>
      <button onClick={handleSetDark} type='button'>
        set-dark
      </button>
      <button onClick={toggleTheme} type='button'>
        toggle
      </button>
    </div>
  );
};

beforeEach(() => {
  // The provider persists through a router-free fetch — stub it so no real
  // request escapes the test.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response())),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe('ThemeProvider', () => {
  it('prefers the loader-provided initialTheme over the defaultTheme', () => {
    render(
      <ThemeProvider defaultTheme='light' initialTheme='dark'>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('dark').textContent).toBe('true');
  });

  it('falls back to the defaultTheme when no initialTheme is given', () => {
    render(
      <ThemeProvider defaultTheme='dark'>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('defaults to light when neither initial nor default theme is provided', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('setTheme updates the theme and persists it through a fetch', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-dark' }));

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('toggleTheme flips light to dark and back', () => {
    render(
      <ThemeProvider initialTheme='light'>
        <ThemeProbe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });
});
