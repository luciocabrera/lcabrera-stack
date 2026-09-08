import { describe, expect, it } from 'vite-plus/test';

import { resolveDeclaredWidth } from './resolveDeclaredWidth.util';

const run = (declared: unknown) =>
  resolveDeclaredWidth({ declared, fallback: 200 });

describe('resolveDeclaredWidth', () => {
  it('takes the width the build declared', () => {
    expect([run('320'), run(320), run('320.5')]).toStrictEqual([
      320, 320, 320.5,
    ]);
  });

  it('falls back to what an environment can hold but a width cannot be', () => {
    expect([
      run('wide'),
      run(''),
      run(undefined),
      run('0'),
      run('-4'),
      run('Infinity'),
    ]).toStrictEqual([200, 200, 200, 200, 200, 200]);
  });
});
