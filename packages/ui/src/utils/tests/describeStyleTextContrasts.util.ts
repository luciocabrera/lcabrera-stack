/**
 * Registers one test per style, theme and background that `listStyleTextContrasts` measures, each asking for WCAG AA body-text contrast.
 */

import { describe, expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from './listStyleTextContrasts.util';

type DescribeStyleTextContrastsArgs = Parameters<
  typeof listStyleTextContrasts
>[0] & {
  readonly title: string;
};

const WCAG_AA_BODY_TEXT = 4.5;

export const describeStyleTextContrasts = async ({
  title,
  ...measured
}: DescribeStyleTextContrastsArgs) => {
  const contrasts = await listStyleTextContrasts(measured);

  describe(title, () => {
    it.each(contrasts)(
      '$theme $name meets WCAG AA on $background',
      ({ ratio }) => {
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
      },
    );
  });
};
