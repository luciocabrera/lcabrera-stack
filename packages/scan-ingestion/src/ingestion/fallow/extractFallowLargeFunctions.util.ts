import type { FallowLargeFunctionInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowLargeFunctionsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_large_functions rows (health.large_functions) — functions
 * over the unit-size threshold, including anonymous ones (fallow reports
 * those as '<arrow>').
 */
export const extractFallowLargeFunctions = ({
  raw,
}: ExtractFallowLargeFunctionsArgs): readonly FallowLargeFunctionInput[] =>
  (raw.health?.large_functions ?? []).map((largeFunction) => ({
    file_path: largeFunction.path,
    function_name: largeFunction.name ?? undefined,
    line: largeFunction.line ?? undefined,
    line_count: largeFunction.line_count,
  }));
