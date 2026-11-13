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

  it('names the figure root by the title id the plot draws', () => {
    const html = renderToString(
      <LineChart
        features={{ settings: false }}
        series={[]}
        title='Request latency'
      />,
    );
    const labelledBy = /^<figure aria-labelledby="([^"]+)"/u.exec(html)?.[1];

    expect(labelledBy).toBeDefined();
    expect(html).toContain(
      `<title id="${String(labelledBy)}">Request latency</title>`,
    );
  });

  it('renders the settings button closed, with no drawer', () => {
    const html = renderToString(
      <LineChart series={[]} title='Request latency' />,
    );

    expect(html).toContain('aria-label="Settings for Request latency"');
    expect(html).not.toContain('<dialog');
  });

  it('writes no marker label list when hasMarkerLabels is false', () => {
    const html = renderToString(
      <LineChart
        hasMarkerLabels={false}
        markers={[{ label: 'Deploy', x: 1 }]}
        series={[]}
        title='Request latency'
      />,
    );

    expect(html).not.toContain('<ul');
    expect(html).toContain('<title>Deploy</title>');
  });
});
