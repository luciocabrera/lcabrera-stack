# Modal Architecture

Controlled dialog using the native `<dialog>` element with `showModal()` / `close()`, animated backdrop, header, scrollable body, and optional footer.

## File Structure

```
Modal/
├── index.ts                  → Barrel export
├── Modal.component.tsx       → Native dialog wrapper
├── Modal.types.ts            → ModalProps
├── Modal.stylex.ts           → dialog, backdrop, body, footer styles
└── Modal.test.tsx            → Tests
```

## Dependencies

```mermaid
graph LR
  Modal --> AppBackground["AppBackground (shouldFillViewport=false)"]
  Modal --> AppDotted
  Modal --> Title
  Modal --> Button
  Modal --> MenuCloseIcon
  Modal --> ICON_SIZE_MD["ICON_SIZE_MD (constant)"]
  Modal --> Modal_stylex["Modal.stylex (modalStyles)"]
  Modal_stylex --> base_tokens["design-system/tokens/base.stylex"]
  Modal_stylex --> colors["design-system/tokens/colors.stylex"]
```

## Render Structure

```mermaid
graph TD
  Modal --> dialog["&lt;dialog&gt; (ref=dialogRef)"]
  dialog --> bg["AppBackground (shouldFillViewport=false → height 100%)"]
  bg --> dotted["AppDotted (dot-pattern surface, overflowY auto)"]
  dotted --> header{"title prop?"}
  header -->|yes| Header["Title → title text + ghost close Button"]
  header -->|no| skip1["(omitted)"]
  dotted --> body["div.body → children"]
  dotted --> footer{"footer prop?"}
  footer -->|yes| Footer["div.footer → footer content"]
  footer -->|no| skip2["(omitted)"]
```

## Open / Close Flow

```mermaid
graph TD
  A["isOpen prop changes"] --> B{"isOpen === true?"}
  B -->|yes| C{"dialog.open?"}
  C -->|no| D["dialog.showModal()  ← native top-layer + backdrop"]
  C -->|yes| E["(already open, no-op)"]
  B -->|no| F{"dialog.open?"}
  F -->|yes| G["dialog.close()"]
  F -->|no| H["(already closed, no-op)"]

  NativeClose["native close event (Esc key or dialog.close())"] --> onClose["onClose() callback"]
```

Two separate `useEffect`s are used:

1. **Open/close effect** — syncs `isOpen` prop to `dialog.showModal()` / `dialog.close()`.
2. **Close-event effect** — listens for the native `close` event (fired on Esc key press) and calls `onClose()` to keep the parent in sync.

## Layout Sections

| Section | Condition        | Styles                             | Contents                        |
| ------- | ---------------- | ---------------------------------- | ------------------------------- |
| Header  | `title` present  | `Title` component                  | title text + ghost close Button |
| Body    | always           | `padding.lg`, `overflowY: auto`    | `children`                      |
| Footer  | `footer` present | `padding.lg`, border-top, flex-end | `footer` slot (ReactNode)       |

## Sizing

| Constraint  | Value              |
| ----------- | ------------------ |
| `width`     | `min(90vw, 520px)` |
| `maxHeight` | `min(85vh, 600px)` |

The dialog **hugs its content** vertically — `maxHeight` is a cap, not a fixed height. `AppBackground` inside the dialog must keep `shouldFillViewport={false}`: its default `100vh` height would make the children taller than the dialog and produce a phantom scrollbar (see `AppBackground/ARCHITECTURE.md` → Sizing Contract).

The interior is a flex column (via `AppDotted`): the body has `flex: 1 1 auto` + `minHeight: 0`, so it absorbs any spare height (pushing the footer to the bottom edge) and scrolls internally when content exceeds the cap, while the header and footer (`flexShrink: 0`) stay pinned. To get a constant-size modal instead of content-hugging, change the dialog's `maxHeight` to `height` — the body/footer distribution handles both cases.

## Props

| Prop       | Type         | Required | Description                                           |
| ---------- | ------------ | -------- | ----------------------------------------------------- |
| `children` | `ReactNode`  | ✓        | Scrollable body content                               |
| `isOpen`   | `boolean`    | ✓        | Controls `showModal()` / `close()`                    |
| `onClose`  | `() => void` | ✓        | Called when close button clicked or Esc pressed       |
| `title`    | `string`     | —        | Renders the header section with title + close button  |
| `footer`   | `ReactNode`  | —        | Renders the footer section (typically action buttons) |

## Accessibility

| Feature        | Implementation                                             |
| -------------- | ---------------------------------------------------------- |
| Focus trap     | Native `<dialog>` `showModal()` traps focus automatically  |
| Esc key        | Native `<dialog>` fires `close` event → `onClose()` called |
| Backdrop click | Not natively handled — add `onClick` on backdrop if needed |
| `aria-label`   | Close button has `aria-label='Close'`                      |

## Usage Pattern

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title='Confirm Action'
  footer={
    <>
      <Button variant='outline' onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant='primary' onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Are you sure?</p>
</Modal>
```
