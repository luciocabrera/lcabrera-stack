import { describe, expect, it } from 'vitest';

import { classifyFileTypeCategory } from './classifyFileTypeCategory.util.ts';

describe('classifyFileTypeCategory', () => {
  it.each([
    ['Button.component.tsx', 'component'],
    ['useStore.hook.ts', 'hook'],
    ['formatDate.util.ts', 'util'],
    ['api.util.test.ts', 'test'],
    ['fetchAndValidate.util.spec.ts', 'test'],
    ['users.repository.ts', 'repository'],
    ['users.controller.ts', 'controller'],
    ['users.route.ts', 'route'],
    ['Table.types.ts', 'types'],
    ['Card.stylex.ts', 'stylex'],
    ['api.constants.ts', 'constants'],
    ['report.schema.ts', 'schema'],
    ['README.md', 'other'],
  ])('classifies %s as %s', (fileName, expected) => {
    expect(classifyFileTypeCategory(fileName)).toBe(expected);
  });
});
