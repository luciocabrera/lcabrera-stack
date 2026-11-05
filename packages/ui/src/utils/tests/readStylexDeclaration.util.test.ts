import { describe, expect, it } from 'vite-plus/test';

import type { CompiledStylexRule } from './tests.types';

import { readStylexDeclaration } from './readStylexDeclaration.util';

const RULES: readonly CompiledStylexRule[] = [
  { className: 'x1', property: 'color', pseudo: '', value: 'red' },
  { className: 'x2', property: 'outline', pseudo: '', value: 'none' },
  {
    className: 'x3',
    property: 'outline',
    pseudo: ':focus-visible',
    value: '2px solid blue',
  },
  { className: 'x4', property: 'color', pseudo: '', value: 'green' },
];

describe('readStylexDeclaration', () => {
  it('reads the declaration one of the element classes sets for a property', () => {
    expect(
      readStylexDeclaration({
        className: 'x1 x2 x3',
        property: 'color',
        rules: RULES,
      }),
    ).toBe('red');
  });

  it('separates the resting value from a pseudo-class value', () => {
    expect(
      readStylexDeclaration({
        className: 'x1 x2 x3',
        property: 'outline',
        rules: RULES,
      }),
    ).toBe('none');
    expect(
      readStylexDeclaration({
        className: 'x1 x2 x3',
        property: 'outline',
        pseudo: ':focus-visible',
        rules: RULES,
      }),
    ).toBe('2px solid blue');
  });

  it('reads only the classes the element carries', () => {
    expect(
      readStylexDeclaration({
        className: 'x4',
        property: 'color',
        rules: RULES,
      }),
    ).toBe('green');
    expect(
      readStylexDeclaration({
        className: 'x9',
        property: 'color',
        rules: RULES,
      }),
    ).toBeUndefined();
    expect(
      readStylexDeclaration({
        className: undefined,
        property: 'color',
        rules: RULES,
      }),
    ).toBeUndefined();
  });

  it('reads nothing for a property no carried class sets', () => {
    expect(
      readStylexDeclaration({
        className: 'x1 x2',
        property: 'cursor',
        rules: RULES,
      }),
    ).toBeUndefined();
  });
});
