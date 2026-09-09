import { expect, it } from 'vite-plus/test';

import { buildProductTab } from './buildProductTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Product tab with quantity and price', () => {
  const tab = buildProductTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Product');
  expect(accessors).toContain('quantity');
  expect(accessors).toContain('unit_price');
});
