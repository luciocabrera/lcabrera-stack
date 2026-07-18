import { Button } from '@repo/ui/components/Button';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { useFetcher, useLoaderData } from 'react-router';

import type { action } from './accountTokens.action';
import type { loader } from './accountTokens.loader';

import { formatTokenTimestamp } from './formatTokenTimestamp.util';

export const AccountTokens = () => {
  const { tokens } = useLoaderData<typeof loader>();
  const issueFetcher = useFetcher<typeof action>();
  const revokeFetcher = useFetcher<typeof action>();

  const issued =
    issueFetcher.data && 'plaintext' in issueFetcher.data
      ? issueFetcher.data.plaintext
      : undefined;
  const issueError =
    issueFetcher.data && 'tokenError' in issueFetcher.data
      ? issueFetcher.data.tokenError
      : undefined;
  const revokeError =
    revokeFetcher.data && 'tokenError' in revokeFetcher.data
      ? revokeFetcher.data.tokenError
      : undefined;

  return (
    <SectionCard
      description='Personal tokens authenticate the CodePulse CLI (codepulse push). Treat them like passwords — a token carries your own permissions.'
      title='API Tokens'
    >
      {Boolean(issued) && (
        <output>
          <strong>Copy your new token now — it will not be shown again:</strong>{' '}
          <code>{issued}</code>
        </output>
      )}

      <issueFetcher.Form method='post'>
        <input name='intent' type='hidden' value='token-issue' />
        <label>
          Name{' '}
          <input
            maxLength={100}
            name='name'
            placeholder='e.g. my-laptop'
            required
            type='text'
          />
        </label>{' '}
        <Button
          isBusy={issueFetcher.state !== 'idle'}
          size='mini'
          type='submit'
          variant='primary'
        >
          Create Token
        </Button>
      </issueFetcher.Form>
      {Boolean(issueError) && <p role='alert'>{issueError}</p>}

      {tokens.length === 0 ? (
        <p>No tokens yet.</p>
      ) : (
        <ul>
          {tokens.map((token) => (
            <li key={token.token_id}>
              {token.name} — created {formatTokenTimestamp(token.created_at)},
              last used {formatTokenTimestamp(token.last_used_at)}
              {token.expires_at
                ? `, expires ${formatTokenTimestamp(token.expires_at)}`
                : ''}{' '}
              <revokeFetcher.Form method='post'>
                <input name='intent' type='hidden' value='token-revoke' />
                <input name='tokenId' type='hidden' value={token.token_id} />
                <Button size='mini' type='submit' variant='ghost'>
                  Revoke
                </Button>
              </revokeFetcher.Form>
            </li>
          ))}
        </ul>
      )}
      {Boolean(revokeError) && <p role='alert'>{revokeError}</p>}
    </SectionCard>
  );
};
