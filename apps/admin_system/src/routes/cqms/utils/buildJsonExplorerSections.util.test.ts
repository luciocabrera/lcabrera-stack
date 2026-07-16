import { describe, expect, it } from 'vitest';

import { buildJsonExplorerSections } from './buildJsonExplorerSections.util';

describe('buildJsonExplorerSections', () => {
  it('returns a "root" section when raw_json itself is an array of objects', () => {
    const sections = buildJsonExplorerSections([
      { file: 'a.ts', rule: 'no-var' },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.label).toBe('root');
    expect(sections[0]?.rows).toEqual([{ file: 'a.ts', rule: 'no-var' }]);
  });

  it('creates one section per top-level array-of-objects key', () => {
    const sections = buildJsonExplorerSections({
      eslint: [{ ruleId: 'eqeqeq' }],
      kind: 'combined',
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.label).toBe('eslint');
    expect(sections[0]?.rows).toEqual([{ ruleId: 'eqeqeq' }]);
  });

  it("unwraps oxlint's nested diagnostics array", () => {
    const sections = buildJsonExplorerSections({
      oxlint: { diagnostics: [{ code: 'no-redeclare' }], number_of_files: 1 },
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]?.label).toBe('oxlint.diagnostics');
    expect(sections[0]?.rows).toEqual([{ code: 'no-redeclare' }]);
  });

  it('returns an empty array for a scalar or null raw_json', () => {
    // eslint-disable-next-line unicorn/no-null -- real Postgres jsonb column can genuinely be SQL NULL
    expect(buildJsonExplorerSections(null)).toEqual([]);
    expect(buildJsonExplorerSections('not json')).toEqual([]);
  });

  it('ignores keys whose value is not an array of objects', () => {
    const sections = buildJsonExplorerSections({
      count: 3,
      tags: ['a', 'b'],
    });

    expect(sections).toEqual([]);
  });
});
