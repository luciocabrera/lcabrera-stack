import type {
  BuiltReadQuery,
  ReadQueryDescriptor,
} from './query-builder.types.ts';

import { buildGroupedRead } from '../group-query-builder/build-grouped-read.util.ts';
import { buildCountRead } from './build-count-read.util.ts';
import { buildRowsRead } from './build-rows-read.util.ts';

export const buildReadQuery = <TDescriptor extends ReadQueryDescriptor>(
  descriptor: TDescriptor,
) => {
  const read: ReadQueryDescriptor = descriptor;

  if (read.grouping !== undefined) {
    return buildGroupedRead(read) as BuiltReadQuery<TDescriptor>;
  }

  const built =
    read.count === true ? buildCountRead(read) : buildRowsRead(read);

  return built as BuiltReadQuery<TDescriptor>;
};
