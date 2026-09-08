import { describe, expect, it } from 'vite-plus/test';

import { resolveSettingsPanelWidth } from './resolveSettingsPanelWidth.util';

describe('resolveSettingsPanelWidth', () => {
  it('takes a width the reader settled on', () => {
    expect(resolveSettingsPanelWidth(480)).toBe(480);
  });

  it('refuses what a cookie can hold but a width cannot be', () => {
    expect([
      resolveSettingsPanelWidth('480'),
      resolveSettingsPanelWidth(NaN),
      resolveSettingsPanelWidth(Infinity),
      resolveSettingsPanelWidth(0),
      resolveSettingsPanelWidth(-320),
      resolveSettingsPanelWidth(undefined),
    ]).toStrictEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
