import type { VirtualSelectHiddenInputsProps } from './VirtualSelectHiddenInputs.types';

export const VirtualSelectHiddenInputs = ({
  name,
  selected,
}: VirtualSelectHiddenInputsProps) => {
  if (name === undefined) return;

  return selected.map((value) => (
    <input key={value} name={name} type='hidden' value={value} />
  ));
};
