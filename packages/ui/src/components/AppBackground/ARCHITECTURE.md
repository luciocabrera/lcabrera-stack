# AppBackground Architecture

Themed background surface: applies the active StyleX theme (dark/light), the base background color, and the radial gradient overlay behind its children. Used as the app-shell root (`AppShell`) and as the inner surface of `Modal`.

## File Structure

```
AppBackground/
├── index.ts                       → Barrel export
├── AppBackground.component.tsx    → Theme wrapper + overlay + children
├── AppBackground.types.ts         → AppBackgroundProps
└── AppBackground.stylex.ts        → base, height variants, shell/overlay styles
```

## Render Structure

```mermaid
graph TD
  AppBackground --> base["div.base + height variant + theme (dark/light)"]
  base --> shell["div.backgroundShell + overlayParent"]
  shell --> overlay["div.overlay + radial + backgroundOverlay (gradient)"]
  shell --> children["children"]
```

## Sizing Contract

| `shouldFillViewport` | Height applied  | Use case                                              |
| -------------------- | --------------- | ----------------------------------------------------- |
| `true` (default)     | `height: 100vh` | App-shell root that owns the viewport (`AppShell`)    |
| `false`              | `height: 100%`  | Embedded inside a sized ancestor (`Modal`'s `dialog`) |

The `false` variant exists because a hardcoded `100vh` inside a smaller container (e.g. a `max-height`-capped `<dialog>`) forces children taller than their parent and creates phantom scrollbars.

## Props

| Prop                 | Type        | Required | Description                                            |
| -------------------- | ----------- | -------- | ------------------------------------------------------ |
| `children`           | `ReactNode` | ✓        | Content rendered above the gradient overlay            |
| `shouldFillViewport` | `boolean`   | —        | `true` → `100vh` (default); `false` → fill parent 100% |

## Dependencies

```mermaid
graph LR
  AppBackground --> useTheme["useTheme (hook)"]
  AppBackground --> darkTheme["design-system/themes/dark.stylex"]
  AppBackground --> lightTheme["design-system/themes/light.stylex"]
  AppBackground_stylex["AppBackground.stylex"] --> base_tokens["design-system/tokens/base.stylex"]
  AppBackground_stylex --> colors["design-system/tokens/colors.stylex"]
  AppBackground_stylex --> commons["design-system/tokens/commons.stylex (overlayStyles)"]
```

## Consumers

- `AppShell` — viewport-height app root (default).
- `Modal` — inside the native `<dialog>`, with `shouldFillViewport={false}`.
