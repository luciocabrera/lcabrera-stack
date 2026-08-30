/**
 * A5 is the operator's one authorised way to land a pull request, and the ways
 * past it are not all spelled `gh pr merge`. The REST merge endpoint and the
 * GraphQL merge mutations reach the same operation through `gh api`, which the
 * apply pass holds for other reasons, and the account it runs as is a ruleset
 * bypass actor — so these pin the shapes rather than the command names, in both
 * directions: every way past is rejected, and the `gh api` calls A4 and S11
 * genuinely need are not.
 *
 * Separate from `pr-queue-gate.test.mjs` because that file is the verdict
 * ceiling and this one is the command bound; #1040 is the part of this bound
 * that lives outside the decision and is therefore not testable here.
 */
import { describe, expect, it } from 'vite-plus/test';

import { forbiddenActions } from './pr-queue-gate.mjs';

describe('forbiddenActions — every way past the queue, not only the flags', () => {
  const action = (command) => ({ command, rule: 'A5', why: 'land it' });

  it('rejects --admin, which merges past every required check', () => {
    expect(
      forbiddenActions([action('gh pr merge 42 --squash --admin')]),
    ).toEqual([
      expect.objectContaining({ command: 'gh pr merge 42 --squash --admin' }),
    ]);
  });

  it('rejects --delete-branch, which asks for a merge that has not happened', () => {
    expect(
      forbiddenActions([action('gh pr merge 42 --squash -d')]),
    ).toHaveLength(1);
    expect(
      forbiddenActions([action('gh pr merge 42 --squash --delete-branch')]),
    ).toHaveLength(1);
  });

  it('leaves the one authorised landing command alone', () => {
    expect(forbiddenActions([action('gh pr merge 42 --squash')])).toEqual([]);
  });

  it('does not fire on an unrelated command that merely says admin', () => {
    expect(
      forbiddenActions([action('gh pr comment 42 --body "ask an admin"')]),
    ).toEqual([]);
  });

  it('reads an absent action list as nothing forbidden, not as a throw', () => {
    expect(forbiddenActions(undefined)).toEqual([]);
  });

  it('rejects a merge method that is not --squash', () => {
    expect(forbiddenActions([action('gh pr merge 42 --merge')])).toHaveLength(
      1,
    );
    expect(forbiddenActions([action('gh pr merge 42 --rebase')])).toHaveLength(
      1,
    );
  });

  it('rejects the REST merge endpoint, which no `gh pr merge` pattern sees', () => {
    const command =
      'gh api --method PUT repos/luciocabrera/lcabrera-stack/pulls/42/merge -f merge_method=squash';
    expect(forbiddenActions([action(command)])).toEqual([
      expect.objectContaining({ command }),
    ]);
  });

  it('matches that endpoint by shape, so the transport does not matter', () => {
    expect(
      forbiddenActions([
        action('gh api -X PUT /repos/o/r/pulls/7/merge'),
        action(
          'curl -X PUT https://api.github.com/repos/o/r/pulls/7/merge -d "{}"',
        ),
      ]),
    ).toHaveLength(2);
  });

  it('rejects the GraphQL merge mutations', () => {
    expect(
      forbiddenActions([
        action(
          `gh api graphql -f query='mutation{mergePullRequest(input:{})}'`,
        ),
      ]),
    ).toHaveLength(1);
    expect(
      forbiddenActions([
        action(
          `gh api graphql -f query='mutation{enablePullRequestAutoMerge(input:{})}'`,
        ),
      ]),
    ).toHaveLength(1);
  });

  it('leaves the `gh api` calls A4 and S11 actually need alone', () => {
    expect(
      forbiddenActions([
        action('gh api repos/luciocabrera/lcabrera-stack/pulls/42/comments'),
        action(
          'gh api --method POST repos/luciocabrera/lcabrera-stack/pulls/42/comments/9/replies -f body=ok',
        ),
        action(
          `gh api graphql -f query='{ repository { pullRequest { isInMergeQueue } } }'`,
        ),
        action('gh api repos/luciocabrera/lcabrera-stack/rulesets/19141543'),
      ]),
    ).toEqual([]);
  });
});
