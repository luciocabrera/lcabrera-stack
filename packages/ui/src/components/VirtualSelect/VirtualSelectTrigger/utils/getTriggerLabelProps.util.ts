type GetTriggerLabelPropsArgs = {
  readonly labelId: string | undefined;
};

export const getTriggerLabelProps = ({ labelId }: GetTriggerLabelPropsArgs) => {
  if (labelId === undefined) return {};

  const triggerId = `${labelId}-trigger`;

  return {
    'aria-labelledby': `${labelId} ${triggerId}`,
    id: triggerId,
  };
};
