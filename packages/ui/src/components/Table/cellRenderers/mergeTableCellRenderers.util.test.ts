import { describe, expect, it } from 'vite-plus/test';

import { TABLE_CELL_BADGE_RENDERER } from '#ui/components/Table/TableCellBadge/TableCellBadge.constants';
import { TABLE_CELL_TEXT_RENDERER } from '#ui/components/Table/TableCellText/TableCellText.constants';

import { TABLE_CELL_BUILT_IN_RENDERERS } from './cellRenderers.constants';
import { mergeTableCellRenderers } from './mergeTableCellRenderers.util';

describe('mergeTableCellRenderers', () => {
  it('registers the built-ins by kind', () => {
    expect(
      mergeTableCellRenderers([TABLE_CELL_BUILT_IN_RENDERERS]).keys().toArray(),
    ).toEqual(['badge', 'delta', 'text']);
  });

  it('lets a later layer replace a kind', () => {
    const replacement = { ...TABLE_CELL_TEXT_RENDERER, kind: 'badge' };
    const merged = mergeTableCellRenderers([
      TABLE_CELL_BUILT_IN_RENDERERS,
      [replacement],
    ]);

    expect(merged.get('badge')).toBe(replacement);
    expect(merged.get('badge')).not.toBe(TABLE_CELL_BADGE_RENDERER);
  });

  it('adds a new kind beside the built-ins', () => {
    const gauge = { ...TABLE_CELL_TEXT_RENDERER, kind: 'gauge' };

    expect(
      mergeTableCellRenderers([TABLE_CELL_BUILT_IN_RENDERERS, [gauge]]).size,
    ).toBe(4);
  });
});
