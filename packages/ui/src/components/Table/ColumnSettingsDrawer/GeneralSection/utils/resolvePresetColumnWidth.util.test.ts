import { DEFAULT_MIN_COLUMN_WIDTH } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { resolvePresetColumnWidth } from './resolvePresetColumnWidth.util';

describe('resolvePresetColumnWidth', () => {
  it('returns the configured min width for the min preset', () => {
    expect(
      resolvePresetColumnWidth({ maxWidth: 240, minWidth: 80, preset: 'min' }),
    ).toBe(80);
  });

  it('returns the configured max width for the max preset', () => {
    expect(
      resolvePresetColumnWidth({ maxWidth: 240, minWidth: 80, preset: 'max' }),
    ).toBe(240);
  });

  it('falls back to the default minimum width for unconfigured bounds', () => {
    expect(resolvePresetColumnWidth({ preset: 'min' })).toBe(
      DEFAULT_MIN_COLUMN_WIDTH,
    );
    expect(resolvePresetColumnWidth({ preset: 'max' })).toBe(
      DEFAULT_MIN_COLUMN_WIDTH,
    );
  });

  it('returns undefined for the default preset to clear custom sizing', () => {
    expect(
      resolvePresetColumnWidth({
        maxWidth: 240,
        minWidth: 80,
        preset: 'default',
      }),
    ).toBeUndefined();
  });
});
