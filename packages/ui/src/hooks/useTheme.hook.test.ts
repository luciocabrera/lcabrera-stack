// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { ThemeContextValue } from '#ui/types/theme.types';

vi.unmock('#ui/hooks/useTheme.hook');

vi.mock('#ui/contexts/ThemeContext', async () => {
  const { createContext } = await import('react');

  return {
    ThemeContext: createContext<ThemeContextValue | undefined>(undefined),
  };
});

import { ThemeContext } from '#ui/contexts/ThemeContext';

import { useTheme } from './useTheme.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const createWrapper = (value: ThemeContextValue) => {
  return function ThemeContextWrapper({ children }: WrapperProps) {
    return createElement(ThemeContext, { value }, children);
  };
};

describe('useTheme', () => {
  it('returns the current ThemeContext value', () => {
    const contextValue: ThemeContextValue = {
      isDarkMode: true,
      setTheme: vi.fn(),
      theme: 'dark',
      toggleTheme: vi.fn(),
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(contextValue),
    });

    expect(result.current).toBe(contextValue);
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider',
    );
  });
});
