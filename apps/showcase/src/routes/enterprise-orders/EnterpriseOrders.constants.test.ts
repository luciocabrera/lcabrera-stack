import { describe, expect, it } from 'vite-plus/test';

import { CELL_PALETTE, COLUMNS } from './EnterpriseOrders.constants';

const orderStatus = COLUMNS.find(({ key }) => key === 'order_status');

const ruleTones = (): readonly string[] => {
  const rules = orderStatus?.cell?.params?.rules;

  return Array.isArray(rules)
    ? rules.map((rule: { readonly tone: string }) => rule.tone)
    : [];
};

describe('enterprise orders columns', () => {
  it('draws the order status as a badge', () => {
    expect(orderStatus?.cell?.kind).toBe('badge');
  });

  it('defines in its palette every tone the status rules name beyond the built-ins', () => {
    const builtIn = new Set(['error', 'info', 'neutral', 'success', 'warning']);
    const custom = ruleTones().filter((tone) => !builtIn.has(tone));

    expect(custom.length).toBeGreaterThan(0);
    expect(custom.every((tone) => Object.hasOwn(CELL_PALETTE, tone))).toBe(
      true,
    );
  });
});
