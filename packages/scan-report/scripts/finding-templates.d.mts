/**
 * Type declarations for finding-templates.mjs (plain JS, no build step —
 * runs unmodified via `node --experimental-strip-types` from the .mjs
 * report generators AND is imported here by the TS detail extractors in
 * packages/scan-ingestion). Kept hand-written and colocated rather than
 * generated, since the runtime module must stay plain JS.
 */

export type FallowFindingTemplate = {
  readonly effort: string;
  readonly extra?: Record<string, unknown>;
  readonly findingKind?: string;
  readonly fix: string;
  readonly locationHint?: string;
  readonly locationPath: string;
  readonly ruleId: string;
  readonly severity: string;
  readonly tag: string;
  readonly why: string;
};

type LineItem = {
  readonly col?: null | number;
  readonly line?: null | number;
};

export function buildUnusedFileFinding(item: {
  readonly path?: null | string;
}): FallowFindingTemplate;

export function buildUnusedExportFinding(
  item: LineItem & {
    readonly export_name?: null | string;
    readonly path?: null | string;
  },
): FallowFindingTemplate;

export function buildUnusedTypeFinding(
  item: LineItem & {
    readonly export_name?: null | string;
    readonly path?: null | string;
  },
): FallowFindingTemplate;

export function buildUnusedDependencyFinding(
  item: LineItem & {
    readonly package_name?: null | string;
    readonly path?: null | string;
  },
  isProd: boolean,
): FallowFindingTemplate;

export function buildUnlistedDependencyFinding(item: {
  readonly imported_from?:
    | null
    | (readonly LineItem[] &
        {
          readonly path?: null | string;
        }[]);
  readonly package_name?: null | string;
}): FallowFindingTemplate;

export function buildUnresolvedImportFinding(
  item: LineItem & {
    readonly path?: null | string;
    readonly specifier?: null | string;
  },
): FallowFindingTemplate;

export function buildCircularDependencyFinding(
  item: LineItem & {
    readonly files?: null | readonly string[];
    readonly length?: null | number;
  },
): FallowFindingTemplate;

export function buildCloneGroupFinding(group: {
  readonly instances?:
    | null
    | readonly {
        readonly end_line?: null | number;
        readonly file?: null | string;
        readonly start_line?: null | number;
      }[];
  readonly line_count?: null | number;
  readonly suggested_name?: null | string;
  readonly token_count?: null | number;
}): FallowFindingTemplate;

export const FUNCTION_FINDING_SEVERITY_MAP: Record<string, string>;

export function buildFunctionFinding(
  item: LineItem & {
    readonly cognitive?: null | number;
    readonly crap?: null | number;
    readonly cyclomatic?: null | number;
    readonly exceeded?: null | string;
    readonly name?: null | string;
    readonly path?: null | string;
    readonly severity?: null | string;
  },
): FallowFindingTemplate;

export function buildEslintFixText(
  message: {
    readonly fix?: unknown;
    readonly suggestions?:
      | null
      | readonly {
          readonly desc?: null | string;
        }[];
  },
  ruleId: string,
): string;

export function buildOxlintFixText(
  diagnostic: { readonly help?: null | string },
  ruleId: string,
): string;
