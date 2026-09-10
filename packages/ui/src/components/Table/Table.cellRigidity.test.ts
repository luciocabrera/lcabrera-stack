/**
 * Two invariants a grouped, horizontally scrolled grid rests on.
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
 * **Every row paints an opaque background whatever child it is.** A pinned cell
 * inherits its row's background, and a transparent sticky cell lets the columns
 * scrolling underneath show through it.
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
  opaqueBackground: { backgroundColor: colors.surfacePrimary },
  rigid: { flexShrink: 0 },
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

const opaqueClassNames = toClassNames(
  stylex.props(referenceStyles.opaqueBackground).className,
);

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
    expect(opaqueClassNames.length).toBeGreaterThan(0);
  });

  it('keeps an opaque background on a striped row that is not an even child', () => {
    const painted = toClassNames(
      stylex.props(tableRowStyles.base, tableRowStyles.striped).className,
    );

    expect(
      opaqueClassNames.every((className) => painted.includes(className)),
      'A striped row lost its unconditional background-color class. StyleX merges by property, not by condition: a backgroundColor object with no `default:` key replaces the class beneath it outright, so an odd row would paint no background at all. Pinned cells inherit that background, and a transparent sticky cell lets the scrolled columns show through it.',
    ).toBe(true);
  });
});
