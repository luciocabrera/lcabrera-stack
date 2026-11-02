import { describe, expect, it } from 'vite-plus/test';

import { readStylexRules } from './readStylexRules.util';

describe('readStylexRules', () => {
  it('reads every single-class rule the plugin emits, in order', () => {
    const code = [
      'import "x";',
      '_inject({ ltr: ".x1{color:red}", priority: 3000 });',
      '_inject({ ltr: ".x2:hover{color:blue}", priority: 3130 });',
    ].join('\n');

    expect(readStylexRules(code)).toEqual([
      { className: 'x1', property: 'color', pseudo: '', value: 'red' },
      { className: 'x2', property: 'color', pseudo: ':hover', value: 'blue' },
    ]);
  });

  it('skips a rule it cannot read', () => {
    expect(
      readStylexRules(
        '_inject({ ltr: "@media (min-width: 1px){.x1{color:red}}" }); _inject({ ltr: ".x3{cursor:pointer}" });',
      ),
    ).toEqual([
      { className: 'x3', property: 'cursor', pseudo: '', value: 'pointer' },
    ]);
  });

  it('reads nothing from code with no rules', () => {
    expect(readStylexRules('export const styles = {};')).toEqual([]);
  });
});
