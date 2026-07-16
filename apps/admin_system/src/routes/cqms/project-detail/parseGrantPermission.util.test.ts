import { describe, expect, it } from 'vitest';

import { parseGrantPermission } from './parseGrantPermission.util';

describe('parseGrantPermission', () => {
  it('splits a curated action:resourceType option', () => {
    expect(parseGrantPermission({ permission: 'update:project' })).toEqual({
      action: 'update',
      resourceType: 'project',
    });
  });

  it('keeps only the first two segments', () => {
    expect(parseGrantPermission({ permission: 'read:run:extra' })).toEqual({
      action: 'read',
      resourceType: 'run',
    });
  });

  it('falls back to empty strings for a shapeless value the DB will reject', () => {
    expect(parseGrantPermission({ permission: '' })).toEqual({
      action: '',
      resourceType: '',
    });
    expect(parseGrantPermission({ permission: 'update' })).toEqual({
      action: 'update',
      resourceType: '',
    });
  });
});
