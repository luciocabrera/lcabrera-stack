import type { RunComparison } from './report.types.ts';

import { hashLabel } from './hashLabel.util.ts';

type Attribution = Extract<
  RunComparison,
  { readonly kind: 'comparison' }
>['changed'];

export const changedLine = (changed: Attribution) => {
  if (changed.kind === 'none') {
    return 'Changed: no input hash, so nothing recorded explains a difference.';
  }

  return changed.kind === 'single'
    ? `Changed: ${hashLabel(changed.changed)}. That is one cause.`
    : `Changed: ${changed.changed.map((key) => hashLabel(key)).join(', ')}. That is multiple causes, so no single change explains the difference.`;
};
