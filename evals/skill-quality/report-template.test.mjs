import { runProjection } from '@repo/eval-history/queries/runProjection.util';
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

const storedRun = await Response.json(
  runProjection({
    run: {
      finishedAt: new Date('2026-10-02T02:40:00.000Z'),
      modelId: 'stored-model',
      runId: '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50',
      startedAt: new Date('2026-10-02T02:00:00.000Z'),
    },
    scores: RUBRIC.map(({ name }) => ({
      dimension: name,
      score: 2,
      trialId: '7',
    })),
    trials: [
      {
        outcome: 'pass',
        overall: 2,
        subjectKind: 'skill',
        subjectName: 'stored-skill',
        taskKey: 'skill-quality/stored-skill',
        taskKind: 'quality',
        trialId: '7',
        trialIndex: 0,
      },
      {
        errorClass: 'unparsed_reply',
        outcome: 'error',
        subjectKind: 'skill',
        subjectName: 'unjudged-skill',
        taskKey: 'skill-quality/unjudged-skill',
        taskKind: 'quality',
        trialId: '8',
        trialIndex: 0,
      },
    ],
  }),
).json();

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
