import type { ComponentPropsWithRef } from 'react';

import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { TableProps } from '../Table.types';

import { splitTableProps } from './splitTableProps.util';

type ExpectedOwnKey = keyof Omit<
  TableProps<Record<string, unknown>, unknown>,
  Exclude<keyof ComponentPropsWithRef<'table'>, 'title'>
>;

type SplitArgs = Parameters<typeof splitTableProps>[0];

const OWN_KEYS = [
  'actions',
  'caption',
  'cellPalette',
  'cellRenderers',
  'columns',
  'customStylex',
  'dataErrorSelector',
  'dataSelector',
  'dataTotalSelector',
  'density',
  'features',
  'footer',
  'headerDensity',
  'icon',
  'isFlexWrapperEnabled',
  'isLoading',
  'layout',
  'onLoadMore',
  'response',
  'title',
] as const;

const toArgs = (props: Readonly<Record<string, unknown>>) =>
  props as unknown as SplitArgs;

const everyOwnProp = Object.fromEntries(
  OWN_KEYS.map((key) => [key, `own ${key}`]),
);

describe('splitTableProps', () => {
  it('keeps every own prop out of the <table> rest', () => {
    const { own, tableProps } = splitTableProps(toArgs(everyOwnProp));

    expect(own).toStrictEqual(everyOwnProp);
    expect(tableProps).toStrictEqual({});
  });

  it('passes native attributes through to the <table> rest', () => {
    const native = {
      'aria-label': 'Weekly scores',
      'data-origin': 'scores',
      id: 'weekly-scores',
    };
    const { own, tableProps } = splitTableProps(
      toArgs({ ...everyOwnProp, ...native }),
    );

    expect(tableProps).toStrictEqual(native);
    expect(new Set(Object.keys(own))).toStrictEqual(new Set(OWN_KEYS));
  });

  it('keeps title as an own prop, though <table> also has that attribute', () => {
    const { own, tableProps } = splitTableProps(toArgs({ title: 'Scores' }));

    expect(own.title).toBe('Scores');
    expect(Object.hasOwn(tableProps, 'title')).toBe(false);
  });

  it('types the own list as exactly the keys TableProps adds, plus title', () => {
    expectTypeOf<
      keyof ReturnType<typeof splitTableProps>['own']
    >().toEqualTypeOf<ExpectedOwnKey>();
    expectTypeOf<(typeof OWN_KEYS)[number]>().toEqualTypeOf<ExpectedOwnKey>();
  });
});
