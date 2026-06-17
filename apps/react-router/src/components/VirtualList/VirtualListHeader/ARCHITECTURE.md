# VirtualListHeader Architecture

Search-input header extracted from `VirtualList` to keep orchestration logic separate from input rendering.

## Responsibilities

- Render the controlled search input (`searchTerm`, `onSearchChange`)
- Render the clear button only when `searchTerm` is non-empty
- Forward all browser password-manager ignore attributes used by the previous inline implementation

## Props

| Prop             | Type                                             | Description                 |
| ---------------- | ------------------------------------------------ | --------------------------- |
| `name`           | `string \| undefined`                            | Name attribute on the input |
| `searchTerm`     | `string`                                         | Controlled input value      |
| `onSearchChange` | `(event: ChangeEvent<HTMLInputElement>) => void` | Input change callback       |
| `onClearSearch`  | `() => void`                                     | Invoked by the clear button |
