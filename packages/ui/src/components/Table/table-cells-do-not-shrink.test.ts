/**
 * Every cell a table row paints declares `flexShrink: 0`.
 *
 * A row is a flex container and each cell is a flex item, so without this a
 * cell carrying a committed width shrinks toward its `minWidth` whenever the
 * row overflows — the same condition that creates the horizontal scrollbar.
 * `getPinnedColumnOffsets` derives each sticky `left` from the declared width,
 * so a shrunk pinned cell leaves the next one stuck at an offset that no longer
 * matches: the pinned columns overlap and the overlapped cell's right border is
 * painted under its neighbour's background.
 *
 * StyleX compiles a declaration to a hashed key and class that carry no
 * property name, and jsdom computes no layout, so the assertion compares
 * against a reference declaration compiled in this file rather than against a
 * literal hash. The reference is asserted to be non-empty first, because an
 * empty one would make every case below pass without checking anything.
 */

import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { tableBodyCellStyles } from './TableBodyCell/TableBodyCell.stylex';
import { tableHeaderBandStyles } from './TableHeaderBand/TableHeaderBand.stylex';
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';

const rigidStyles = stylex.create({ rigid: { flexShrink: 0 } });

const toDeclarations = (style: unknown) =>
  (Array.isArray(style) ? style : [style]).filter(
    (part): part is Record<string, unknown> =>
      typeof part === 'object' && part !== null,
  );

const rigidEntries = toDeclarations(rigidStyles.rigid).flatMap((declaration) =>
  Object.entries(declaration).filter(([property]) => property !== '$$css'),
);

const declaresRigidFlex = (style: unknown) =>
  toDeclarations(style).some((declaration) =>
    rigidEntries.every(([property, value]) => declaration[property] === value),
  );

const CELL_STYLES = [
  ['TableBodyCell', tableBodyCellStyles.base(200, 350)],
  ['TableHeaderCell', tableHeaderCellStyles.base(200, 350)],
  ['TableHeaderBand', tableHeaderBandStyles.base(350)],
] as const;

describe('table cell styles', () => {
  it('compiles a reference flexShrink declaration to compare against', () => {
    expect(rigidEntries.length).toBeGreaterThan(0);
  });

  for (const [componentName, style] of CELL_STYLES) {
    it(`${componentName} declares flexShrink: 0`, () => {
      expect(
        declaresRigidFlex(style),
        `${componentName} no longer declares flexShrink: 0. A table cell that can shrink desynchronizes its painted width from the sticky offsets getPinnedColumnOffsets derives, so pinned columns overlap and lose their borders.`,
      ).toBe(true);
    });
  }
});
