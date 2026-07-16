type ParseAllowedToolsArgs = {
  readonly allowedTools: string;
};

/**
 * Splits the comma-separated allowed-tools field into the array the registry
 * and the on-disk artifacts both take, or undefined when the field is blank —
 * undefined leaves the column unset rather than storing an empty list, which
 * is what "no restriction" means (ADR-023).
 */
export const parseAllowedTools = ({ allowedTools }: ParseAllowedToolsArgs) =>
  allowedTools ? allowedTools.split(',').map((tool) => tool.trim()) : undefined;
