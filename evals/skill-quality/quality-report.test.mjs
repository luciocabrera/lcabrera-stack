import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';

import {
  parseRun,
  previousOverall,
  renderReport,
  REPORT_PLACEHOLDER,
  reportData,
  runRecord,
} from './quality-report.mjs';
import { RUBRIC } from './skill-quality.mjs';

const judgement = (overall, feedback = 'fine') => ({
  dimensions: RUBRIC.map(({ name }) => ({ feedback, name, score: 4 })),
  overall,
  summary: 'a summary',
});

const results = [
  { judgement: judgement(3.8), skill: 'epic' },
  { error: 'the session ended with error_max_turns', skill: 'broken' },
];

describe('runRecord', () => {
  it('keeps the overall score of every judged skill and leaves out the rest', () => {
    expect(runRecord({ generatedAt: 't', model: 'm', results })).toEqual({
      generatedAt: 't',
      model: 'm',
      scores: { epic: 3.8 },
    });
  });
});

describe('parseRun', () => {
  it('reads a run record', () => {
    expect(parseRun('{"scores":{"epic":4}}')).toEqual({ scores: { epic: 4 } });
  });

  it.each([['not json'], ['{}'], ['{"scores":null}'], ['']])(
    'skips %j instead of throwing',
    (text) => {
      expect(parseRun(text)).toBeUndefined();
    },
  );
});

describe('previousOverall', () => {
  const history = [
    { scores: { epic: 3.2, unslop: 4 } },
    { scores: { unslop: 4.2 } },
  ];

  it('takes the latest earlier run that judged the skill', () => {
    expect(previousOverall({ history, skill: 'unslop' })).toBe(4.2);
    expect(previousOverall({ history, skill: 'epic' })).toBe(3.2);
  });

  it('is undefined for a skill no earlier run judged', () => {
    expect(previousOverall({ history, skill: 'releasing' })).toBeUndefined();
  });
});

describe('reportData', () => {
  it('carries the rubric, each judged skill with its previous score, and each failure', () => {
    const data = reportData({
      generatedAt: 't',
      history: [{ scores: { epic: 3.4 } }],
      model: 'm',
      results,
    });
    expect(data.rubric).toBe(RUBRIC);
    expect(data.skills).toEqual([
      {
        dimensions: judgement(3.8).dimensions,
        overall: 3.8,
        previous: 3.4,
        skill: 'epic',
        summary: 'a summary',
      },
      { error: 'the session ended with error_max_turns', skill: 'broken' },
    ]);
  });
});

describe('renderReport', () => {
  const template = readFileSync(
    new URL('report-template.html', import.meta.url),
    'utf8',
  );

  it('fills the real template, which still holds the placeholder', () => {
    const html = renderReport({ data: { skills: [] }, template });
    expect(template).toContain(REPORT_PLACEHOLDER);
    expect(html).not.toContain(REPORT_PLACEHOLDER);
    expect(html).toContain('{"skills":[]}');
  });

  it('cannot be broken out of its script tag by feedback text', () => {
    const data = reportData({
      generatedAt: 't',
      history: [],
      model: 'm',
      results: [
        { judgement: judgement(4, '</script><b>x</b> $&'), skill: 'a' },
      ],
    });
    const html = renderReport({ data, template });
    expect(html).not.toContain('</script><b>');
    expect(html).toContain(String.raw`\u003c/script>\u003cb>x\u003c/b> $&`);
  });

  it('has a sortable header for each rubric dimension, in rubric order', () => {
    const keys = template
      .matchAll(/data-key="([a-z_]+)"/g)
      .map(([, key]) => key)
      .toArray();
    expect(keys).toEqual([
      'skill',
      ...RUBRIC.map(({ name }) => name),
      'overall',
      'change',
    ]);
  });

  it('refuses a template without the placeholder', () => {
    expect(() =>
      renderReport({ data: {}, template: '<p>no slot</p>' }),
    ).toThrow('placeholder');
  });
});
