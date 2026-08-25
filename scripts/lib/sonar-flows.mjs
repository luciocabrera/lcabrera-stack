/**
 * The source-to-sink path SonarCloud traced for a taint finding, shaped for the
 * report.
 *
 * Why it is carried at all: for a taint rule the flow is the finding. Without
 * it the source has to be inferred from the callers, which produced two wrong
 * fixes in a row (#916, #918) before anyone read what Sonar was actually
 * pointing at. See #924.
 *
 * Governed by .claude/rules/scripts.md.
 */

/**
 * Locations run sink-first, as SonarCloud returns them — deliberately not
 * reversed. The `Source:` step is the last line, which is where a reader
 * following the path backwards starts.
 */
export const normalizeFlows = (flows, relPath) =>
  (flows ?? [])
    .map((flow) =>
      (flow.locations ?? []).map((location) => ({
        file: location.component ? relPath(location.component) : null,
        line: location.textRange?.startLine ?? null,
        message: location.msg ?? null,
      })),
    )
    .filter((locations) => locations.length > 0);
