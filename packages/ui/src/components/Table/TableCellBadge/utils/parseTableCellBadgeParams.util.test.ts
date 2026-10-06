import { describe, expect, it } from 'vite-plus/test';

import { parseTableCellBadgeParams } from './parseTableCellBadgeParams.util';

describe('parseTableCellBadgeParams', () => {
  it('defaults fallbackTone to neutral', () => {
    expect(
      parseTableCellBadgeParams({ rules: [{ gte: 4, tone: 'success' }] }),
    ).toEqual({
      value: { fallbackTone: 'neutral', rules: [{ gte: 4, tone: 'success' }] },
    });
  });

  it('keeps an explicit fallbackTone', () => {
    expect(
      parseTableCellBadgeParams({ fallbackTone: 'info', rules: [] }),
    ).toEqual({ value: { fallbackTone: 'info', rules: [] } });
  });

  it('rejects params that are not an object', () => {
    expect(parseTableCellBadgeParams('x').issues).toHaveLength(1);
  });

  it('rejects an unknown param', () => {
    expect(
      parseTableCellBadgeParams({ rules: [], tones: [] }).issues?.[0],
    ).toEqual({ message: 'unknown param "tones"' });
  });

  it('defaults rules to an empty list, so only fallbackTone applies', () => {
    expect(parseTableCellBadgeParams({})).toEqual({
      value: { fallbackTone: 'neutral', rules: [] },
    });
    expect(parseTableCellBadgeParams({ fallbackTone: 'info' })).toEqual({
      value: { fallbackTone: 'info', rules: [] },
    });
  });

  it('rejects rules that are present but not an array', () => {
    expect(parseTableCellBadgeParams({ rules: 'x' }).issues?.[0]?.message).toBe(
      'rules must be an array',
    );
  });

  it('rejects a blank fallbackTone', () => {
    expect(
      parseTableCellBadgeParams({ fallbackTone: '', rules: [] }).issues?.[0]
        ?.message,
    ).toBe('fallbackTone must be a tone name');
  });

  it('names every malformed rule by index', () => {
    expect(
      parseTableCellBadgeParams({
        rules: [{ gte: 4, tone: 'success' }, { gt: 3, tone: 'x' }, 'y'],
      }).issues?.map((issue) => issue.message),
    ).toEqual([
      'rules[1]: unknown rule key "gt"',
      'rules[2]: a rule must be an object',
    ]);
  });
});
