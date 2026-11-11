import { describe, expect, it } from 'vite-plus/test';

import {
  SAME_AS_ROWS_PREFERENCE,
  TABLE_DENSITY_PREFERENCE_OPTIONS,
  TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS,
  TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS,
} from './tableDisplayPreferences.constants';

const descriptions = (options: readonly { readonly description?: string }[]) =>
  options.map((option) => option.description);

describe('table display preference options', () => {
  it('describes each row level by its row height', () => {
    expect(descriptions(TABLE_DENSITY_PREFERENCE_OPTIONS)).toStrictEqual([
      '24px rows',
      '32px rows',
      '40px rows',
      '48px rows',
    ]);
  });

  it('leads the column headers with Same as rows, then each level by its height', () => {
    expect(TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS[0]?.value).toBe(
      SAME_AS_ROWS_PREFERENCE,
    );
    expect(
      descriptions(TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS.slice(1)),
    ).toStrictEqual(['24px tall', '32px tall', '40px tall', '48px tall']);
  });

  it('leads the title bar with Same as rows, then names each level with no height', () => {
    expect(TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS[0]?.value).toBe(
      SAME_AS_ROWS_PREFERENCE,
    );
    expect(
      TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS.slice(1).map((option) =>
        Object.hasOwn(option, 'description'),
      ),
    ).toStrictEqual([false, false, false, false]);
  });
});
