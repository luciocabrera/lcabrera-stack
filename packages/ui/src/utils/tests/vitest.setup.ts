import { vi } from 'vitest';

vi.mock('@lcabrera/ui/hooks/useTheme.hook', () => ({
  useTheme: () => ({
    isDarkMode: false,
    setTheme: vi.fn(),
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));
