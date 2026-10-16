import type { HashEntry } from './report.types.ts';

export const isRecordedHash = (
  entry: HashEntry,
): entry is readonly [string, string] => entry[1] !== undefined;
