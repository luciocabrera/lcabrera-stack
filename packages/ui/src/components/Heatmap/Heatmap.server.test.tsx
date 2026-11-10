// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vite-plus/test';

import { Heatmap } from '#ui/components/Heatmap';

const ROWS = [{ key: 'r1', label: 'Row 1' }];
const COLUMNS = [
  { key: 'c1', label: 'Column 1' },
  { key: 'c2', label: 'Column 2' },
];

describe('Heatmap on the server', () => {
  it('renders where no window exists', () => {
    expect(typeof globalThis.window).toBe('undefined');

    const html = renderToString(
      <MemoryRouter>
        <Heatmap
          cells={[
            {
              column: 'c1',
              label: 'Linked cell',
              pattern: 'hatch',
              row: 'r1',
              to: '/cell',
              tone: 'error',
            },
          ]}
          columns={COLUMNS}
          hasDataTable
          legend={[{ label: 'Hatched', pattern: 'hatch', tone: 'error' }]}
          rows={ROWS}
          title='Server grid'
        />
      </MemoryRouter>,
    );

    expect(html).toContain('role="grid"');
    expect(html).toContain('href="/cell"');
    expect(html).toContain('Row 1, Column 2: No value');
  });

  it('renders outside a router when nothing is linked', () => {
    const html = renderToString(
      <Heatmap cells={[]} columns={COLUMNS} rows={ROWS} title='No router' />,
    );

    expect(html).toContain('role="img"');
  });

  it('names the figure root by the title id the plot draws', () => {
    const html = renderToString(
      <Heatmap cells={[]} columns={COLUMNS} rows={ROWS} title='Named grid' />,
    );
    const labelledBy = /^<figure aria-labelledby="([^"]+)"/u.exec(html)?.[1];

    expect(labelledBy).toBeDefined();
    expect(html).toContain(
      `<title id="${String(labelledBy)}">Named grid</title>`,
    );
  });
});
