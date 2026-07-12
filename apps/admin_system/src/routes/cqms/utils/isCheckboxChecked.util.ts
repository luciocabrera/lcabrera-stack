type IsCheckboxCheckedArgs = {
  readonly formData: FormData;
  readonly name: string;
};

/**
 * Native checkbox semantics, strictly: the shared Form's boolean fields are
 * plain `<input type="checkbox">`s without a value attribute, so a checked
 * box posts exactly `'on'` and an unchecked one is absent. A bare presence
 * check would read a crafted empty-string value as true — the server parse
 * must not be looser than the browser (ADR-005: the action's Zod parse is
 * authoritative, not the client widget).
 */
export const isCheckboxChecked = ({ formData, name }: IsCheckboxCheckedArgs) =>
  formData.get(name) === 'on';
