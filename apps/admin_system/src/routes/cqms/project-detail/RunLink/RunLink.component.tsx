import { formatDate } from '@lcabrera/utils/formatters/format-date.util';
import { Link, useParams } from 'react-router';

import type { RunLinkProps } from './RunLink.types';

/**
 * Run timestamps are rendered in UTC, labelled, rather than in the reader's own
 * zone. `toLocaleString()` here produced one string on the server and another in
 * the browser, so every run link hydrated with a mismatch. An absolute instant
 * is also what a shared admin surface wants: two people comparing the same run
 * from different zones read the same string.
 */
export const RunLink = ({ run }: RunLinkProps) => {
  const { projectId } = useParams();

  return (
    <Link to={`/cqms/projects/view/${projectId}/runs/${run.id}`}>
      {formatDate({
        preset: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
        value: run.created_at,
      })}{' '}
      UTC
    </Link>
  );
};
