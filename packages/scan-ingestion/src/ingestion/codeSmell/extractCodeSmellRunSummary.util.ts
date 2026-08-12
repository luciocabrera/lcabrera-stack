import type { Report } from '../report.schema.ts';
import type { CodeSmellRunSummaryInput } from './codeSmell.types.ts';

type ExtractCodeSmellRunSummaryArgs = {
  readonly report: Report;
};

/**
 * The cqms.code_smell_(checker|zen)_runs master row (1:1 with the scan,
 * ADR-019 addendum) — shared by both LLM scanners; the dispatcher routes
 * it to the scanner's own procedure/table. Identity fields
 * (report_id/generated_at/files_analyzed/top_risk) come from the report
 * metadata; every count is DERIVED FROM THE FINDINGS ARRAY — cqms.reports
 * keeps the tool's own claimed severity counts, this master is the
 * verifiable findings rollup (including the confidence/effort dimensions
 * the generic projection does not carry).
 */
export const extractCodeSmellRunSummary = ({
  report,
}: ExtractCodeSmellRunSummaryArgs): CodeSmellRunSummaryInput => {
  const countBy = (isMatch: (finding: Report['findings'][number]) => boolean) =>
    report.findings.filter((finding) => isMatch(finding)).length;

  return {
    blocker_count: countBy((f) => f.severity === 'BLOCKER'),
    confidence_high_count: countBy((f) => f.confidence === 'high'),
    confidence_low_count: countBy((f) => f.confidence === 'low'),
    confidence_medium_count: countBy((f) => f.confidence === 'medium'),
    effort_large_count: countBy((f) => f.effort === 'large'),
    effort_medium_count: countBy((f) => f.effort === 'medium'),
    effort_small_count: countBy((f) => f.effort === 'small'),
    files_analyzed: report.files_analyzed,
    finding_count: report.findings.length,
    generated_at: report.generated_at,
    high_count: countBy((f) => f.severity === 'HIGH'),
    low_count: countBy((f) => f.severity === 'LOW'),
    medium_count: countBy((f) => f.severity === 'MEDIUM'),
    nit_count: countBy((f) => f.severity === 'NIT'),
    report_id: report.report_id,
    rules_flagged_count: new Set(report.findings.map((f) => f.rule_id)).size,
    top_risk: report.top_risk ?? undefined,
  };
};
