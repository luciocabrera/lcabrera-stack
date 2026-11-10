// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { EvalsSubjectTrend } from './EvalsSubjectTrend.component';
import { EVALS_SUBJECT_TREND_HANDLE } from './EvalsSubjectTrend.constants';

const POINT = {
  contentHashes: ['b'.repeat(64)],
  href: '/evals/runs/r2?trial=8',
  key: 'r2',
  label: 'skills run r2: 50% (1/2); open trial 8',
  modelId: 'model-a',
  startedAt: '2026-10-02T02:00:00.000Z',
  value: 0.5,
};

const ROUTE = {
  Component: EvalsSubjectTrend,
  handle: EVALS_SUBJECT_TREND_HANDLE,
  loader: () => ({
    kind: 'skill',
    name: 'react-19',
    series: [
      {
        marks: [
          {
            href: POINT.href,
            key: 'content-r2',
            kind: 'content',
            label: 'Content hash changed to bbbbbbbbbbbb',
            pointLabel: POINT.label,
            startedAt: POINT.startedAt,
          },
        ],
        points: [POINT],
        runs: 1,
        suite: 'skills',
      },
      { marks: [], points: [], runs: 2, suite: 'skill-quality' },
    ],
  }),
  path: '/evals/subjects/:kind/:name',
};

afterEach(() => {
  cleanup();
});

describe('EvalsSubjectTrend', () => {
  it('charts each suite apart and lists each mark with a link to its run', async () => {
    const Stub = createRoutesStub([ROUTE]);

    render(<Stub initialEntries={['/evals/subjects/skill/react-19']} />);

    expect(
      await screen.findByRole('figure', {
        name: 'skill react-19 pass rate in skills over time',
      }),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole('link', { name: POINT.label })
        .map((link) => link.getAttribute('href')),
    ).toEqual([POINT.href, POINT.href]);
    expect(
      screen.getByRole('figure', {
        name: 'skill react-19 pass rate in skill-quality over time',
      }),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent)
        .filter((text) => text?.includes('changed')),
    ).toEqual([`Content hash changed to bbbbbbbbbbbb: ${POINT.label}`]);
  });

  it('titles the page by subject under a trail naming its kind', async () => {
    const Stub = createRoutesStub([ROUTE]);

    render(<Stub initialEntries={['/evals/subjects/skill/react-19']} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'skill react-19' }),
    ).toBeDefined();
    expect(breadcrumbTrail()).toEqual(evalsTrail('skill trend'));
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(({ textContent }) => textContent),
    ).toEqual(['skills', 'skill-quality']);
  });

  it('hydrates the server markup without a mismatch', async () => {
    await expectHydratesWithoutMismatch({
      path: '/evals/subjects/skill/react-19',
      routes: [ROUTE],
    });
  });
});
