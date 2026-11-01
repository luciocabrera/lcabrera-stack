import { describe, expect, it } from 'vite-plus/test';

import {
  compileStylexRules,
  readStylexDeclaration,
} from './compileStylexRules.util';

const SOURCE = `
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  box: {
    color: 'red',
    outline: { default: 'none', ':focus-visible': '2px solid blue' },
  },
});
`;

const rules = await compileStylexRules([
  { path: 'utils/tests/compileStylexRulesFixture.stylex.ts', source: SOURCE },
]);

type FindClassNameArgs = {
  readonly property: string;
  readonly pseudo: string;
};

const findClassName = ({ property, pseudo }: FindClassNameArgs) =>
  rules.find((rule) => rule.property === property && rule.pseudo === pseudo)
    ?.className;

const className = [
  findClassName({ property: 'color', pseudo: '' }),
  findClassName({ property: 'outline', pseudo: '' }),
  findClassName({ property: 'outline', pseudo: ':focus-visible' }),
].join(' ');

describe('compileStylexRules', () => {
  it('reads one rule per declaration, with its pseudo-class', () => {
    expect(
      rules.map(({ property, pseudo, value }) => ({ property, pseudo, value })),
    ).toEqual(
      expect.arrayContaining([
        { property: 'color', pseudo: '', value: 'red' },
        { property: 'outline', pseudo: '', value: 'none' },
        {
          property: 'outline',
          pseudo: ':focus-visible',
          value: '2px solid blue',
        },
      ]),
    );
  });

  it('compiles nothing from no modules', async () => {
    expect(await compileStylexRules([])).toEqual([]);
  });
});

describe('readStylexDeclaration', () => {
  it('reads the declaration a class name sets for a property', () => {
    expect(readStylexDeclaration({ className, property: 'color', rules })).toBe(
      'red',
    );
  });

  it('separates the resting value from a pseudo-class value', () => {
    expect(
      readStylexDeclaration({ className, property: 'outline', rules }),
    ).toBe('none');
    expect(
      readStylexDeclaration({
        className,
        property: 'outline',
        pseudo: ':focus-visible',
        rules,
      }),
    ).toBe('2px solid blue');
  });

  it('reads nothing for a class the element does not carry', () => {
    expect(
      readStylexDeclaration({
        className: 'xmissing',
        property: 'color',
        rules,
      }),
    ).toBeUndefined();
    expect(
      readStylexDeclaration({ className: undefined, property: 'color', rules }),
    ).toBeUndefined();
  });

  it('reads nothing for a property the class does not set', () => {
    expect(
      readStylexDeclaration({ className, property: 'cursor', rules }),
    ).toBeUndefined();
  });
});
