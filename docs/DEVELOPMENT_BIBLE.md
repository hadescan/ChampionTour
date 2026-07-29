# Champion Tour Development Bible v1.0

## Locked Gameplay Visual Reference

For gameplay-screen visual work,
`CT-Cozy-Academy-Master-Gameplay-Reference.png` is the mandatory acceptance
reference for layout, proportion, density and Cozy Academy Storybook art
language. Explicit user-approved exceptions take priority; the current Order
presentation exception uses large transparent, boxless customer compositions.

The active gameplay theme must remain a single production CSS authority.
Legacy pixel-art and temporary stacked override layers must not be loaded.

Producers are unlimited and have no charge or cooldown. Their shared lightning
badge communicates production identity only. The circular Energy control cycles
1 → 2 → 4 → 8 → 16 and is visible only for a selected producer.

## Core Rules
- One Sprint = One Feature.
- Never refactor unless explicitly requested.
- Preserve project architecture.
- Game Feel is more important than visual effects.
- All animations must be short (100-300ms), smooth and premium.
- Use transform/opacity/filter instead of layout changes whenever possible.

## Art
- Premium Casual
- Pastel colors
- Soft shadows
- Rounded UI
- No photorealism
- No flat UI

## Board
- 7 columns x 9 rows
- Do not change unless requested.

## Producer
- Producer is alive.
- Press animation required.
- New item MUST appear inside the producer first.
- Then fly to destination slot.
- Never spawn directly inside the destination slot.

## Merge
- Items move together.
- Old items disappear.
- New item pops.
- Glow + small particles.
- Merge must feel rewarding.

## Drag
- Scale up slightly.
- Bigger shadow.
- Highest z-index.
- Smooth drop.

## Performance
- Target 60 FPS.
- Prefer CSS transform.
