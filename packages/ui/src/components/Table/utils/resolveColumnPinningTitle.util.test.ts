import { describe, expect, it } from 'vite-plus/test';

import { TABLE_COLUMN_LAYOUT_LOCK_LABELS } from '../Table.constants';
import { resolveColumnPinningTitle } from './resolveColumnPinningTitle.util';

describe('resolveColumnPinningTitle', () => {
  it('says nothing where no lock applies', () => {
    expect(resolveColumnPinningTitle(undefined)).toBeUndefined();
  });

  it('states the refusal on a group key', () => {
    expect(resolveColumnPinningTitle('group-key')).toBe(
      `Cannot pin this column: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS['group-key']}.`,
    );
  });

  it('states the band a measure carries, rather than a refusal', () => {
    const title = resolveColumnPinningTitle('measure');

    expect(title).toBe(
      `Applies to the whole band: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS.measure}.`,
    );
    expect(title).not.toContain('Cannot');
  });
});
