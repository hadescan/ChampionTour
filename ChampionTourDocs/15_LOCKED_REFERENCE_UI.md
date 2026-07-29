# 15_LOCKED_REFERENCE_UI
Version: 1.0

## Authority

The locked gameplay reference is:

`CT-Cozy-Academy-Master-Gameplay-Reference.png`

The repository copy is:

`assets/CozyAcademy/References/master-gameplay-reference.png`

The reference is mandatory for gameplay-screen geometry, visual density,
hierarchy and Cozy Academy Storybook art direction. The one current layout
exception is the explicitly approved boxless customer Order composition.

## Reference Measurement Table

Source reference: 828 × 1792.
Primary implementation viewport: 390 × 844.
Scale factor: 0.4710.

| Region | Reference pixels | Share | 390 × 844 target |
|---|---:|---:|---:|
| Top HUD | y 0–126 | 7.0% height | 0–59 px |
| Customer / Order field | y 126–626 | 27.9% | 59–295 px |
| Board outer frame | x 23–804 | 94.3% width | x 11–379 px |
| Board outer frame | y 626–1546 | 51.3% height | y 295–728 px |
| Board inner padding | 15–18 px | 1.9–2.2% board width | 7–9 px |
| Slot gap | 4–6 px | 0.5–0.8% board width | 2–3 px |
| Normal item footprint | 75–90% slot | — | 75–90% slot |
| Producer footprint | 105–118% slot | — | 105–118% slot |
| Bottom information panel | y 1562–1775 | 11.9% height | y 736–836 px |
| Storage control | 124 × 164 px | — | 58 × 77 px |
| Selected-item art | 126 × 164 px | — | 59 × 77 px |
| Circular Energy control | 138 × 138 px | — | 65 × 65 px |

Measurements define the target relationship between regions. The fixed 7 × 9
Champion Tour board remains authoritative, so its vertical density is fitted
within the reference board region without altering game mechanics.

## Locked UI Decisions

- HUD order: Level/XP, Energy, Coins, Diamonds.
- Academy Reputation is not a fifth competing resource capsule.
- Producers have no charge, capacity, cooldown or refill.
- Producer identity is indicated by one shared lightning badge.
- Production Energy is selected with one circular button cycling
  1 → 2 → 4 → 8 → 16 → 1.
- Normal Orders request one or two different items.
- Six normal Orders remain active in a horizontal strip.
- Customers are transparent, boxless character compositions.
- Every requested item opens a data-driven detail view.
- Three same-chain level-12 items open one Mastery Order for that chain.
- Pixel art, emoji placeholders and stacked temporary theme stylesheets are
  forbidden in the active production screen.

