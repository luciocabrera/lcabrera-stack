/**
 * The pure half of the dependency-advisory gate
 * (scripts/verify-deps-audit.mjs).
 *
 * Two properties this module exists to hold, both learned from #516:
 *
 * **A clean report and a report that never happened look identical.** `pnpm
 * audit` needs the registry. If it cannot reach it, the honest answer is "no
 * answer" — but the shape of "no advisories" is an empty object either way, and
 * a supply-chain gate that reports green because the network was down is worse
 * than no gate, because it is trusted. `auditDidRun` is the discriminator: a
 * real audit always counts the tree it walked, so a report claiming zero
 * dependencies did not run.
 *
 * **An allowance list rots.** The same issue found `minimumReleaseAgeExclude`
 * with 13 of 15 entries pinned to versions that no longer resolve — a file
 * recording a posture the repo was not running. So an allowance here is not a
 * permanent grant: it names the advisory it covers, it expires, and this module
 * reports both an entry that has expired and one that no longer matches
 * anything. A grant nobody rechecks is how the last list died.
 */

/** Least to most severe, as npm/pnpm spell them. Index IS the rank. */
const SEVERITY_RANK = ['info', 'low', 'moderate', 'high', 'critical'];

/** Unknown severities sort above everything, so a new spelling is never ignored. */
const rankOf = (severity) => {
  const rank = SEVERITY_RANK.indexOf(severity);
  return rank === -1 ? SEVERITY_RANK.length : rank;
};

export const isAtLeast = ({ minimum, severity }) =>
  rankOf(severity) >= rankOf(minimum);

/**
 * True when the report is evidence of an audit that actually walked the tree.
 *
 * `totalDependencies` is the tell. A successful audit of this monorepo counts
 * over a thousand packages; a report produced without reaching the registry
 * carries no count at all. Checking the advisory list instead would accept
 * exactly the failure this guards against.
 */
export const auditDidRun = (report) =>
  typeof report?.metadata?.totalDependencies === 'number' &&
  report.metadata.totalDependencies > 0;

/**
 * The advisories in a report, normalised to the fields a decision needs.
 *
 * Keyed by `github_advisory_id` rather than the numeric `id`: the number is
 * assigned by whichever registry answered and is not stable across them, so an
 * allowance keyed by it would silently stop matching. The GHSA identifier is
 * the durable name for the vulnerability itself.
 *
 * `production` comes from the findings rather than the advisory: the same
 * advisory can reach a tree through both a dev and a runtime path, and a
 * runtime path anywhere is what makes it a shipping concern (#516 Finding 1
 * turned on exactly this distinction).
 */
export const readAdvisories = (report) =>
  Object.values(report?.advisories ?? {})
    .map((advisory) => ({
      ghsa: advisory.github_advisory_id ?? `pnpm-${advisory.id}`,
      module: advisory.module_name,
      patched: advisory.patched_versions,
      production: (advisory.findings ?? []).some(
        (finding) => finding.dev === false,
      ),
      severity: advisory.severity,
      title: advisory.title,
      url: advisory.url,
      vulnerable: advisory.vulnerable_versions,
    }))
    .sort(
      (left, right) =>
        rankOf(right.severity) - rankOf(left.severity) ||
        left.ghsa.localeCompare(right.ghsa),
    );

/** An allowance covers an advisory when it names the same GHSA. */
const allowanceFor = ({ allowances, ghsa }) =>
  allowances.find((allowance) => allowance.ghsa === ghsa);

/**
 * An allowance is spent once its review date has passed.
 *
 * Compared as strings because both sides are `YYYY-MM-DD`, where lexical and
 * chronological order agree — no Date parsing, and no timezone in which the
 * gate flips at midnight for some contributors and not others.
 */
const isExpired = ({ expires, today }) =>
  typeof expires !== 'string' || expires < today;

/**
 * Splits the advisories into what blocks and what is knowingly carried, and
 * reports the allowances that no longer earn their place.
 *
 * An advisory below `minimumSeverity` is reported as `ignored` rather than
 * dropped, so "we do not gate on low" stays a visible choice rather than a
 * silence indistinguishable from having found nothing.
 */
export const classifyAdvisories = ({
  advisories,
  allowances = [],
  minimumSeverity = 'moderate',
  today,
}) => {
  const gated = advisories.filter((advisory) =>
    isAtLeast({ minimum: minimumSeverity, severity: advisory.severity }),
  );

  const blocking = [];
  const carried = [];

  for (const advisory of gated) {
    const allowance = allowanceFor({ allowances, ghsa: advisory.ghsa });
    if (allowance === undefined) {
      blocking.push({ ...advisory, why: 'not allowed' });
    } else if (isExpired({ expires: allowance.expires, today })) {
      blocking.push({
        ...advisory,
        why: `allowance expired ${allowance.expires ?? '(no date)'}`,
      });
    } else {
      carried.push({ ...advisory, allowance });
    }
  }

  const matched = new Set(advisories.map((advisory) => advisory.ghsa));

  return {
    blocking,
    carried,
    ignored: advisories.filter(
      (advisory) =>
        !isAtLeast({ minimum: minimumSeverity, severity: advisory.severity }),
    ),
    stale: allowances.filter((allowance) => !matched.has(allowance.ghsa)),
  };
};

/** One advisory as a single reviewable line. */
export const formatAdvisory = (advisory) =>
  `${advisory.severity.padEnd(8)} ${advisory.module} ${advisory.vulnerable} — ${
    advisory.title
  }${advisory.production ? ' [production path]' : ''} (${advisory.ghsa})`;
