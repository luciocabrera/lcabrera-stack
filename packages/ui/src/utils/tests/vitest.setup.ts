import { vi } from 'vite-plus/test';

vi.mock('#ui/hooks/useTheme.hook', () => ({
  useTheme: () => ({
    isDarkMode: false,
    setTheme: vi.fn(),
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));
