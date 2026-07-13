# Design System — Drafting Table

Approved direction: **Drafting Table**
Date: 2026-07-13

---

## Color Palette

| Token | OKLCH | Role |
|---|---|---|
| `--color-bg` | `oklch(96.8% 0.007 85)` | Page background — warm drafting paper |
| `--color-surface` | `#ffffff` | Card and modal face |
| `--color-surface-2` | `oklch(93.5% 0.009 83)` | Panel fill, column bodies |
| `--color-ink` | `oklch(22% 0.04 258)` | Primary text — deep blueprint indigo |
| `--color-ink-2` | `oklch(38% 0.035 258)` | Secondary text |
| `--color-muted` | `oklch(55% 0.022 258)` | Supporting text, placeholders |
| `--color-line` | `oklch(86.5% 0.012 258)` | Borders, dividers |
| `--color-teal` | `oklch(66% 0.155 215)` | Primary action — blueprint cyan |
| `--color-teal-dark` | `oklch(56% 0.155 215)` | Primary action hover / focus |
| `--color-coral` | `oklch(62% 0.20 20)` | Urgent priority, errors, delete |
| `--color-amber` | `oklch(74% 0.17 75)` | High priority, warnings |
| `--color-green` | `oklch(55% 0.155 158)` | Done state, success, low priority |
| `--color-blue` | `oklch(54% 0.175 255)` | Medium priority, informational |

Color strategy: **Restrained** — tinted neutrals form the base; one action
color (teal/cyan) carries interaction; four semantic colors communicate state
only; color is never decorative.

Contrast ratios (WCAG AA targets):
- Body text (`--color-ink` on `--color-bg`): ≥ 10:1 — passes AAA
- Muted text (`--color-muted` on `--color-bg`): ≥ 4.5:1 — passes AA
- White on `--color-teal` (buttons): ≥ 4.5:1 — passes AA

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | Space Grotesk | Headings, labels, navigation, body copy |
| `--font-mono` | JetBrains Mono | Dates, counters, zone numbers, metadata |

- Body: 16px, 1.5 line-height
- Labels: 0.85rem, font-bold, `--color-muted`
- Zone numbers / counters: `--font-mono`, `--color-muted`, small size
- Heading ceiling: `clamp()` max ≤ 2.5rem — no oversized hero headings

---

## Grid Pattern

Applied via `.workspace-bg` utility class only — used on:
- Kanban column bodies
- Annotation canvas stage wrapper

A 24 × 24 px crosshatch grid in `oklch(80% 0.015 258 / 0.28)` on top of
`--color-surface-2`. Not used on cards, modals, sidebars, or auth panels.

---

## Component Vocabulary

### Buttons
- `.btn-primary` — teal fill, white text. Primary CTA only.
- `.btn-ghost` — surface-2 fill, ink text, line border. Secondary action.
- `.btn-icon` — white fill, 40×40, icon-only. Tertiary / icon controls.
- `.btn-mini` — white fill, 30×30, icon-only. Inline micro-controls.

All buttons: `border-radius: 6px`. Focus: 3px solid cyan ring.

### Cards
- `.card` — white fill, 1px `--color-line` border, `border-radius: 8px`.

### Task Cards (Stage 3)
- No left-border priority stripe.
- Priority shown via small symbol badge: `◆ URGENT` (coral), `▲ HIGH`
  (amber), `● MED` (blue), `○ LOW` (green).
- Restrained corner registration mark (`+` crosshair) in one corner only.

### Board Columns (Stage 3)
- Zone header: monospace zone number above readable status name.
- Body: `.workspace-bg` (subtle grid on surface-2).
- Drop target: 2px dashed `--color-teal` border.
- Empty state: human readable — "Drop a task here".

### Forms
- Input border: 1px `--color-line`.
- Input border-radius: 6px.
- Focus ring: `box-shadow: 0 0 0 3px oklch(66% 0.155 215 / 0.18)`.

---

## 404 Identity Placement

- **Sidebar header only**: `DRW NO 404 / Project Not Found` as a compact
  title-block element.
- **Sidebar footer**: `REV 1.0.0` in small monospace muted text.
- Not repeated elsewhere in the application as error copy or decorative text.

---

## Motion

- Transitions: 130ms ease for color/border, 150ms ease for opacity.
- `@media (prefers-reduced-motion: reduce)`: all transitions and animations
  reduced to instant / no motion.
- No decorative animations.
- Drop-target, focus, and hover states use border-color / background-color
  transitions only — no layout-property animation.

---

## Anti-patterns (Do Not Use)

- Glassmorphism
- Gradient text (`background-clip: text`)
- Thick left-border priority stripes on cards
- Oversized hero headings (`> 2.5rem` max)
- Robotic UI copy (e.g. "NO_DATA_DETECTED", "INITIALIZE_SYSTEM")
- Alignment lines extending across the screen on hover
- Coordinates / measurement ticks on cards or standard UI elements
- Nested cards
- Identical card grids
- Numbered section eyebrows on every heading
- Shadows or glows used decoratively
