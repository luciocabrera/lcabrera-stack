import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules } from './compileStylexRules.util';

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
