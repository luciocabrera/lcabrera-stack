import { projectedRelation } from './projectedRelation.util.ts';

type AnnotationsQueryArgs = {
  readonly from: Date;
  readonly publicColumns: ReadonlySet<string>;
  readonly to: Date;
};

export const annotationsQuery = ({
  from,
  publicColumns,
  to,
}: AnnotationsQueryArgs) => ({
  text: `select
  annotation.id::text as "annotationId",
  annotation.at,
  annotation.kind::text as kind
from ${projectedRelation({ columns: ['id', 'at', 'kind'], publicColumns, table: 'eval_annotation' })} annotation
where annotation.at between $1 and $2
order by annotation.at, annotation.id`,
  values: [from, to],
});
