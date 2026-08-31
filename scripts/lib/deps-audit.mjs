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

const rankOf = (severity) => {
  const rank = SEVERITY_RANK.indexOf(severity);
  return rank === -1 ? SEVERITY_RANK.length : rank;
};

export const isAtLeast = ({ minimum, severity }) =>
  rankOf(severity) >= rankOf(minimum);

export const auditDidRun = (report) =>
  typeof report?.metadata?.totalDependencies === 'number' &&
  report.metadata.totalDependencies > 0;

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

const allowanceFor = ({ allowances, ghsa }) =>
  allowances.find((allowance) => allowance.ghsa === ghsa);

const isExpired = ({ expires, today }) =>
  typeof expires !== 'string' || expires < today;

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

export const formatAdvisory = (advisory) =>
  `${advisory.severity.padEnd(8)} ${advisory.module} ${advisory.vulnerable} — ${
    advisory.title
  }${advisory.production ? ' [production path]' : ''} (${advisory.ghsa})`;
