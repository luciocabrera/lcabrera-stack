// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vite-plus/test';

import { LineChart } from '#ui/components/LineChart';

describe('LineChart on the server', () => {
  it('renders where no window exists', () => {
    expect(typeof globalThis.window).toBe('undefined');

    const html = renderToString(
      <MemoryRouter>
        <LineChart
          markers={[{ label: 'Deploy', x: 1 }]}
          series={[
            {
              id: 'latency',
              label: 'Latency',
              points: [
                { x: 0, y: 1 },
                { x: 2, y: 3 },
              ],
            },
          ]}
          title='Request latency'
        />
      </MemoryRouter>,
    );

    expect(html).toContain('<title');
    expect(html).toContain('M0,100L100,0');
  });
});
