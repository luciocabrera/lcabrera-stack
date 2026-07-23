import { describe, expect, it } from 'vite-plus/test';

import { classifyFileTypeCategory } from './classifyFileTypeCategory.util.ts';

describe('classifyFileTypeCategory', () => {
  it.each([
    { expected: 'component', fileName: 'Button.component.tsx' },
    { expected: 'hook', fileName: 'useStore.hook.ts' },
    { expected: 'util', fileName: 'formatDate.util.ts' },
    { expected: 'test', fileName: 'api.util.test.ts' },
    { expected: 'test', fileName: 'fetchAndValidate.util.spec.ts' },
    { expected: 'repository', fileName: 'users.repository.ts' },
    { expected: 'controller', fileName: 'users.controller.ts' },
    { expected: 'route', fileName: 'users.route.ts' },
    { expected: 'types', fileName: 'Table.types.ts' },
    { expected: 'stylex', fileName: 'Card.stylex.ts' },
    { expected: 'constants', fileName: 'api.constants.ts' },
    { expected: 'schema', fileName: 'report.schema.ts' },
    { expected: 'other', fileName: 'README.md' },
  ])('classifies $fileName as $expected', ({ expected, fileName }) => {
    expect(classifyFileTypeCategory(fileName)).toBe(expected);
  });
});
