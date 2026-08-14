// Per-rule why/fix wording for the deterministic scanners (fallow, eslint,
// oxlint). Exported rather than kept private because it has two independent
// kinds of consumer and neither may drift from the other:
//
//   1. The report generators beside this file, which write this text straight
//      into report.json/report.md — what an agent reads to build a work plan.
//   2. Whatever re-derives per-finding detail from a raw artifact downstream,
//      typically to store the same text as real columns rather than only
//      inside the generic finding blob. That is what the `./finding-templates`
//      export is for; pair it with `makeFindingId` from `./deterministic-scan`
//      to reproduce the same finding identities.
//
// Before this module existed, both kinds hand-authored the wording separately
// — the exact drift it exists to prevent, caught live when eslint's real
// suggestion text was discarded in favour of a hardcoded "Address per rule: X."
// on one side only.
//
// Each builder returns exactly the fields that vary per rule/per raw item
// (ruleId, severity, why, fix, effort, tag, locationPath, locationHint, plus
// optional findingKind/extra for the clone-group case). Constant scaffolding
// that never varies (confidence, status, tags, verification_steps,
// evidence_excerpt) intentionally stays wherever each consumer already
// builds its own full finding shape — a hardcoded literal can't drift from
// itself, so there is nothing to share there.

const lineHint = (item) => {
  if (typeof item.line !== 'number') return undefined;
  const column = typeof item.col === 'number' ? `:${item.col}` : '';
  return `${item.line}${column}`;
};

export const buildUnusedFileFinding = (item) => ({
  effort: 'small',
  fix: 'Verify no dynamic/framework usage, then delete the file (or suppress with a fallow-ignore-file comment).',
  locationPath: item.path ?? '',
  ruleId: 'fallow/unused-file',
  severity: 'MEDIUM',
  tag: 'dead-code',
  why: 'File is never imported from any detected entry point.',
});

export const buildUnusedExportFinding = (item) => ({
  effort: 'small',
  fix: 'Remove the unused export (verify it is not public API if it is a re-export).',
  locationHint: lineHint(item),
  locationPath: item.path ?? '',
  ruleId: 'fallow/unused-export',
  severity: 'MEDIUM',
  tag: 'dead-code',
  why: `Export \`${item.export_name ?? '<unknown>'}\` is never imported anywhere.`,
});

export const buildUnusedTypeFinding = (item) => ({
  effort: 'small',
  fix: 'Remove the `export` keyword from the type declaration (or delete the type).',
  locationHint: lineHint(item),
  locationPath: item.path ?? '',
  ruleId: 'fallow/unused-type',
  severity: 'LOW',
  tag: 'dead-code',
  why: `Exported type \`${item.export_name ?? '<unknown>'}\` is never imported anywhere.`,
});

export const buildUnusedDependencyFinding = (item, isProd) => ({
  effort: 'small',
  fix: 'Remove the dependency from package.json (or move it to the workspace that actually imports it).',
  locationHint: lineHint(item),
  locationPath: item.path ?? 'package.json',
  ruleId: 'fallow/unused-dependency',
  severity: isProd ? 'HIGH' : 'MEDIUM',
  tag: 'dependencies',
  why: `Dependency \`${item.package_name ?? '<unknown>'}\` is declared but never imported in this workspace.`,
});

export const buildUnlistedDependencyFinding = (item) => ({
  effort: 'small',
  fix: 'Add the package to dependencies in package.json (or to ignoreDependencies in the fallow config if intentional).',
  locationHint: lineHint(item.imported_from?.[0] ?? {}),
  locationPath: item.imported_from?.[0]?.path ?? 'package.json',
  ruleId: 'fallow/unlisted-dependency',
  severity: 'HIGH',
  tag: 'dependencies',
  why: `Package \`${item.package_name ?? '<unknown>'}\` is imported but not declared in package.json.`,
});

export const buildUnresolvedImportFinding = (item) => ({
  effort: 'small',
  fix: 'Fix the import specifier or restore the missing module.',
  locationHint: lineHint(item),
  locationPath: item.path ?? '',
  ruleId: 'fallow/unresolved-import',
  severity: 'HIGH',
  tag: 'imports',
  why: `Import \`${item.specifier ?? '<unknown>'}\` cannot be resolved.`,
});

export const buildCircularDependencyFinding = (item) => ({
  effort: 'medium',
  fix: 'Extract the shared logic into a separate module to break the cycle.',
  locationHint: lineHint(item),
  locationPath: item.files?.[0] ?? '',
  ruleId: 'fallow/circular-dependency',
  severity: 'MEDIUM',
  tag: 'architecture',
  why: `Import cycle of length ${item.length ?? item.files?.length ?? 0}: ${(item.files ?? []).join(' → ')}.`,
});

export const buildCloneGroupFinding = (group) => {
  const instances = group.instances ?? [];
  const primary = instances[0] ?? {};
  const suggestion = group.suggested_name
    ? ` (suggested name: \`${group.suggested_name}\`)`
    : '';
  return {
    effort: 'medium',
    extra: {
      instances: instances.map((instance) => ({
        location_hint: `${instance.start_line ?? ''}-${instance.end_line ?? ''}`,
        path: instance.file ?? '',
      })),
    },
    findingKind: 'duplication_group',
    fix: `Extract the duplicated block into a shared helper${suggestion}.`,
    locationHint: `${primary.start_line ?? ''}-${primary.end_line ?? ''}`,
    locationPath: primary.file ?? '',
    ruleId: 'fallow/duplicate-code',
    severity: 'MEDIUM',
    tag: 'duplication',
    why: `${instances.length} duplicated instance(s) of the same ${group.line_count ?? '?'}-line block (${group.token_count ?? '?'} tokens).`,
  };
};

// fallow's critical|high|moderate → canonical (BLOCKER stays reserved for
// the interactive skill's runtime-impact judgment).
export const FUNCTION_FINDING_SEVERITY_MAP = {
  critical: 'HIGH',
  high: 'MEDIUM',
  moderate: 'LOW',
};

export const buildFunctionFinding = (item) => ({
  effort: 'medium',
  fix: `Refactor \`${item.name ?? '<anonymous>'}\` below the thresholds (extract helpers) or add test coverage to lower its CRAP score.`,
  locationHint: lineHint(item),
  locationPath: item.path ?? '',
  ruleId: 'fallow/complexity-threshold',
  severity: FUNCTION_FINDING_SEVERITY_MAP[item.severity] ?? 'LOW',
  tag: 'complexity',
  why: `Function \`${item.name ?? '<anonymous>'}\` exceeds ${item.exceeded ?? 'complexity'} threshold(s): cyclomatic ${item.cyclomatic ?? '?'}, cognitive ${item.cognitive ?? '?'}, CRAP ${item.crap ?? '?'}.`,
});

// eslint's real per-message suggestion text (messages[].suggestions[].desc)
// or the underlying autofix edit — previously discarded in favor of a
// generic "Address per rule: X." placeholder on the generic-findings path
// only, while the boolean fixable flag was the only thing that survived
// anywhere queryable. Falls back to the same placeholder when eslint gives
// nothing more specific.
export const buildEslintFixText = (message, ruleId) => {
  const suggestionDesc = message.suggestions?.[0]?.desc;
  if (typeof suggestionDesc === 'string' && suggestionDesc.length > 0) {
    return suggestionDesc;
  }
  if (message.fix) {
    return `Autofixable via \`eslint --fix\` (rule: ${ruleId}).`;
  }
  return `Address per rule: ${ruleId}.`;
};

// oxlint's diagnostics[].help is already real, tool-authored guidance —
// this just gives both consumers (report generator + lint_violations
// extractor) one place to agree on the fallback wording.
export const buildOxlintFixText = (diagnostic, ruleId) =>
  diagnostic.help ?? `Address per rule: ${ruleId}.`;
