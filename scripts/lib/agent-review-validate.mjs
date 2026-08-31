/**
 * The whole of `docs/agents/agent-review-contract.md` §2.4, composed — from a
 * pull request's comments to one of four states.
 *
 * The four are kept distinct on purpose (§2.3, as amended): `pass` and `fail`
 * mean a review ran and concluded, `error` means one was attempted and could
 * not, and `absent` means none was attempted for this commit. Collapsing them
 * into green and red loses the only field that tells an author what to do next.
 *
 * Everything here is pure: the API reads live in `scripts/verify-agent-review.mjs`,
 * so every path below — including each failure case — is reachable from a test
 * without a network.
 *
 * Governed by .claude/rules/scripts.md.
 */
import {
  readVerdictDocument,
  selectVerdictComment,
} from './agent-review-discovery.mjs';
import { diffIndex } from './agent-review-diff.mjs';
import {
  blockingFindingIds,
  consistencyErrors,
  findingsAdmissibilityErrors,
} from './agent-review-findings.mjs';
import { documentShapeErrors } from './agent-review-schema.mjs';

const bindingErrors = (document, { pr, headSha }) => {
  const errors = [];
  if (document.head_sha !== headSha) {
    errors.push(
      `\`head_sha\` is \`${document.head_sha}\` but this pull request's head is \`${headSha}\` (§2.5)`,
    );
  }
  if (document.pr !== pr) {
    errors.push(`\`pr\` is ${document.pr}, but this is pull request ${pr}`);
  }
  return errors;
};

const invalid = (errors, extra = {}) => ({ state: 'error', errors, ...extra });

export const validateVerdictBody = (body, { pr, headSha, files }) => {
  const { document, errors: readErrors } = readVerdictDocument(body);
  if (document === undefined) {
    return invalid(readErrors);
  }
  const shape = documentShapeErrors(document);
  if (shape.length > 0) {
    return invalid(shape, { document });
  }
  const binding = bindingErrors(document, { pr, headSha });
  if (binding.length > 0) {
    return invalid(binding, { document });
  }
  const admissibility = findingsAdmissibilityErrors(
    document.findings,
    diffIndex(files),
  );
  if (admissibility.length > 0) {
    return invalid(admissibility, { document });
  }
  const consistency = consistencyErrors(document);
  if (consistency.length > 0) {
    return invalid(consistency, { document });
  }
  return {
    state: document.verdict,
    errors: [],
    document,
    blocking: blockingFindingIds(document.findings),
    errorReason: document.error_reason,
  };
};

export const validatePullRequestVerdict = ({
  pr,
  headSha,
  comments,
  files = [],
}) => {
  const selection = selectVerdictComment(comments, headSha);
  if (selection.outcome === 'none') {
    return {
      state: 'absent',
      errors: [],
      reason: 'no verdict has been posted',
    };
  }
  if (selection.outcome === 'stale') {
    return {
      state: 'absent',
      errors: [],
      reason: `the newest verdict names ${selection.otherSha.slice(0, 7)}, not this head (§2.5)`,
    };
  }
  if (selection.outcome === 'duplicate') {
    return invalid([
      `${selection.count} verdicts name this head; §7.5 forbids re-reviewing an unchanged commit, so which one counts is undefined`,
    ]);
  }
  return {
    ...validateVerdictBody(selection.entry.comment.body, {
      pr,
      headSha,
      files,
    }),
    commentUrl: selection.entry.comment.html_url,
  };
};
