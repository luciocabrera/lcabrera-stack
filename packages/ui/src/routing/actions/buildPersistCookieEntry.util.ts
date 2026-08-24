import type { PersistCookieEntry } from './routing.types';

type BuildPersistCookieEntryArgs = {
  readonly key: string;
  readonly value: string;
};

export const buildPersistCookieEntry = ({
  key,
  value,
}: BuildPersistCookieEntryArgs) =>
  ({
    key,
    searchParamKey: '',
    searchParamValue: '',
    value,
  }) satisfies PersistCookieEntry;
