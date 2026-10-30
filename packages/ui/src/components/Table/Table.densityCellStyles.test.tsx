// @vitest-environment jsdom

/**
 * jsdom applies no compiled StyleX CSS, so a cell that stopped reading the
 * density variables would still pass every rendered-row test. This suite
 * compiles each cell's style module with the StyleX plugin, reads the CSS rule
 * behind every class a cell actually renders, and asserts that its font size
 * and inline padding are the density variables rather than a fixed token.
 */

import * as stylex from '@stylexjs/stylex';
import stylexUnplugin from '@stylexjs/unplugin';
import { cleanup, render, screen } from '@testing-library/react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';

import type { TableColumn } from './Table.types';

import { Table } from './Table.component';
import { tableDensityVars } from './TableBase/tableDensity.stylex';
import { tableBodyCellStyles } from './TableBodyCell/TableBodyCell.stylex';
import { styles as badgeStyles } from './TableCellBadge/TableCellBadge.stylex';
import { tableGroupKeyCellStyles } from './TableGroupKeyCell/TableGroupKeyCell.stylex';
import { tableHeaderBandStyles } from './TableHeaderBand/TableHeaderBand.stylex';
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';

type Reading = {
  readonly id: number;
  readonly value: number;
};

type StyleModule = {
  readonly path: string;
  readonly source: string;
};

type StylexTransformPlugin = {
  readonly transform: (
    this: unknown,
    code: string,
    id: string,
  ) => Promise<TransformResult> | TransformResult;
};

type TransformResult = string | undefined | { readonly code: string };

const SOURCES = import.meta.glob<string>(
  [
    './TableBase/tableDensity.stylex.ts',
    './TableBodyCell/TableBodyCell.stylex.ts',
    './TableCellBadge/TableCellBadge.stylex.ts',
    './TableGroupKeyCell/TableGroupKeyCell.stylex.ts',
    './TableHeaderBand/TableHeaderBand.stylex.ts',
    './TableHeaderCell/TableHeaderCell.stylex.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
);

const SUITE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_ROOT = path.resolve(SUITE_DIRECTORY, '../..');

const toModulePath = (relativePath: string) =>
  path.resolve(SUITE_DIRECTORY, relativePath);

const toStyleModule = (relativePath: string): StyleModule => ({
  path: toModulePath(relativePath),
  source: SOURCES[relativePath] ?? '',
});

const STYLE_MODULES: readonly StyleModule[] = [
  toStyleModule('./TableBodyCell/TableBodyCell.stylex.ts'),
  toStyleModule('./TableHeaderCell/TableHeaderCell.stylex.ts'),
  toStyleModule('./TableHeaderBand/TableHeaderBand.stylex.ts'),
  toStyleModule('./TableGroupKeyCell/TableGroupKeyCell.stylex.ts'),
  toStyleModule('./TableCellBadge/TableCellBadge.stylex.ts'),
];

const COLUMNS: readonly TableColumn<Reading>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'number', key: 'value', label: 'Value' },
];

const RULE_PATTERN = /ltr: "\.(x[\w-]+)\{([\w-]+):([^"]*)\}"/gu;

const createTransformPlugin = () => {
  const created = stylexUnplugin.raw(
    {
      aliases: { '#ui/*': [`${SOURCE_ROOT}/*`] },
      dev: false,
      runtimeInjection: true,
      useCSSLayers: false,
    },
    { framework: 'vite' } as never,
  ) as readonly StylexTransformPlugin[] | StylexTransformPlugin;

  return Array.isArray(created) ? created[0] : created;
};

const compileRules = async () => {
  const plugin = createTransformPlugin();
  const rules = new Map<string, { property: string; value: string }>();

  for (const { path, source } of STYLE_MODULES) {
    const result = await plugin.transform.call({}, source, path);
    const code = typeof result === 'string' ? result : (result?.code ?? '');

    for (const [, className = '', property = '', value = ''] of code.matchAll(
      RULE_PATTERN,
    )) {
      rules.set(className, { property, value });
    }
  }

  return rules;
};

const compiledRules = await compileRules();

const compiledDensityDefaults = await (async () => {
  const result = await createTransformPlugin().transform.call(
    {},
    SOURCES['./TableBase/tableDensity.stylex.ts'] ?? '',
    toModulePath('./TableBase/tableDensity.stylex.ts'),
  );

  return typeof result === 'string' ? result : (result?.code ?? '');
})();

const toVariableName = (reference: string) =>
  reference.slice('var('.length, -1);

afterEach(cleanup);

type ReadDeclarationArgs = {
  readonly className: string | undefined;
  readonly property: string;
};

const readDeclaration = ({ className = '', property }: ReadDeclarationArgs) =>
  className
    .split(' ')
    .map((name) => compiledRules.get(name))
    .find((rule) => rule?.property === property)?.value;

describe('the compiled cell styles read the density variables', () => {
  it('compiles every cell module the suite reads', () => {
    expect(compiledRules.size).toBeGreaterThan(0);
  });

  it.each([
    {
      className: stylex.props(tableBodyCellStyles.base(60, 60)).className,
      font: tableDensityVars.bodyFontSize,
      name: 'body cell',
      padding: tableDensityVars.bodyPaddingInline,
    },
    {
      className: stylex.props(tableHeaderCellStyles.base(60, 60)).className,
      font: tableDensityVars.headerFontSize,
      name: 'header cell',
      padding: tableDensityVars.headerPaddingInline,
    },
    {
      className: stylex.props(tableHeaderBandStyles.base(120)).className,
      font: tableDensityVars.headerBandFontSize,
      name: 'header band',
      padding: tableDensityVars.headerPaddingInline,
    },
  ])(
    'the $name takes its font size and inline padding from the density',
    ({ className, font, padding }) => {
      expect(readDeclaration({ className, property: 'font-size' })).toBe(font);
      expect(readDeclaration({ className, property: 'padding-inline' })).toBe(
        padding,
      );
    },
  );

  it.each([
    {
      className: stylex.props(tableGroupKeyCellStyles.container).className,
      name: 'group key cell',
    },
    {
      className: stylex.props(badgeStyles.pill).className,
      name: 'badge',
    },
  ])('the $name takes its font size from the body density', ({ className }) => {
    expect(readDeclaration({ className, property: 'font-size' })).toBe(
      tableDensityVars.bodyFontSize,
    );
  });

  it('puts those rules on the cells a rendered table draws', () => {
    render(
      <Table
        columns={COLUMNS}
        density='dense'
        response={[{ id: 1, value: 2 }]}
      />,
    );

    const [bodyCell] = screen.getAllByRole('gridcell');
    const [headerCell] = screen.getAllByRole('columnheader');

    expect(
      readDeclaration({
        className: bodyCell?.className,
        property: 'font-size',
      }),
    ).toBe(tableDensityVars.bodyFontSize);
    expect(
      readDeclaration({
        className: bodyCell?.className,
        property: 'padding-inline',
      }),
    ).toBe(tableDensityVars.bodyPaddingInline);
    expect(
      readDeclaration({
        className: headerCell?.className,
        property: 'font-size',
      }),
    ).toBe(tableDensityVars.headerFontSize);
    expect(
      readDeclaration({
        className: headerCell?.className,
        property: 'padding-inline',
      }),
    ).toBe(tableDensityVars.headerPaddingInline);
  });

  it.each([
    { compactValue: typography.fontSizeSm, name: 'bodyFontSize' },
    { compactValue: spacing.xs, name: 'bodyPaddingInline' },
    { compactValue: typography.fontSizeXs, name: 'headerBandFontSize' },
    { compactValue: typography.fontSizeSm, name: 'headerFontSize' },
    { compactValue: spacing.xs, name: 'headerPaddingInline' },
  ] as const)(
    'falls back to the compact $name when no level sets the variable',
    ({ compactValue, name }) => {
      expect(compiledDensityDefaults).toContain(
        `${toVariableName(tableDensityVars[name])}:${compactValue}`,
      );
    },
  );
});
