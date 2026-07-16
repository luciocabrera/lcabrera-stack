type ResolvePushSourceLabelArgs = {
  readonly host: null | string;
};

/**
 * The `source_label` recorded against a CLI-pushed snapshot, from the
 * `X-CodePulse-Host` header. The header is optional and client-supplied, so a
 * missing one is normal rather than an error — it degrades to `cli:unknown`.
 */
export const resolvePushSourceLabel = ({ host }: ResolvePushSourceLabelArgs) =>
  `cli:${host ?? 'unknown'}`;
