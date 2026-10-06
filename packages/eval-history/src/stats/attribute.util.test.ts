import { describe, expect, it } from 'vite-plus/test';

import type { HashSet } from './stats.types.ts';

import { attribute } from './attribute.util.ts';

const before = { catalog: 'c1', skill: 's1', task: 't1' };

describe('attribute', () => {
  it('reports none when no hash changed', () => {
    expect(attribute({ after: { ...before }, before })).toEqual({
      kind: 'none',
    });
  });

  it('names the one hash that changed', () => {
    expect(attribute({ after: { ...before, skill: 's2' }, before })).toEqual({
      changed: 'skill',
      kind: 'single',
    });
  });

  it('treats a hash recorded as null and a missing one as the same input', () => {
    const recordedNull: HashSet = JSON.parse('{"judge":null}');

    expect(
      attribute({ after: { ...before, ...recordedNull, task: 't2' }, before }),
    ).toEqual({ changed: 'task', kind: 'single' });
  });

  it('lists every changed hash, including one only one side has', () => {
    expect(
      attribute({ after: { ...before, judge: 'j1', task: 't2' }, before }),
    ).toEqual({ changed: ['judge', 'task'], kind: 'multiple' });
  });
});
