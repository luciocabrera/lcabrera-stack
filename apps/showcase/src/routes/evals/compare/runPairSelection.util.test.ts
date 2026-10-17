import { describe, expect, it } from 'vite-plus/test';

import { runPairSelection } from './runPairSelection.util';

const RUN = '00000000-0000-4000-8000-00000000000a';

describe('runPairSelection', () => {
  it('selects two well-formed run ids', () => {
    expect(runPairSelection({ a: RUN, b: RUN })).toEqual({
      a: RUN,
      b: RUN,
      kind: 'runs',
    });
  });

  it('refuses a pair with a side missing or malformed', () => {
    expect(runPairSelection({ a: RUN, b: '' })).toEqual({ kind: 'invalid' });
    expect(runPairSelection({ a: 'run', b: RUN })).toEqual({ kind: 'invalid' });
  });
});
