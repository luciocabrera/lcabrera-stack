// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { matchesCssColorSyntax } from '#ui/components/Table/cellRenderers/matchesCssColorSyntax.util';

import { useTableCellColorCheck } from './useTableCellColorCheck.hook';

const Probe = () => (
  <output>{String(useTableCellColorCheck() === matchesCssColorSyntax)}</output>
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTableCellColorCheck', () => {
  it('asks the browser on the client', () => {
    const supports = vi.spyOn(CSS, 'supports');
    const { result } = renderHook(() => useTableCellColorCheck());

    expect(result.current('oklch(0.75 0.15 55)')).toBe(true);
    expect(result.current('rgb(nope)')).toBe(false);
    expect(supports).toHaveBeenCalledWith('color', 'rgb(nope)');
  });

  it('answers by syntax while rendering on the server', () => {
    expect(renderToString(<Probe />)).toContain('true');
  });
});
