export type IsCheckboxCheckedArgs = {
  readonly formData: FormData;
  readonly name: string;
};

/**
 * Native checkbox semantics, strictly: the shared Form's boolean fields post
 * exactly `'on'` when checked and are absent when unchecked. A bare presence
 * check would read a crafted empty value as `true`, so the server parse must
 * not be looser than the browser (ADR-005: the action's Zod parse is
 * authoritative, not the client widget).
 */
export const isCheckboxChecked = ({ formData, name }: IsCheckboxCheckedArgs) =>
  formData.get(name) === 'on';
