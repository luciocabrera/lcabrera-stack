/**
 * A5 has one authorised way to land a pull request, and the ways past it are
 * neither all spelled `gh pr merge` nor all spelled the same when they are.
 *
 * Two properties are pinned, matching the two structures in `pr-queue-gate.mjs`.
 * The flag half is an ALLOW-LIST, so the cases below include flags the guard was
 * never told about — a spelling it does not know must still be rejected, or the
 * guard is back to guessing. The transport half is a deny-list over operation
 * shapes, so the same endpoint is planted through `gh api` and through `curl`,
 * with its path segments written as shell variables as well as literals, and the
 * `gh api` reads A4 and S11 genuinely need are planted alongside to show the
 * bound still admits them.
 *
 * Separate from `pr-queue-gate.test.mjs` because that file is the verdict
 * ceiling and this one is the command bound; #1040 is the part of this bound
 * that lives outside the decision and is therefore not testable here.
 */
import { describe, expect, it } from 'vite-plus/test';

import { forbiddenActions } from './pr-queue-gate.mjs';

describe('forbiddenActions — one authorised landing, every other shape refused', () => {
  const action = (command) => ({ command, rule: 'A5', why: 'land it' });

  it('leaves the one authorised landing command alone', () => {
    expect(forbiddenActions([action('gh pr merge 42 --squash')])).toEqual([]);
  });

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

  it('rejects a merge method that is not --squash, in both gh spellings', () => {
    expect(forbiddenActions([action('gh pr merge 42 --merge')])).toHaveLength(
      1,
    );
    expect(forbiddenActions([action('gh pr merge 42 --rebase')])).toHaveLength(
      1,
    );
    expect(forbiddenActions([action('gh pr merge 42 -m')])).toHaveLength(1);
    expect(forbiddenActions([action('gh pr merge 42 -r')])).toHaveLength(1);
  });

  it('rejects --auto, the flag that calls enablePullRequestAutoMerge', () => {
    expect(
      forbiddenActions([action('gh pr merge 42 --squash --auto')]),
    ).toHaveLength(1);
  });

  it('rejects a flag it was never told about, because the form is allow-listed', () => {
    expect(
      forbiddenActions([
        action('gh pr merge 42 --squash --match-head-commit deadbeef'),
        action('gh pr merge 42 --squash --a-flag-gh-has-not-shipped-yet'),
      ]),
    ).toHaveLength(2);
  });

  it('does not fire on an unrelated command that merely says admin', () => {
    expect(
      forbiddenActions([action('gh pr comment 42 --body "ask an admin"')]),
    ).toEqual([]);
  });

  it('reads an absent action list as nothing forbidden, not as a throw', () => {
    expect(forbiddenActions(undefined)).toEqual([]);
  });

  it('rejects the REST merge endpoint, which no `gh pr merge` pattern sees', () => {
    const command =
      'gh api --method PUT repos/luciocabrera/lcabrera-stack/pulls/42/merge -f merge_method=squash';
    expect(forbiddenActions([action(command)])).toEqual([
      expect.objectContaining({ command }),
    ]);
  });

  it('reads that path with its segments unread, so shell variables do not evade it', () => {
    expect(
      forbiddenActions([
        action('gh api "repos/$OWNER/$REPO/pulls/$PR/merge" --method PUT'),
        action(
          'gh api --method PUT repos/luciocabrera/lcabrera-stack/pulls/$PR/merge',
        ),
      ]),
    ).toHaveLength(2);
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

  it('rejects the branch-merge endpoint, which needs no pull request at all', () => {
    expect(
      forbiddenActions([
        action('gh api --method POST repos/o/r/merges -f base=main -f head=x'),
      ]),
    ).toHaveLength(1);
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
    expect(
      forbiddenActions([
        action(`gh api graphql -f query='mutation{mergeBranch(input:{})}'`),
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
