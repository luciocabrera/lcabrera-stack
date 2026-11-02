import { describe, expect, it } from 'vite-plus/test';

import { parseStylexRule } from './parseStylexRule.util';

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
