// An application renders tables, form controls and headings through its
// component library rather than as raw intrinsic elements, so this reports the
// intrinsic JSX forms of those elements. A hidden `<input>` carries form data
// and draws no control, so one whose last `type` is the literal "hidden" is
// left alone; any other `type`, including an expression, is reported.

import type { TSESTree } from '@typescript-eslint/utils';

import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

const RAW_UI_PRIMITIVES: ReadonlySet<string> = new Set([
  'button',
  'h1',
  'h2',
  'h3',
  'input',
  'select',
  'table',
  'textarea',
]);

const isTypeAttribute = (
  attribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
) =>
  attribute.type === AST_NODE_TYPES.JSXSpreadAttribute ||
  (attribute.name.type === AST_NODE_TYPES.JSXIdentifier &&
    attribute.name.name === 'type');

const isHiddenInput = (node: TSESTree.JSXOpeningElement) => {
  const effective = node.attributes.findLast((attribute) =>
    isTypeAttribute(attribute),
  );

  return (
    effective?.type === AST_NODE_TYPES.JSXAttribute &&
    effective.value?.type === AST_NODE_TYPES.Literal &&
    effective.value.value === 'hidden'
  );
};

export default createRule({
  create(context) {
    return {
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier) {
          return;
        }

        const element = node.name.name;

        if (!RAW_UI_PRIMITIVES.has(element)) {
          return;
        }

        if (element === 'input' && isHiddenInput(node)) {
          return;
        }

        context.report({
          data: { element },
          messageId: 'rawUiPrimitive',
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Disallow raw table, form-control and heading elements in favour of the component library',
    },
    messages: {
      rawUiPrimitive:
        'Render `<{{element}}>` through the component library rather than as a raw intrinsic element.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'no-raw-ui-primitives',
});
