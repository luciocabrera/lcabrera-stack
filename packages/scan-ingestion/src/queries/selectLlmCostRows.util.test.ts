import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectLlmCostRows } from './selectLlmCostRows.util.ts';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));

type ScannerCostDbRow = {
  readonly display_name: string;
  readonly total_cost_usd: string;
};

beforeEach(() => {
  vi.mocked(selectRows).mockReset();
});

describe('selectLlmCostRows', () => {
  it('coerces the numeric cost pg returns as a string into a number', async () => {
    vi.mocked(selectRows).mockResolvedValue([
      { display_name: 'Linter', total_cost_usd: '12.50' },
      { display_name: 'Typer', total_cost_usd: '0.00' },
    ] satisfies readonly ScannerCostDbRow[]);

    const rows = await selectLlmCostRows<ScannerCostDbRow>({
      fields: ['display_name', 'total_cost_usd'],
      sort: [{ column: 'total_cost_usd', direction: 'desc' }],
      table: 'v_scanner_llm_cost',
    });

    expect(rows).toEqual([
      { display_name: 'Linter', total_cost_usd: 12.5 },
      { display_name: 'Typer', total_cost_usd: 0 },
    ]);
  });

  it('pins every reader to the llm_usage schema and forwards view/columns/sort', async () => {
    vi.mocked(selectRows).mockResolvedValue([]);

    await selectLlmCostRows<ScannerCostDbRow>({
      fields: ['display_name', 'total_cost_usd'],
      sort: [{ column: 'total_cost_usd', direction: 'desc' }],
      table: 'v_scanner_llm_cost',
    });

    expect(selectRows).toHaveBeenCalledWith({
      fields: ['display_name', 'total_cost_usd'],
      schema: 'llm_usage',
      sort: [{ column: 'total_cost_usd', direction: 'desc' }],
      table: 'v_scanner_llm_cost',
    });
  });

  it('leaves the non-cost columns untouched', async () => {
    vi.mocked(selectRows).mockResolvedValue([
      { display_name: 'Linter', total_cost_usd: '1' },
    ] satisfies readonly ScannerCostDbRow[]);

    const rows = await selectLlmCostRows<ScannerCostDbRow>({
      fields: ['display_name', 'total_cost_usd'],
      sort: [{ column: 'display_name', direction: 'asc' }],
      table: 'v_scanner_llm_cost',
    });

    expect(rows[0]?.display_name).toBe('Linter');
  });
});
