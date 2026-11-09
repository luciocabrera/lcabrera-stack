import { describe, expect, it } from 'vite-plus/test';

import { styles } from '#ui/components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

import { getColorTokenName } from './getColorTokenName.util';
import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { listStyleTextContrasts } from './listStyleTextContrasts.util';
import { PAGE_BACKGROUNDS } from './tests.constants';

const SOURCES = import.meta.glob(
  '/src/components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts',
  { query: '?raw' },
);

describe('listStyleTextContrasts', () => {
  it('measures a style on the background it sets, over every page surface, in both themes', async () => {
    await expect(
      listStyleTextContrasts({
        sources: SOURCES,
        styles: { badgeNo: styles.badgeNo },
      }),
    ).resolves.toEqual(
      (['light', 'dark'] as const).flatMap((theme) =>
        PAGE_BACKGROUNDS.map((surface) => ({
          background: 'errorBackground',
          foreground: 'errorCardText',
          name: 'badgeNo',
          ratio: getThemeTokenContrast({
            background: colors.errorBackground,
            foreground: colors.errorCardText,
            surface,
            theme,
          }),
          surface: getColorTokenName(surface),
          theme,
        })),
      ),
    );
  });

  it('measures a style that sets no background against each background named', async () => {
    const measured = await listStyleTextContrasts({
      backgrounds: [colors.backgroundPrimary, colors.surfaceElevated],
      sources: SOURCES,
      styles: { label: styles.label },
    });

    expect(
      measured.map(
        ({ background, surface, theme }) => `${theme} ${background} ${surface}`,
      ),
    ).toEqual([
      'light backgroundPrimary backgroundPrimary',
      'light surfaceElevated backgroundPrimary',
      'dark backgroundPrimary backgroundPrimary',
      'dark surfaceElevated backgroundPrimary',
    ]);
  });

  it('refuses a style that sets no text colour', async () => {
    await expect(
      listStyleTextContrasts({
        sources: SOURCES,
        styles: { item: styles.item },
      }),
    ).rejects.toThrow('item sets no text colour');
  });

  it('refuses a style that sets no background when none is named', async () => {
    await expect(
      listStyleTextContrasts({
        sources: SOURCES,
        styles: { label: styles.label },
      }),
    ).rejects.toThrow('label sets no background and none is named');
  });

  it('refuses backgrounds named for a style that sets its own', async () => {
    await expect(
      listStyleTextContrasts({
        backgrounds: [colors.backgroundPrimary],
        sources: SOURCES,
        styles: { badgeYes: styles.badgeYes },
      }),
    ).rejects.toThrow('badgeYes sets its own background, so none can be named');
  });

  it('refuses anything but the one module source', async () => {
    await expect(
      listStyleTextContrasts({ sources: {}, styles: {} }),
    ).rejects.toThrow('Expected the source of one StyleX module');
  });

  it('refuses a module that was not read as raw source', async () => {
    await expect(
      listStyleTextContrasts({
        sources: { '/src/fake.stylex.ts': async () => ({ styles: {} }) },
        styles: {},
      }),
    ).rejects.toThrow('/src/fake.stylex.ts was not read as raw source');
  });
});
