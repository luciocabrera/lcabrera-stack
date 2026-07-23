import { describe, expect, it } from 'vite-plus/test';

import { buildOptionalNumericClauses } from './build-optional-numeric-clauses.util.ts';

describe('buildOptionalNumericClauses', () => {
  it('returns an empty result when every clause value is undefined', () => {
    const result = buildOptionalNumericClauses({
      clauses: [
        { keyword: 'LIMIT', value: undefined },
        { keyword: 'OFFSET', value: undefined },
      ],
      startParamIndex: 1,
    });

    expect(result).toEqual({ text: '', values: [] });
  });

  it('builds a single LIMIT clause with a placeholder', () => {
    const result = buildOptionalNumericClauses({
      clauses: [{ keyword: 'LIMIT', value: 10 }],
      startParamIndex: 1,
    });

    expect(result).toEqual({ text: 'LIMIT $1', values: [10] });
  });

  it('builds LIMIT and OFFSET clauses with incrementing placeholders', () => {
    const result = buildOptionalNumericClauses({
      clauses: [
        { keyword: 'LIMIT', value: 10 },
        { keyword: 'OFFSET', value: 20 },
      ],
      startParamIndex: 3,
    });

    expect(result).toEqual({ text: 'LIMIT $3 OFFSET $4', values: [10, 20] });
  });

  it('skips an undefined clause without leaving a gap in the remaining placeholder numbering', () => {
    const result = buildOptionalNumericClauses({
      clauses: [
        { keyword: 'LIMIT', value: undefined },
        { keyword: 'OFFSET', value: 20 },
      ],
      startParamIndex: 1,
    });

    expect(result).toEqual({ text: 'OFFSET $1', values: [20] });
  });
});
