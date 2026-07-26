# 03_MERGE_SYSTEM.md
# Champion Tour – Merge System
Version: 1.0

## Purpose
This document defines every rule related to merging items. These rules are the single source of truth for the merge mechanic.

---

# 1. Design Goals

The merge system must be:

- Easy to understand
- Highly satisfying
- Fast and responsive
- Visually rewarding
- Free of accidental actions

The player should always feel that every merge creates meaningful progress.

---

# 2. Merge Rules

- Only identical items can merge.
- Two identical items create one higher-level item.
- Different items can never merge.
- Locked items cannot merge.
- Items inside storage cannot merge.

Formula:

2 × LvN = 1 × LvN+1

---

# 3. Merge Methods

Supported input methods:

- Drag one item onto another.
- Double-click one item when an identical partner exists.

Both methods must produce exactly the same result.

---

# 4. Merge Animation

Sequence:

1. Selected item highlights.
2. Items move together.
3. Small impact effect.
4. Pop animation.
5. New item appears.
6. Brief glow.
7. Ready for interaction immediately.

Target duration:
150–250 ms

---

# 5. Visual Rules

Do:
- Pop animation
- Small particles
- Brief glow
- Smooth scaling

Do NOT:
- Show congratulation text (e.g. "Harika!")
- Freeze gameplay
- Block user input unnecessarily

---

# 6. Board Behaviour

After merging:

- Old items disappear.
- New item occupies the destination tile.
- Empty tile becomes available immediately.
- Selection transfers to the new item.

---

# 7. Item Levels

Every chain has six normal levels by default.

Example:

Lv1
↓

Lv2
↓

Lv3
↓

Lv4
↓

Lv5
↓

Lv6

Some special chains may extend beyond Lv6 in future updates.

---

# 8. Item Information Panel

Selecting an item updates the information panel.

The panel must display:

- Large item icon
- Item name
- Item description
- Current level

Clicking empty space clears the selection while keeping the panel visible.

---

# 9. Performance Rules

Merging must feel instant.

Requirements:

- No frame drops
- No long pauses
- Animation never blocks dragging
- New item is immediately draggable

---

# 10. Future Expansion

Future versions may support:

- Rare items
- Golden items
- Event-only chains
- Temporary merge bonuses

These systems are intentionally excluded from Version 1.0.

---

# Codex Implementation Rules

Before modifying merge code:

- Read 00_PROJECT_RULES.md
- Read 01_GAME_VISION.md
- Read 02_CORE_GAMEPLAY.md

Do not redesign the merge mechanic.

Only improve implementation while preserving player experience.
