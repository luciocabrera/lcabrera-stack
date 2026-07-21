import { TrendSparkline } from '@lcabrera/ui/components/TrendSparkline';
import { use } from 'react';

import type { ProjectTrendPanelProps } from './ProjectTrendPanel.types';

import { groupTrendByScanner } from '../../utils/groupTrendByScanner.util';

/**
 * Reads `trendPromise` via `use()` — must be rendered inside a `<Suspense>`
 * boundary by its parent; the promise itself comes from the loader
 * (never created here), per React 19's `use()` contract.
 */
export const ProjectTrendPanel = ({ trendPromise }: ProjectTrendPanelProps) => {
  const trend = use(trendPromise);
  const groups = groupTrendByScanner(trend);

  if (groups.length === 0) {
    return <p>No scan history yet.</p>;
  }

  return (
    <ul>
      {groups.map((group) => (
        <li key={group.scannerId}>
          {group.scannerId}{' '}
          <TrendSparkline
            label={`High-severity findings per scan for ${group.scannerId}`}
            tone={
              (group.highCounts.at(-1) ?? 0) > (group.highCounts.at(0) ?? 0)
                ? 'error'
                : 'success'
            }
            values={group.highCounts}
          />
        </li>
      ))}
    </ul>
  );
};
