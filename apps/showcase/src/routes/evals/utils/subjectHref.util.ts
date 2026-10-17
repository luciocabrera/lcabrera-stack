type SubjectHrefArgs = {
  readonly kind: string;
  readonly name: string;
};

export const subjectHref = ({ kind, name }: SubjectHrefArgs) =>
  `/evals/subjects/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`;
