import { describe, expect, it } from 'vite-plus/test';

import { styles } from '#ui/components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { listStyleTextContrasts } from './listStyleTextContrasts.util';

const PATH =
  'components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts';

const SOURCES = import.meta.glob<string>(
  '../../components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts',
  { eager: true, import: 'default', query: '?raw' },
);

describe('listStyleTextContrasts', () => {
  it('measures a style against the background it sets, in both themes', async () => {
    await expect(
      listStyleTextContrasts({
        path: PATH,
        sources: SOURCES,
        styles: { badgeNo: styles.badgeNo },
      }),
    ).resolves.toEqual(
      (['light', 'dark'] as const).map((theme) => ({
        background: 'errorBackground',
        foreground: 'errorCardText',
        name: 'badgeNo',
        ratio: getThemeTokenContrast({
          background: colors.errorBackground,
          foreground: colors.errorCardText,
          theme,
        }),
        theme,
      })),
    );
  });

  it('measures a style that sets no background against each background named', async () => {
    const measured = await listStyleTextContrasts({
      backgrounds: [colors.backgroundPrimary, colors.surfaceElevated],
      path: PATH,
      sources: SOURCES,
      styles: { label: styles.label },
    });

    expect(
      measured.map(({ background, theme }) => `${theme} ${background}`),
    ).toEqual([
      'light backgroundPrimary',
      'light surfaceElevated',
      'dark backgroundPrimary',
      'dark surfaceElevated',
    ]);
  });

  it('refuses a style that sets no text colour', async () => {
    await expect(
      listStyleTextContrasts({
        path: PATH,
        sources: SOURCES,
        styles: { item: styles.item },
      }),
    ).rejects.toThrow('item sets no text colour');
  });

  it('refuses a style that sets no background when none is named', async () => {
    await expect(
      listStyleTextContrasts({
        path: PATH,
        sources: SOURCES,
        styles: { label: styles.label },
      }),
    ).rejects.toThrow('label sets no background and none is named');
  });

  it('refuses backgrounds named for a style that sets its own', async () => {
    await expect(
      listStyleTextContrasts({
        backgrounds: [colors.backgroundPrimary],
        path: PATH,
        sources: SOURCES,
        styles: { badgeYes: styles.badgeYes },
      }),
    ).rejects.toThrow('badgeYes sets its own background, so none can be named');
  });

  it('refuses anything but the one module source', async () => {
    await expect(
      listStyleTextContrasts({ path: PATH, sources: {}, styles: {} }),
    ).rejects.toThrow(`Expected the source of ${PATH} alone`);
  });
});
