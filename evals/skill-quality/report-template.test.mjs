import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderReport, reportData } from './quality-report.mjs';
import { RUBRIC } from './skill-quality.mjs';

const template = readFileSync(
  new URL('report-template.html', import.meta.url),
  'utf8',
);

const RUN_URL =
  'http://localhost:5173/evals/runs/6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50.json';

const embeddedHtml = renderReport({
  data: reportData({
    generatedAt: '2026-10-01T02:40:00.000Z',
    history: [],
    model: 'embedded-model',
    results: [
      {
        judgement: {
          dimensions: RUBRIC.map(({ name }) => ({
            feedback: 'embedded feedback',
            name,
            score: 4,
          })),
          overall: 4,
          summary: 'embedded summary',
        },
        skill: 'embedded-skill',
      },
    ],
  }),
  template,
});

const storedRun = {
  run: {
    finished_at: '2026-10-02T02:40:00.000Z',
    model_id: 'stored-model',
    run_id: '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50',
  },
  tasks: [
    {
      kind: 'quality',
      subject: { kind: 'skill', name: 'stored-skill' },
      task_key: 'skill-quality/stored-skill',
    },
    {
      kind: 'quality',
      subject: { kind: 'skill', name: 'unjudged-skill' },
      task_key: 'skill-quality/unjudged-skill',
    },
  ],
  trials: [
    {
      detail: {
        dimensions: RUBRIC.map(({ name }) => ({ name, score: 2 })),
        overall: 2,
      },
      error_class: null,
      outcome: 'pass',
      task_key: 'skill-quality/stored-skill',
    },
    {
      detail: { dimensions: [] },
      error_class: 'unparsed_reply',
      outcome: 'error',
      task_key: 'skill-quality/unjudged-skill',
    },
  ],
};

const answering = (response) =>
  vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(response.body),
      ok: response.status === 200,
      status: response.status,
    }),
  );

const open = ({ fetch, search = '' }) => {
  const { window } = new JSDOM(embeddedHtml, {
    beforeParse: (target) => {
      target.fetch = fetch;
    },
    runScripts: 'dangerously',
    url: `file:///tmp/report.html${search}`,
  });
  const text = (id) => window.document.getElementById(id).textContent;
  const rows = () =>
    [...window.document.querySelectorAll('#rows tr')].map((row) =>
      [...row.cells].map((cell) => cell.textContent),
    );

  return { rows, text, window };
};

const withRun = `?run=${encodeURIComponent(RUN_URL)}`;

describe('the report explorer', () => {
  it('renders the embedded run without fetching when no run is named', () => {
    const fetch = answering({ body: storedRun, status: 200 });
    const { rows, text, window } = open({ fetch });

    expect(fetch).not.toHaveBeenCalled();
    expect(rows()).toEqual([
      ['embedded-skill', '4', '4', '4', '4', '4', '4.0', '—'],
    ]);
    expect(text('meta')).toContain('Judge embedded-model');
    expect(text('detail-summary')).toBe('embedded summary');
    expect(window.document.getElementById('source').hidden).toBe(true);
  });

  it('renders a stored run fetched from the URL ?run= names', async () => {
    const fetch = answering({ body: storedRun, status: 200 });
    const { rows, text } = open({ fetch, search: withRun });

    await vi.waitFor(() => expect(rows()).toHaveLength(2));

    expect(String(fetch.mock.calls[0]?.[0])).toBe(RUN_URL);
    expect(rows()).toEqual([
      ['stored-skill', '2', '2', '2', '2', '2', '2.0', '—'],
      ['unjudged-skill', 'not judged: unparsed_reply'],
    ]);
    expect(text('meta')).toContain('Judge stored-model');
    expect(text('source')).toBe(`Stored run loaded from ${RUN_URL}`);
    expect(text('detail-title')).toBe('stored-skill — 2.0 overall');
  });

  it.each([
    {
      answer: { body: undefined, status: 404 },
      reason: 'it answered 404',
    },
    {
      answer: { body: { skills: [] }, status: 200 },
      reason: 'the answer is not a stored run',
    },
  ])(
    'falls back to the embedded run when $reason',
    async ({ answer, reason }) => {
      const { rows, text } = open({
        fetch: answering(answer),
        search: withRun,
      });

      await vi.waitFor(() => expect(rows()).toHaveLength(1));

      expect(rows()[0]?.[0]).toBe('embedded-skill');
      expect(text('source')).toContain(reason);
    },
  );
});
