import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { ActiveRunNoticeProps } from './ActiveRunNotice.types';

import { styles } from './ActiveRunNotice.stylex';

/**
 * The §8 concurrent-run conflict banner (PRD_V2 §8): shown when a scan is already
 * running for the project — either detected at load (the form is not offered) or
 * returned as a `409` by the trigger action when a run started between load and
 * submit. Reports how long the active run has been going and links to it. Uses
 * the warning tone so it reads as "blocked for now", not "error".
 */
export const ActiveRunNotice = ({
  elapsed,
  projectId,
  runId,
}: ActiveRunNoticeProps) => {
  return (
    <div role='status' {...stylex.props(styles.notice)}>
      <p {...stylex.props(styles.text)}>
        A scan is already running for this project — it has been running for{' '}
        {elapsed}. Wait for it to finish before starting another.
      </p>
      <Link
        to={`/cqms/projects/view/${projectId}/runs/${runId}`}
        {...stylex.props(styles.link)}
      >
        View the running scan →
      </Link>
    </div>
  );
};
