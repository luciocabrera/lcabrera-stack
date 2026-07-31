// @vitest-environment jsdom

import type { ProjectRunRow } from '@repo/scan-ingestion/queries/getProjectRuns.util';

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { RunLink } from './RunLink.component';

const run = {
  created_at: '2024-01-15T23:30:00Z',
  id: 'run-1',
} as ProjectRunRow;

const renderRunLink = () => {
  const Stub = createRoutesStub([
    {
      Component: () => <RunLink run={run} />,
      path: '/cqms/projects/view/:projectId',
    },
  ]);

  render(<Stub initialEntries={['/cqms/projects/view/project-1']} />);
};

afterEach(cleanup);

describe('RunLink', () => {
  it('renders the run timestamp in UTC, labelled', () => {
    renderRunLink();

    // The exact string is the assertion: it is fixed regardless of the machine's
    // own zone, which is what makes it survive hydration. `toLocaleString()`
    // rendered one string on the server and another in the browser.
    expect(
      screen.getByRole('link', { name: 'Jan 15, 2024, 11:30 PM UTC' }),
    ).toBeTruthy();
  });

  it('links to the run detail route for the current project', () => {
    renderRunLink();

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/cqms/projects/view/project-1/runs/run-1',
    );
  });
});
