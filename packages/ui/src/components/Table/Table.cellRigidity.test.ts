/**
 * Three invariants a horizontally scrolled grid rests on.
 *
 * **Every cell a row paints declares `flexShrink: 0`.** A row is a flex
 * container and each cell is a flex item, so without this a cell carrying a
 * committed width shrinks toward its `minWidth` whenever the row overflows —
 * the same condition that creates the horizontal scrollbar.
 * `getPinnedColumnOffsets` derives each sticky `left` from the declared width,
 * so a shrunk pinned cell leaves the next one stuck at an offset that no longer
 * matches: the pinned columns overlap and the overlapped cell's right border is
 * painted under its neighbour's background.
 *
 * **Every row paints a background whatever child it is.** StyleX merges by
 * property rather than by condition, so a `backgroundColor` object with no
 * `default:` key replaces the class beneath it and an odd row paints nothing.
 *
 * **A pinned body cell paints its own opaque background.** It is the cell the
 * unpinned ones slide underneath, so it is the one that may not be see-through.
 * It may not take the row's surface and it may not `inherit`: `surfacePrimary`
 * carries alpha in both themes — `lab(100 0 0 / 0.66)` light, `lab(4 -0.35
 * -1.26 / 0.48)` dark — so a cell wearing it shows the scrolled columns through
 * itself. The translucency is the intended glass surface, which is why the cell
 * changes rather than the token.
 *
 * Both assertions compare against reference declarations compiled in this file
 * rather than against literal hashes, because StyleX compiles a declaration to a
 * hashed key and class that carry no property name, and jsdom computes no layout
 * — a shrunk cell and a rigid one render identically. Each reference is asserted
 * non-empty first, since an empty one would make its cases pass without checking
 * anything.
 */

import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import { tableBodyCellStyles } from './TableBodyCell/TableBodyCell.stylex';
import { tableHeaderBandStyles } from './TableHeaderBand/TableHeaderBand.stylex';
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';
import { tableRowStyles } from './TableRow/TableRow.stylex';

const referenceStyles = stylex.create({
  pinnedSurface: { backgroundColor: colors.surfaceSecondary },
  rigid: { flexShrink: 0 },
  rowSurface: { backgroundColor: colors.surfacePrimary },
});

const toDeclarations = (style: unknown) =>
  (Array.isArray(style) ? style : [style]).filter(
    (part): part is Record<string, unknown> =>
      typeof part === 'object' && part !== null,
  );

const toEntries = (style: unknown) =>
  toDeclarations(style).flatMap((declaration) =>
    Object.entries(declaration).filter(([property]) => property !== '$$css'),
  );

const rigidEntries = toEntries(referenceStyles.rigid);

const toClassNames = (className: string | undefined) =>
  (className ?? '').split(' ').filter(Boolean);

const rowSurfaceClassNames = toClassNames(
  stylex.props(referenceStyles.rowSurface).className,
);
const pinnedSurfaceClassNames = toClassNames(
  stylex.props(referenceStyles.pinnedSurface).className,
);

const PINNED_CELL_STYLES = [
  ['pinnedLeft', tableBodyCellStyles.pinnedLeft(0)],
  ['pinnedRight', tableBodyCellStyles.pinnedRight(0)],
] as const;

type DeclaresEveryArgs = {
  readonly entries: readonly (readonly [string, unknown])[];
  readonly style: unknown;
};

const declaresEvery = ({ entries, style }: DeclaresEveryArgs) =>
  toDeclarations(style).some((declaration) =>
    entries.every(([property, value]) => declaration[property] === value),
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
        declaresEvery({ entries: rigidEntries, style }),
        `${componentName} no longer declares flexShrink: 0. A table cell that can shrink desynchronizes its painted width from the sticky offsets getPinnedColumnOffsets derives, so pinned columns overlap and lose their borders.`,
      ).toBe(true);
    });
  }
});

describe('table row backgrounds', () => {
  it('compiles a reference background declaration to compare against', () => {
    expect(rowSurfaceClassNames.length).toBeGreaterThan(0);
  });

  it('keeps an opaque background on a striped row that is not an even child', () => {
    const painted = toClassNames(
      stylex.props(tableRowStyles.base, tableRowStyles.striped).className,
    );

    expect(
      rowSurfaceClassNames.every((className) => painted.includes(className)),
      'A striped row lost its unconditional background-color class. StyleX merges by property, not by condition: a backgroundColor object with no `default:` key replaces the class beneath it outright, so an odd row would paint no background at all.',
    ).toBe(true);
  });
});

describe('pinned body cell backgrounds', () => {
  it('compiles a reference pinned background to compare against', () => {
    expect(pinnedSurfaceClassNames.length).toBeGreaterThan(0);
  });

  for (const [variantName, style] of PINNED_CELL_STYLES) {
    it(`${variantName} paints the opaque pinned surface`, () => {
      const painted = toClassNames(stylex.props(style).className);

      expect(
        pinnedSurfaceClassNames.every((className) =>
          painted.includes(className),
        ),
        `TableBodyCell.${variantName} no longer paints the opaque pinned surface. A pinned cell is what the unpinned cells scroll underneath, so anything see-through there — 'inherit', or a token carrying alpha — lets those columns show through it.`,
      ).toBe(true);
    });

    it(`${variantName} refuses the translucent row surface`, () => {
      const painted = toClassNames(stylex.props(style).className);

      expect(
        rowSurfaceClassNames.some((className) => painted.includes(className)),
        `TableBodyCell.${variantName} paints the row surface. surfacePrimary carries alpha in both themes, so the scrolled columns show through the pinned cell.`,
      ).toBe(false);
    });
  }
});
