import { describe, expect, it } from 'vite-plus/test';

import { normalizeFlows } from './sonar-flows.mjs';

const relPath = (component) => component.replace(/^project:/, '');

describe('normalizeFlows', () => {
  it('keeps each step with its file, line and message', () => {
    expect(
      normalizeFlows(
        [
          {
            locations: [
              {
                component: 'project:scripts/lib/gh-exec.mjs',
                textRange: { startLine: 60 },
                msg: 'Sink: this invocation is not safe',
              },
              {
                component:
                  'project:packages/repo-standards/scripts/cli-input.mjs',
                textRange: { startLine: 44 },
                msg: 'Source: an llm can pass malicious data',
              },
            ],
          },
        ],
        relPath,
      ),
    ).toEqual([
      [
        {
          file: 'scripts/lib/gh-exec.mjs',
          line: 60,
          message: 'Sink: this invocation is not safe',
        },
        {
          file: 'packages/repo-standards/scripts/cli-input.mjs',
          line: 44,
          message: 'Source: an llm can pass malicious data',
        },
      ],
    ]);
  });

  it('keeps every flow when an issue has more than one', () => {
    const flow = (line) => ({
      locations: [
        { component: 'project:a.mjs', textRange: { startLine: line } },
      ],
    });
    expect(normalizeFlows([flow(1), flow(2)], relPath)).toHaveLength(2);
  });

  it('is empty for an issue with no flows, so no field is added', () => {
    expect(normalizeFlows(undefined, relPath)).toEqual([]);
    expect(normalizeFlows([], relPath)).toEqual([]);
  });

  it('drops a flow carrying no locations rather than emitting an empty one', () => {
    expect(normalizeFlows([{ locations: [] }, {}], relPath)).toEqual([]);
  });

  it('nulls a missing line and message rather than dropping the step', () => {
    expect(
      normalizeFlows(
        [{ locations: [{ component: 'project:a.mjs' }] }],
        relPath,
      ),
    ).toEqual([[{ file: 'a.mjs', line: null, message: null }]]);
  });

  it('nulls a missing file rather than throwing out of the whole report', () => {
    expect(
      normalizeFlows(
        [{ locations: [{ textRange: { startLine: 3 }, msg: 'step' }] }],
        relPath,
      ),
    ).toEqual([[{ file: null, line: 3, message: 'step' }]]);
  });

  it('preserves order, since the path is only readable in sequence', () => {
    const at = (line) => ({
      component: 'project:a.mjs',
      textRange: { startLine: line },
    });
    expect(
      normalizeFlows([{ locations: [at(3), at(1), at(2)] }], relPath)[0].map(
        (step) => step.line,
      ),
    ).toEqual([3, 1, 2]);
  });
});
