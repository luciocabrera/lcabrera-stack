# Form Architecture

Declarative, `fields`-driven form component — the `Table`/`columns` philosophy
applied to forms (`fields` instead of `columns`). Renders from a recursive
`group`/`row`/`tab`/leaf field tree, submits through React Router 7's native
`<Form>` (or `useFetcher().Form` as an opt-in), and supports `create`/`edit`/
`view` modes with dirty-check-gated edit submission and a built-in
Accept/Cancel footer (see ADR-005, and ADR-014 for the `path` field type
and Cancel's discard-changes confirmation).

## File Structure

Every component gets its own directory with its own `.types.ts` (bundle
pattern) — including internal, non-barrel-exported delegates like `FormBody`,
`FormFields`, `FormField`, and each leaf field, matching `Table`'s own
`TableContent` precedent for private view delegates.

```
Form/
├── ARCHITECTURE.md
├── Form.component.tsx        → Root: thin shell — FormProvider (owns all init) + FormBody
├── Form.test.tsx             → Integration tests via react-router's createRoutesStub
├── Form.types.ts             → FieldNode union, FormProps, FormMode
├── index.ts                  → Barrel: Form + public types
│
├── FormBody/
│   ├── FormBody.component.tsx → The view shell: RR7 Form/fetcher.Form (formId-keyed) + submit gating; self-connects formId/submission
│   ├── FormBodyFooter/        → Footer shell for discard-changes confirmation + private action-row delegate
│   ├── FormBody.stylex.ts
│   ├── FormBody.types.ts      → Pick<FormProps, 'action' | 'children' | 'method'>
│   └── index.ts
│
├── contexts/
│   ├── index.ts               → Barrel: FormProvider + all selectors/actions
│   └── FormContext/
│       ├── FormContext.context.ts    → createContext (undefined default)
│       ├── FormContext.provider.tsx  → Provider: owns init (useId, flattenFields, both store snapshots via utils), syncs serverErrors/mode/fields props
│       ├── FormContext.types.ts      → FormFieldsState, FormMetaState, FormContextValue, FormProviderProps
│       ├── useFormContextValue.hook.ts → use(FormContext) with guard (infra only)
│       ├── useFieldsStore.hook.ts     → Shared useSyncExternalStore wrapper over fieldsStore (mirrors Table's useColumnsStore/useFiltersStore)
│       ├── useMetaStore.hook.ts       → Shared useSyncExternalStore wrapper over metaStore (mirrors Table's useMetaStore)
│       ├── actions/
│       │   ├── useSetFieldValue.hook.ts  → Writes one field's value into fieldsStore
│       │   └── useSubmitForm.hook.ts     → Pre-submit gate (no args): reads metaStore (mode + leafFields) + fieldsStore, dirty-check + validateFields
│       ├── selectors/
│       │   ├── useGetFieldError.hook.ts   → useFieldsStore((s) => s.errors[accessor])
│       │   ├── useGetFieldValue.hook.ts   → useFieldsStore((s) => s.values[accessor])
│       │   ├── useGetFormCancelLabel.hook.ts → useMetaStore((s) => s.cancelLabel)
│       │   ├── useGetFormCancelTo.hook.ts    → useMetaStore((s) => s.cancelTo)
│       │   ├── useGetFormFields.hook.ts      → useMetaStore((s) => s.fields)
│       │   ├── useGetFormId.hook.ts          → useMetaStore((s) => s.formId)
│       │   ├── useGetFormLeafFields.hook.ts  → useMetaStore((s) => s.leafFields)
│       │   ├── useGetFormMode.hook.ts        → useMetaStore((s) => s.mode)
│       │   ├── useGetFormSubmission.hook.ts  → useMetaStore((s) => s.submission)
│       │   ├── useGetFormSubmitLabel.hook.ts → useMetaStore((s) => s.submitLabel)
│       │   └── useGetIsFormDirty.hook.ts     → useFieldsStore((s) => isFormDirty(...))
│       └── utils/
│           ├── getInitialFieldsState.util.ts   → initialValues/leafFields/serverErrors → first fieldsStore snapshot (+ .test)
│           └── getInitialFormMetaState.util.ts → Form props → first metaStore snapshot, resolves label/submission defaults (+ .test)
│
├── FormFields/
│   ├── FormFields.component.tsx  → Store-connected root (zero props): useGetFormFields → FormFieldsList
│   ├── FormFieldsList/           → Recursive walker: computes stable key, dispatches each node type to its subcomponent
│   │   ├── FormFieldsList.component.tsx
│   │   ├── FormFieldsList.types.ts
│   │   └── FormFieldsList.stylex.ts → `stack` layout only
│   ├── contexts/
│   │   └── FormFieldsRendererContext/ → Supplies `FormFieldsList` to Group/Row/Tabs (see below — breaks an import cycle)
│   │       ├── FormFieldsRendererContext.context.ts → createContext (undefined default)
│   │       ├── FormFieldsRendererContext.types.ts   → RenderFieldsFn (TValues erased to Record<string, unknown> at the boundary, mirrors AnyFieldComponent)
│   │       └── useFormFieldsRendererContext.hook.ts → use(context) with guard (infra only)
│   ├── FormFieldGroup/           → `group` node: bordered card section with an optional header; `collapsible`/`defaultCollapsed` make the header a toggle button (collapsed body is display:none, not unmounted, so values still submit) (.component + .types + .stylex + .test)
│   ├── FormFieldRow/             → `row` node: horizontal equal-flex cells of nested fields (.component + .types + .stylex + .test)
│   ├── FormFieldTabs/            → `tab` node: one Tabs panel per tab (.component + .types + .test)
│   └── utils/
│       ├── collectAccessors.util.ts → Node → flattened leaf accessors (recursive, + .test)
│       └── getFieldKey.util.ts      → Node → stable `type:accessor|accessor` React key (+ .test)
├── FormField/
│   ├── FormField.component.tsx   → Registry dispatch by field.type
│   ├── FormField.types.ts
│   └── FormField.constants.ts    → fieldRegistry: type → leaf component
├── FormFieldChrome/
│   ├── FormFieldChrome.component.tsx → Shared label/description/error wrapper
│   └── FormFieldChrome.types.ts
│
├── fields/
│   ├── useFormField.hook.ts → Shared per-leaf-field wiring: useId + value/error/mode selectors + isDisabled + accessor-bound setValue (every leaf field consumes it)
│   ├── TextField/     → text | email | password | textarea (new bare input)
│   ├── NumberField/   → number (new bare input)
│   ├── DateField/     → date | datetime (new bare input)
│   ├── BooleanField/  → wraps Checkbox or ToggleSwitch
│   ├── SelectField/   → wraps VirtualSelect + hidden inputs for FormData
│   ├── RadioField/    → wraps RadioOptionGroup
│   ├── CustomField/   → escape hatch via field.renderField(...)
│   └── FormFieldDisplay/ → read-only `view`-mode renderer: label + formatted value text (not a disabled widget). formatFieldDisplayValue.util + resolveOptionLabels.util
│   (each: <Name>.component.tsx + <Name>.types.ts, TextField/RadioField/FormFieldDisplay also <Name>.stylex.ts)
│   (the former PathField/PathBrowserModal `path` leaf was removed by ADR-028 — no filesystem-coupled field types)
│
└── utils/
    ├── flattenFields.util.ts    → Recursive walker → readonly LeafFieldDef[]
    ├── getInitialValues.util.ts → leafFields + initialValues → full TValues
    ├── validateFields.util.ts   → Hand-rolled client validation (non-Zod, instant feedback only)
    └── isFormDirty.util.ts      → Subset compare (array-aware) for edit-mode gating
```

## Store Pattern

**Two stores in one `FormContext`, not one combined store** — matching
`Table`'s `TableConfigContextValue` (`columnsStore` + `metaStore` together)
rather than treating "one context" as "one store." Split by rate-of-change
and by whether the state is keyed to a single field, per the `store-pattern`
skill:

```typescript
// Low-frequency, form-level config — not keyed by any field.
// Fields are to a form what columns are to the table: definitions owned by
// the store so consumers subscribe via selectors instead of prop drilling.
FormMetaState<TValues> = {
  cancelLabel: string;      // default resolved at init ('Cancel')
  cancelTo: string;
  fields: readonly FieldNode<TValues>[];
  formId: string;           // provider-owned useId — hidden-input marker + fetcher key
  leafFields: readonly LeafFieldDef<TValues>[];
  mode: FormMode;
  submission: FormSubmission; // default resolved at init ('navigation')
  submitLabel: string;      // default resolved at init ('Accept')
};

// High-frequency, every slice keyed by accessor
FormFieldsState<TValues> = {
  errors: FieldErrors<TValues>;
  initialValues: TValues;  // frozen pristine snapshot from mount — edit-mode dirty baseline
  values: TValues;
};
```

Each store gets its own thin `useSyncExternalStore` wrapper —
`useFieldsStore(selector)` and `useMetaStore(selector)` — exactly mirroring
`Table`'s `useColumnsStore`/`useMetaStore`/`useFiltersStore`. Every selector
hook (`useGetFieldValue`, `useGetFieldError`, `useGetFormMode`,
`useGetIsFormDirty`) is then a one-line call into the matching store-hook
with its own selector function — including the accessor-keyed ones
(`useGetFieldValue(accessor)` selects `state.values[accessor]`), the same
shape as `Table`'s `useGetNormalizedColumn(columnKey)` and `FiltersData`'s
`useGetFilterData(columnKey)`. Components never touch `fieldsStore.get()`/
`.set()` or `metaStore.get()`/`.set()` directly — only these selector hooks
and the action hooks (`useSetFieldValue`, `useSubmitForm`).

Why split at all, given `useSyncExternalStore`'s snapshot-equality check
already prevents unnecessary re-renders regardless: every write to either
store still wakes every subscriber of _that_ store to re-run its selector,
even when the result doesn't change enough to re-render. Keeping `values`
(written on every keystroke) out of the same store as `mode` (written
essentially never) means a value change doesn't invoke `mode`'s selector at
all — the same reasoning `Table` already applies by keeping `columnsStore`
separate from `dataStore`. `useSubmitForm` is the one action that needs
both stores (mode to decide whether to run the dirty check, values/
initialValues to run it) — reading multiple stores from one action and
snapshotting each once is an explicitly allowed action responsibility, the
same as `Table`'s `useSetColumnFilter` reading both `TableConfig` and
`TableData`.

`FormProvider` is the only place that creates the stores and computes both
initial snapshots (`useId` + `flattenFields` + the two `getInitial*State`
utils, mirroring `ColumnDrawerContext`'s `getInitialColumnsState`); it also
re-syncs `serverErrors`, `mode`, and `fields` (definitions rebuilt from
fresh loader data) when those prop identities change. `Form.component.tsx`
is a pure composition shell. Labels and `submission` are init-only config.

### State Ownership Rule

No store state is prop-drilled through the shells. Each delegate reads the
selectors and dispatches the actions it needs itself:

| Delegate                | Reads (selectors)                                                       | Dispatches (actions) |
| ----------------------- | ----------------------------------------------------------------------- | -------------------- |
| `Form`                  | — (pure composition)                                                    | —                    |
| `FormBody`              | formId, submission                                                      | submitForm           |
| `FormFields`            | fields                                                                  | —                    |
| `FormBodyFooter`        | mode, cancelTo                                                          | —                    |
| `FormBodyFooterActions` | mode, formId, submission, cancelLabel, submitLabel, leafFields, isDirty | —                    |
| leaf fields             | fieldValue, fieldError, mode (via `useFormField`)                       | setFieldValue        |

`FormBodyFooterActions` derives `isSubmitting` itself: the fetcher is keyed by
`formId` (`useFetcher({ key: formId })` in both `FormBody` and the action row
observes the same fetcher instance), and the navigation flavour matches the
hidden `formId` input against `navigation.formData`.

## Submission Flow

```mermaid
graph TD
  A["User clicks Save"] --> B["RR7 Form's internal submitHandler calls our onSubmit first"]
  B --> C["handleSubmit calls submitForm() — leafFields read from the meta store snapshot"]
  C --> D{"mode === 'edit' and not dirty?"}
  D -->|"yes"| E["return false → event.preventDefault() → no request sent, DB untouched"]
  D -->|"no"| F["validateFields → fieldsStore.set({ errors })"]
  F --> G{"any errors?"}
  G -->|"yes"| E
  G -->|"no"| H["return true → RR7 proceeds: real fetch to the action"]
```

`noValidate` is set on the `<form>` element deliberately: leaf inputs still
carry native `required`/`min`/`max` attributes for accessibility, but native
HTML5 constraint validation would otherwise intercept the click before the
`submit` event — and therefore before `handleSubmit`/`preventDefault` — ever
runs, silently defeating this whole flow.

Client validation (`validateFields.util.ts`) is progressive enhancement only
— instant feedback, not authority. The consuming route's action + Zod schema
is the real gate; `serverErrors` (from `useActionData()`) flows back in via
`FormProvider`'s `serverErrors` prop and is re-synced into the store whenever
it changes identity.

## Mode Semantics

- **`create`**: normal submit, gated by client validation only.
- **`edit`**: submit button disabled and submission blocked client-side
  unless at least one field's value differs from the frozen `initialValues`
  baseline (`isFormDirty`, array-aware — a regenerated-but-unchanged array
  from `VirtualSelect` does not count as dirty). Avoids writing to the DB
  when nothing actually changed.
- **`view`**: each leaf renders read-only as **label + formatted value text**
  (`FormFieldDisplay`), not a disabled input — currency/number are locale-
  formatted, dates via the shared date formatter, booleans as Yes/No, and
  select/radio as their option label(s); empty values show an em dash. Custom
  fields keep their own `renderField` escape hatch (forced `isDisabled`). The
  footer (submit/cancel buttons) is not rendered at all. `FormField` routes to
  `FormFieldDisplay` when `mode === 'view'`.

## Cancel & Discard-Changes Flow

The footer's Cancel button is always rendered (whenever the footer itself
renders — `create`/`edit`, never `view`) and its behavior is entirely
built into `FormBody`, not left to each consumer to wire up:

```mermaid
graph TD
  A["User clicks Cancel"] --> B{"isDirty?"}
  B -->|"no"| C["goBack(cancelTo) immediately"]
  B -->|"yes"| D["Open ConfirmDialog: 'Discard changes?'"]
  D -->|"Keep Editing"| E["Close dialog, stay on the form"]
  D -->|"Discard Changes"| C
  C --> F{"history.state.idx > 0?"}
  F -->|"yes"| G["navigate(-1) — back to wherever the user actually came from"]
  F -->|"no"| H["navigate(cancelTo) — e.g. a bookmarked/pasted URL with no in-app history"]
```

- **`cancelTo`** (required prop) is the fallback route — conventionally the
  entity's list route (`/cqms/projects`), but a consumer scoped to one
  parent entity can point narrower (`trigger-scan` cancels to that
  project's detail page, not the top-level project list).
- **`useBackNavigate`** (`packages/ui/src/hooks/`) owns the "was there a
  real in-app previous page" decision via `history.state.idx` — react-
  router's own browser-history position marker — so Cancel doesn't
  strand the user on an external referrer or a blank tab. Generic, reused
  anywhere a "Back" affordance needs the same judgment call, not
  Form-specific.
- **`ConfirmDialog`** (`packages/ui/src/components/ConfirmDialog/`) is a
  plain, Form-agnostic yes/no prompt built on `Modal` — the "would lose
  changes" gate reuses the exact same `isDirty` the submit button already
  computes, so "don't bother the API with no changes" (submit-disabled)
  and "don't silently lose changes on cancel" (confirm-gated) are two
  faces of the same dirty check.

## Registry Dispatch, Not a Switch

`FormField.constants.ts`'s `fieldRegistry` maps `field.type` → component.
Adding a new leaf type is a new registry entry, not a growing conditional.
Each leaf component is generic over its own `TValues`; erased to a loose
`AnyFieldComponent` shape at the registry boundary and narrowed back inside
each leaf via its own concrete field-def type — the one intentional `any`
in this component, confined to that single boundary.

## Breaking the FormFieldsList ↔ Group/Row/Tabs Cycle

`FormFields` is the store-connected root (zero props — reads the definitions
via `useGetFormFields`); the recursive walking lives in the private
`FormFieldsList` delegate. `FormFieldsList` dispatches to
`FormFieldGroup`/`FormFieldRow`/`FormFieldTabs`, and each of those recurses
back into `FormFieldsList` to render its own nested `fields` array
(`group.fields`, each `row` cell, each `tab`'s `fields`) — genuine mutual
recursion inherent to the group/row/tab/leaf tree shape, not a mistake. A
direct import in both directions is a real circular dependency, though, so
the recursive capability is threaded through
`FormFields/contexts/FormFieldsRendererContext/` instead: `FormFieldsList`
provides itself (`(nested) => <FormFieldsList fields={nested} />`) as the
context value, and `FormFieldGroup`/`FormFieldRow`/`FormFieldTabs` consume
it via `useFormFieldsRendererContext()` rather than importing
`FormFieldsList.component.tsx`. Same erase-at-the-boundary technique as
`AnyFieldComponent` above (`RenderFieldsFn` erases `TValues` to
`Record<string, unknown>`, narrowed back with a cast at each call site).
Unit tests for the three subcomponents provide the context manually
(`<FormFieldsRendererContext value={(nested) => <FormFieldsList fields={nested} />}>`)
since they render each subcomponent in isolation rather than through the
full tree.

## Native Form Participation

Native `<input>`/`<textarea>`/radio inputs participate in `FormData`
automatically via `name`. Two components need explicit handling:

- **`VirtualSelect`** renders no native form control at all — `SelectField`
  mirrors the current selection into hidden `<input type="hidden">`
  elements so RR7's `Form`/`fetcher.Form` still submits real `FormData`.
- **Native checkboxes** are omitted from `FormData` entirely when unchecked
  (standard HTML behavior, not a bug here) — the consuming action's Zod
  schema must treat an absent boolean field as `false`.

## Consumer Map

CQMS's `new-project` and `trigger-scan` route actions (Implementation Plan
step 8) are the first real consumers, both using `mode: 'create'`;
`edit-project` uses `mode: 'edit'`. The former `path` field type (server
filesystem browsing via `browseDirectory.loader`) was removed by ADR-028 —
project code now arrives as synced snapshots, and no Form field touches
the platform's filesystem.
