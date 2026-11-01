import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules, parseStylexRule } from './compileStylexRules.util';
import { readStylexDeclaration } from './readStylexDeclaration.util';

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

describe('parseStylexRule', () => {
  it('reads a class rule', () => {
    expect(parseStylexRule('.x1abc{color:red}')).toEqual({
      className: 'x1abc',
      property: 'color',
      pseudo: '',
      value: 'red',
    });
  });

  it('reads a pseudo-class rule and keeps colons in the value', () => {
    expect(
      parseStylexRule('.x2def:focus-visible{outline:2px solid var(--x3)}'),
    ).toEqual({
      className: 'x2def',
      property: 'outline',
      pseudo: ':focus-visible',
      value: '2px solid var(--x3)',
    });
    expect(parseStylexRule('.x4{background-image:url(a:b)}')?.value).toBe(
      'url(a:b)',
    );
  });

  it.each([
    '@media (min-width: 1px){.x1{color:red}}',
    '.x1{color:red',
    'x1{color:red}',
    '.x1',
    '.x1{}',
    ':root{--x1:red}',
  ])('skips %s', (css) => {
    expect(parseStylexRule(css)).toBeUndefined();
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
