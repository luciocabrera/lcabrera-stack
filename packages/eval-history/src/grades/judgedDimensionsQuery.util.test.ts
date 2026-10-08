import { describe, expect, it } from 'vite-plus/test';

import { judgedDimensionsQuery } from './judgedDimensionsQuery.util.ts';

describe('judgedDimensionsQuery', () => {
  it("reads only the names of a quality trial's judged dimensions", () => {
    const query = judgedDimensionsQuery({ trialId: '42' });

    expect(query.values).toEqual(['42', 'quality/1']);
    expect(query.text).toContain("->> 'name' as name");
    expect(query.text).not.toContain('score');
    expect(query.text).not.toContain('feedback');
  });
});
