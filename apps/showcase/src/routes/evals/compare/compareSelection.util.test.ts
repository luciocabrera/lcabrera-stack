import { describe, expect, it } from 'vite-plus/test';

import { compareSelection } from './compareSelection.util';

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const select = (search: string) =>
  compareSelection(new URLSearchParams(search));

describe('compareSelection', () => {
  it('compares two named runs', () => {
    expect(select(`a=${RUN_A}&b=${RUN_B}`)).toEqual({
      a: RUN_A,
      b: RUN_B,
      kind: 'runs',
    });
  });

  it('refuses a pair with a missing or malformed run id', () => {
    expect(select(`a=${RUN_A}`)).toEqual({ kind: 'invalid' });
    expect(select(`a=${RUN_A}&b=nope`)).toEqual({ kind: 'invalid' });
  });

  it('compares a branch against main, optionally in one suite', () => {
    expect(select('branch=feat/1278-x')).toEqual({
      branch: 'feat/1278-x',
      kind: 'branch',
      suite: undefined,
    });
    expect(select('branch=feat/x&suite=skills')).toMatchObject({
      suite: 'skills',
    });
  });

  it('refuses an unknown suite or an implausible branch', () => {
    expect(select('branch=feat/x&suite=other')).toEqual({ kind: 'invalid' });
    expect(select('branch=a b')).toEqual({ kind: 'invalid' });
  });

  it('asks for a choice when nothing is named', () => {
    expect(select('')).toEqual({ kind: 'pick' });
  });
});
