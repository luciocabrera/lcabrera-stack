import { Button } from '@lcabrera/ui/components/Button';
import { use } from 'react';
import { useFetcher } from 'react-router';

import type { action } from '../projectDetail.action';
import type { ProjectGrantsPanelProps } from './ProjectGrantsPanel.types';

import { PROJECT_GRANT_OPTIONS } from './ProjectGrantsPanel.constants';

/**
 * Per-instance grants editor (ADR-024) — narrow allows on THIS project
 * ("user X may trigger scans here"). Reads both promises via `use()`, so
 * the parent must wrap it in `<Suspense>`; mutations go through fetcher
 * forms against the project-detail action (grant-add / grant-delete
 * intents), and Postgres' typed rejections render inline.
 */
export const ProjectGrantsPanel = ({
  grantsPromise,
  usersPromise,
}: ProjectGrantsPanelProps) => {
  const grants = use(grantsPromise);
  const users = use(usersPromise);
  const fetcher = useFetcher<typeof action>();

  const grantError =
    fetcher.data && 'grantError' in fetcher.data
      ? fetcher.data.grantError
      : undefined;

  const optionLabelByValue = new Map<string, string>(
    PROJECT_GRANT_OPTIONS.map((option) => [option.value, option.label]),
  );

  return (
    <div>
      {grants.length === 0 ? (
        <p>No per-instance grants on this project.</p>
      ) : (
        <ul>
          {grants.map((grant) => (
            <li key={grant.id}>
              {grant.display_name} ({grant.username}) —{' '}
              {optionLabelByValue.get(
                `${grant.action}:${grant.resource_type}`,
              ) ?? `${grant.action} ${grant.resource_type}`}{' '}
              <fetcher.Form method='post'>
                <input name='intent' type='hidden' value='grant-delete' />
                <input name='grantId' type='hidden' value={grant.id} />
                <Button size='mini' type='submit' variant='ghost'>
                  Revoke
                </Button>
              </fetcher.Form>
            </li>
          ))}
        </ul>
      )}

      <fetcher.Form method='post'>
        <input name='intent' type='hidden' value='grant-add' />
        <label>
          User{' '}
          <select defaultValue='' name='granteeUserId'>
            <option disabled value=''>
              Pick a user…
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name} ({user.username})
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Permission{' '}
          <select defaultValue='execute:scan' name='permission'>
            {PROJECT_GRANT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>{' '}
        <Button
          isBusy={fetcher.state !== 'idle'}
          size='mini'
          type='submit'
          variant='primary'
        >
          Add Grant
        </Button>
      </fetcher.Form>

      {Boolean(grantError) && <p role='alert'>{grantError}</p>}
    </div>
  );
};
