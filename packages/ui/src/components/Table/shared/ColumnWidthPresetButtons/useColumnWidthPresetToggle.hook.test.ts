// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useColumnWidthPresetToggle } from './useColumnWidthPresetToggle.hook';

describe('useColumnWidthPresetToggle', () => {
  it('starts with no selected preset', () => {
    const { result } = renderHook(() =>
      useColumnWidthPresetToggle({ onSelectPreset: vi.fn() }),
    );

    expect(result.current.selectedPreset).toBeUndefined();
  });

  it('selects a preset and invokes onSelectPreset with it', () => {
    const onSelectPreset = vi.fn();
    const { result } = renderHook(() =>
      useColumnWidthPresetToggle({ onSelectPreset }),
    );

    act(() => {
      result.current.handleToggleMax();
    });

    expect(result.current.selectedPreset).toBe('max');
    expect(onSelectPreset).toHaveBeenCalledExactlyOnceWith('max');
  });

  it('deselects on re-toggle and does not write again', () => {
    const onSelectPreset = vi.fn();
    const { result } = renderHook(() =>
      useColumnWidthPresetToggle({ onSelectPreset }),
    );

    act(() => {
      result.current.handleToggleDefault();
    });
    act(() => {
      result.current.handleToggleDefault();
    });

    expect(result.current.selectedPreset).toBeUndefined();
    expect(onSelectPreset).toHaveBeenCalledExactlyOnceWith('default');
  });
});
