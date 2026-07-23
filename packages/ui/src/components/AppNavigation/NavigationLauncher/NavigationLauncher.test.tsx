// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NavigationLauncher } from './NavigationLauncher.component';

afterEach(cleanup);

describe('NavigationLauncher', () => {
  it('renders the open navigation button', () => {
    render(<NavigationLauncher onOpen={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /Open navigation/i }),
    ).toBeDefined();
  });

  it('calls onOpen when the button is clicked', () => {
    const onOpen = vi.fn();
    render(<NavigationLauncher onOpen={onOpen} />);

    screen.getByRole('button', { name: /Open navigation/i }).click();

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders as a complementary landmark with the navigation launcher label', () => {
    render(<NavigationLauncher onOpen={vi.fn()} />);

    expect(
      screen.getByRole('complementary', { name: /Navigation launcher/i }),
    ).toBeDefined();
  });
});
