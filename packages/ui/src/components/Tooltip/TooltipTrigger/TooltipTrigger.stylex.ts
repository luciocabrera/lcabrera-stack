import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  trigger: (anchorName: string) => ({
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
    anchorName,
    display: 'inline-flex',
  }),
});
