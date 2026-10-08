export type ElementSource = {
  readonly declaration: number;
  readonly element: string;
  readonly path: string;
  readonly value: string;
};

export type SqlToken = {
  readonly kind:
    | 'identifier'
    | 'number'
    | 'operator'
    | 'punctuation'
    | 'string';
  readonly quoted: boolean;
  readonly value: string;
};

export type TokenFinding =
  | { readonly kind: 'read'; readonly path: string }
  | { readonly kind: 'source'; readonly source: ElementSource }
  | { readonly kind: 'violation'; readonly text: string };

export type ViewDependency = {
  readonly kind: string;
  readonly relation: string;
};
