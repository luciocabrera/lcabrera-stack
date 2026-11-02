import type { Locator, Page, TestInfo } from '@playwright/test';

import { expect, test } from '@playwright/test';

type Fact = readonly [term: string, value: string];

type LinkArgs = {
  readonly href: string;
  readonly name: string;
  readonly scope: Locator | Page;
};

type ThemesArgs = {
  readonly name: string;
  readonly open?: (page: Page, path: string) => Promise<unknown>;
  readonly page: Page;
  readonly path: string;
  readonly testInfo: TestInfo;
};

const THEME_COOKIE = 'react-router-theme';

const THEMES = [
  { control: 'Dark Mode', theme: 'light' },
  { control: 'Light Mode', theme: 'dark' },
] as const;

export const mainOf = (page: Page) => page.getByRole('main');

export const openEvals = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(mainOf(page).getByRole('heading', { level: 1 })).toBeVisible();
};

export const expectFacts = async (page: Page, facts: readonly Fact[]) => {
  const terms = await mainOf(page).getByRole('term').allInnerTexts();
  const values = await mainOf(page).getByRole('definition').allInnerTexts();

  expect(
    terms.map((term, index) => [term.trim(), values[index]?.trim()]),
  ).toEqual(facts);
};

export const expectLink = async ({ href, name, scope }: LinkArgs) => {
  await expect(scope.getByRole('link', { exact: true, name })).toHaveAttribute(
    'href',
    href,
  );
};

type BoundaryArgs = {
  readonly message: Locator;
  readonly page: Page;
};

export const expectRouteErrorBoundary = async ({
  message,
  page,
}: BoundaryArgs) => {
  await expect(
    mainOf(page).getByRole('heading', {
      exact: true,
      name: 'An error occurred',
    }),
  ).toBeVisible();
  await expect(mainOf(page).getByRole('heading', { level: 1 })).toHaveCount(0);
  await expect(message).toBeVisible();

  await Promise.all(
    ['Home', 'Retry'].map((name) =>
      expect(
        mainOf(page).getByRole('button', { exact: true, name }),
      ).toBeVisible(),
    ),
  );
};

type TrialHrefArgs = {
  readonly runId: string;
  readonly target: Locator;
};

export const expectTrialHref = async ({ runId, target }: TrialHrefArgs) => {
  const url = new URL(
    (await target.getAttribute('href')) ?? '',
    test.info().project.use.baseURL,
  );

  expect(url.pathname).toBe(`/evals/runs/${runId}`);
  expect(url.searchParams.keys().toArray()).toEqual(['trial']);
  expect(url.searchParams.get('trial')).toMatch(/^\d+$/u);

  return url.searchParams.get('trial') ?? '';
};

export const rowOf = (page: Page, name: string) =>
  mainOf(page).getByRole('row', { exact: true, name });

export const cellsOf = (row: Locator) =>
  row.getByRole('cell').or(row.getByRole('gridcell'));

export const colorOf = (target: Locator) =>
  target.evaluate((element) => getComputedStyle(element).color);

type PaintArgs = {
  readonly below?: number;
  readonly target: Locator;
  readonly within?: Locator;
};

export const paintAt = async ({
  below = 0,
  target,
  within = target,
}: PaintArgs) => {
  await target.scrollIntoViewIfNeeded();

  const box = await target.boundingBox();

  if (box === null) {
    throw new Error('the mark has no box to paint');
  }

  return within.evaluate(
    (root, { x, y }) => {
      const painted = document.elementFromPoint(x, y);

      return painted !== null && root.contains(painted)
        ? getComputedStyle(painted).fill
        : 'outside';
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 + below },
  );
};

export const distinctColours = async (target: Locator) => {
  const bytes = [...(await target.screenshot())];

  return target.page().evaluate(async (png) => {
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(png)], { type: 'image/png' }),
    );
    const inset = 3;
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');

    context?.drawImage(bitmap, 0, 0);

    const pixels =
      context?.getImageData(
        inset,
        inset,
        bitmap.width - inset * 2,
        bitmap.height - inset * 2,
      ).data ?? new Uint8ClampedArray();
    const colours = new Set<string>();

    for (let index = 0; index < pixels.length; index += 4) {
      colours.add(pixels.slice(index, index + 3).join(','));
    }

    return colours.size;
  }, bytes);
};

export const paintOf = (target: Locator) => paintAt({ target });

export const expectRightAligned = async (cell: Locator) => {
  const gaps = await cell.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const boxes: DOMRect[] = [];

    for (
      let node = walker.nextNode();
      node !== null;
      node = walker.nextNode()
    ) {
      if (!node.textContent?.trim()) {
        continue;
      }

      const range = document.createRange();

      range.selectNodeContents(node);
      boxes.push(range.getBoundingClientRect());
    }

    const box = element.getBoundingClientRect();
    const textLeft = Math.min(...boxes.map(({ left }) => left));
    const textRight = Math.max(...boxes.map(({ right }) => right));

    return boxes.length === 0
      ? { left: 0, right: 0 }
      : { left: textLeft - box.left, right: box.right - textRight };
  });

  expect(gaps.right).toBeLessThan(gaps.left);
};

type ThemeArgs = ThemesArgs & {
  readonly control: string;
  readonly theme: string;
};

const captureTheme = async ({
  control,
  name,
  open = openEvals,
  page,
  path,
  testInfo,
  theme,
}: ThemeArgs) => {
  await page.context().addCookies([
    {
      name: THEME_COOKIE,
      url: testInfo.project.use.baseURL ?? '',
      value: theme,
    },
  ]);
  await open(page, path);
  await expect(
    page.getByRole('button', { exact: true, name: control }),
  ).toBeVisible();

  const file = testInfo.outputPath(`${name}-${theme}.png`);

  await page.screenshot({ fullPage: true, path: file });
  await testInfo.attach(`${name} (${theme})`, {
    contentType: 'image/png',
    path: file,
  });

  return colorOf(mainOf(page).getByRole('heading', { level: 1 }));
};

export const captureThemes = async (args: ThemesArgs) => {
  const [light, dark] = await THEMES.reduce<Promise<readonly string[]>>(
    async (previous, theme) => [
      ...(await previous),
      await captureTheme({ ...args, ...theme }),
    ],
    Promise.resolve([]),
  );

  expect(dark).not.toBe(light);
};
