// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableSettingsDrawerSkeleton } from './TableSettingsDrawerSkeleton.component';

describe('TableSettingsDrawerSkeleton', () => {
  it('renders a pinned side-panel skeleton shell', () => {
    render(<TableSettingsDrawerSkeleton />);

    expect(screen.getByLabelText('Settings panel')).toBeTruthy();
    expect(screen.getByText('Table Settings').textContent).toBe(
      'Table Settings',
    );
  });
});
