import { describe, expect, it } from 'vite-plus/test';

import { resolveCellContent } from './resolveCellContent.util';

describe('resolveCellContent', () => {
  it('keeps supplied children as they are', () => {
    const children = <strong>custom</strong>;

    expect(
      resolveCellContent({ children, dataType: 'string', value: 'raw' }),
    ).toBe(children);
  });

  it('formats the value by its dataType when no children are supplied', () => {
    expect(
      resolveCellContent({
        children: undefined,
        dataType: 'string',
        value: 'raw',
      }),
    ).toBe('raw');
  });
});
