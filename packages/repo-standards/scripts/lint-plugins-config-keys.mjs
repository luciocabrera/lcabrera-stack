/**
 * The top-level keys a Vite+ config file declares, read from its syntax tree
 * rather than its text, so a shorthand, quoted, spread or helper-wrapped key is
 * found and a commented-out or nested one is not. Pure; `./lint-plugins.mjs`
 * re-exports `configsDeclaringKeys` for `../verify-lint-plugins.mjs`.
 */
import { ts } from 'ts-morph';

const isWrapper = (node) =>
  ts.isParenthesizedExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isTypeAssertionExpression(node) ||
  ts.isAwaitExpression(node);

const unwrap = (node) => (isWrapper(node) ? unwrap(node.expression) : node);

const returnStatements = (node) =>
  node.getChildren().flatMap((child) => {
    if (ts.isFunctionLike(child)) return [];
    if (!ts.isReturnStatement(child)) return returnStatements(child);
    return child.expression === undefined ? [] : [child.expression];
  });

const returnedExpressions = (fn) => {
  if (fn.body === undefined) return [];
  return ts.isBlock(fn.body) ? returnStatements(fn.body) : [fn.body];
};

const isFallbackOperator = (token) =>
  token.kind === ts.SyntaxKind.BarBarToken ||
  token.kind === ts.SyntaxKind.QuestionQuestionToken;

const nestedExpressions = (expression) => {
  if (ts.isCallExpression(expression)) return [...expression.arguments];
  if (ts.isConditionalExpression(expression))
    return [expression.whenTrue, expression.whenFalse];
  if (ts.isBinaryExpression(expression))
    return isFallbackOperator(expression.operatorToken)
      ? [expression.left, expression.right]
      : [];
  return ts.isFunctionLike(expression) ? returnedExpressions(expression) : [];
};

const localDeclarations = (sourceFile) =>
  new Map([
    ...sourceFile.statements
      .filter((statement) => ts.isVariableStatement(statement))
      .flatMap((statement) => statement.declarationList.declarations)
      .filter(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.initializer !== undefined,
      )
      .map((declaration) => [declaration.name.text, declaration.initializer]),
    ...sourceFile.statements
      .filter(
        (statement) =>
          ts.isFunctionDeclaration(statement) && statement.name !== undefined,
      )
      .map((statement) => [statement.name.text, statement]),
  ]);

const localObjectLiterals = (identifier, locals, seen) => {
  const declaration = seen.has(identifier.text)
    ? undefined
    : locals.get(identifier.text);
  return declaration === undefined
    ? []
    : objectLiterals(declaration, locals, new Set([...seen, identifier.text]));
};

const objectLiterals = (node, locals, seen) => {
  const expression = unwrap(node);
  if (ts.isObjectLiteralExpression(expression)) return [expression];
  if (ts.isIdentifier(expression))
    return localObjectLiterals(expression, locals, seen);
  return nestedExpressions(expression).flatMap((nested) =>
    objectLiterals(nested, locals, seen),
  );
};

const isLiteralName = (name) =>
  ts.isIdentifier(name) ||
  ts.isStringLiteral(name) ||
  ts.isNoSubstitutionTemplateLiteral(name);

const propertyName = (name) => {
  if (ts.isComputedPropertyName(name))
    return propertyName(unwrap(name.expression));
  return isLiteralName(name) ? name.text : undefined;
};

const topLevelKeys = (object, locals, visited) =>
  object.properties.flatMap((property) =>
    ts.isSpreadAssignment(property)
      ? objectLiterals(property.expression, locals, new Set())
          .filter((spread) => !visited.has(spread))
          .flatMap((spread) =>
            topLevelKeys(spread, locals, new Set([...visited, spread])),
          )
      : [propertyName(property.name)],
  );

const namedImports = (statement) => {
  const bindings = statement.importClause?.namedBindings;
  return bindings !== undefined && ts.isNamedImports(bindings)
    ? bindings.elements
    : [];
};

const defineConfigNames = (sourceFile) =>
  new Set([
    'defineConfig',
    ...sourceFile.statements
      .filter((statement) => ts.isImportDeclaration(statement))
      .flatMap((statement) => namedImports(statement))
      .filter(
        (specifier) =>
          (specifier.propertyName ?? specifier.name).text === 'defineConfig',
      )
      .map((specifier) => specifier.name.text),
  ]);

const isDefineConfigCallee = (callee, names) =>
  (ts.isPropertyAccessExpression(callee) &&
    callee.name.text === 'defineConfig') ||
  (ts.isIdentifier(callee) && names.has(callee.text));

const isDefineConfigCall = (node, names) =>
  ts.isCallExpression(node) &&
  isDefineConfigCallee(unwrap(node.expression), names);

const isDefaultExportedFunction = (node) =>
  ts.isFunctionDeclaration(node) &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.ExportDefault) ===
    ts.ModifierFlags.ExportDefault;

const ownRoots = (node, names) => {
  if (isDefineConfigCall(node, names)) return [...node.arguments];
  if (ts.isExportAssignment(node))
    return node.isExportEquals ? [] : [node.expression];
  return isDefaultExportedFunction(node) ? [node] : [];
};

const configRoots = (node, names) => [
  ...ownRoots(node, names),
  ...node.getChildren().flatMap((child) => configRoots(child, names)),
];

const declaredConfigKeys = (path, text) => {
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const locals = localDeclarations(sourceFile);
  return new Set(
    configRoots(sourceFile, defineConfigNames(sourceFile))
      .flatMap((root) => objectLiterals(root, locals, new Set()))
      .flatMap((object) => topLevelKeys(object, locals, new Set([object]))),
  );
};

export const configsDeclaringKeys = (files, keys) =>
  files
    .filter(({ path }) => path !== 'vite.config.ts')
    .flatMap(({ path, text }) => {
      const declared = declaredConfigKeys(path, text);
      return keys
        .filter((key) => declared.has(key))
        .map((key) => ({ key, path }));
    });
