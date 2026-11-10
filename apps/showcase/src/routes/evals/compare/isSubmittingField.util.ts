import type { Location } from 'react-router';

type IsSubmittingFieldArgs = {
  readonly field: string;
  readonly location: Location | undefined;
};

export const isSubmittingField = ({ field, location }: IsSubmittingFieldArgs) =>
  location !== undefined && new URLSearchParams(location.search).has(field);
