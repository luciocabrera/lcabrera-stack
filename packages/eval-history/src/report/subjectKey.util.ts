type SubjectKeyArgs = {
  readonly kind: string;
  readonly name: string;
};

export const subjectKey = ({ kind, name }: SubjectKeyArgs) => `${kind}:${name}`;
