import { vi } from 'vite-plus/test';

export const drawerColumnsStore = { set: vi.fn() };

export const appliedColumnsStore = {
  get: () => ({
    columnOrder: ['status', 'id'],
    columnPinning: { left: ['id'], right: ['actions'] },
    columnVisibility: new Set(['email']),
  }),
};
