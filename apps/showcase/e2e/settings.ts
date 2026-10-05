import type { Locator, Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { visiblePanel } from './grid';

const chooseFromTrigger = async (trigger: Locator, label: string) => {
  await trigger.click();
  const listboxId = await trigger.getAttribute('aria-controls');

  if (listboxId === null || listboxId === '') {
    throw new Error('picker has no listbox');
  }

  const listbox = trigger.page().locator(`[id="${listboxId}"]`);
  await listbox.getByPlaceholder('Search options...').fill(label);
  await listbox.getByRole('button', { exact: true, name: label }).click();
};

const chooseColumn = async (page: Page, label: string) => {
  const panel = visiblePanel(page);
  await chooseFromTrigger(
    panel.getByRole('button', { name: 'Select a column...' }),
    label,
  );
  await expect(
    panel.getByRole('button', { exact: true, name: 'Add' }),
  ).toBeVisible();
};

export const addColumn = async (page: Page, label: string) => {
  await chooseColumn(page, label);
  await visiblePanel(page)
    .getByRole('button', { exact: true, name: 'Add' })
    .click();
};

const drawerSection = (page: Page, title: string) =>
  page
    .getByTestId('side-panel-section-header')
    .filter({ has: page.getByRole('heading', { exact: true, name: title }) })
    .locator('..');

const chooseInSection = async (
  page: Page,
  title: string,
  trigger: string,
  label: string,
) => {
  const section = drawerSection(page, title);
  await chooseFromTrigger(
    section.getByRole('button', { name: trigger }),
    label,
  );
  return section;
};

export const addColumnIn = async (page: Page, title: string, label: string) => {
  const section = await chooseInSection(
    page,
    title,
    'Select a column...',
    label,
  );
  await section.getByRole('button', { exact: true, name: 'Add' }).click();
};

export const addAggregate = async (
  page: Page,
  column: string,
  functionLabel: string,
) => {
  const section = await chooseInSection(
    page,
    'Add Aggregate',
    'Select a column...',
    column,
  );
  await chooseFromTrigger(
    section.getByRole('button', { name: 'Select a function...' }),
    functionLabel,
  );
  await section.getByRole('button', { exact: true, name: 'Add' }).click();
};

export const filterItem = (page: Page, columnKey: string) =>
  page.getByTestId(`filter-item-${columnKey}`);

export const chooseOperator = async (item: Locator, label: string) => {
  await item.getByRole('button', { exact: true, name: 'Equals' }).click();
  await item.page().getByRole('button', { exact: true, name: label }).click();
};

export const pickFilterOption = async (item: Locator, label: string) => {
  const option = item.getByRole('checkbox', { exact: true, name: label });
  await expect(option).toBeVisible();
  await option.click();
};

export const fillFilterText = async (item: Locator, value: string) => {
  await item.getByPlaceholder('Enter text...').fill(value);
};

export const fillFilterNumber = async (item: Locator, value: string) => {
  await item.getByPlaceholder('Enter number...').fill(value);
};

export const fillFilterDate = async (item: Locator, value: string) => {
  await item.locator('input[type="date"]').fill(value);
};

export const clickFilterBoolean = async (item: Locator, label: string) => {
  await item.getByRole('button', { exact: true, name: label }).click();
};

export const clickToolbar = async (page: Page, name: string) => {
  await visiblePanel(page)
    .getByRole('button', { exact: true, name })
    .first()
    .click();
};
