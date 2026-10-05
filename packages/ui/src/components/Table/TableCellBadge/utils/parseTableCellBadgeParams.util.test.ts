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
    ).toEqual({ message: 'unknown param "tones"', path: ['tones'] });
  });

  it('rejects missing rules', () => {
    expect(parseTableCellBadgeParams({}).issues?.[0]?.path).toEqual(['rules']);
  });

  it('rejects a blank fallbackTone', () => {
    expect(
      parseTableCellBadgeParams({ fallbackTone: '', rules: [] }).issues?.[0]
        ?.path,
    ).toEqual(['fallbackTone']);
  });

  it('names every malformed rule by index', () => {
    expect(
      parseTableCellBadgeParams({
        rules: [{ gte: 4, tone: 'success' }, { gt: 3, tone: 'x' }, 'y'],
      }).issues?.map((issue) => issue.path),
    ).toEqual([
      ['rules', 1],
      ['rules', 2],
    ]);
  });
});
