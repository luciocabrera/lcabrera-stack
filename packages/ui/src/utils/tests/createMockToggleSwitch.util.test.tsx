// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { MockToggleSwitch } from './createMockToggleSwitch.util';

describe('MockToggleSwitch', () => {
  it('names the control from the label and checked state', () => {
    const onChange = vi.fn();

    render(
      <MockToggleSwitch isChecked={false} label='Show' onChange={onChange} />,
    );

    fireEvent.click(screen.getByLabelText('Show-off'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
