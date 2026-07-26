# 04_PRODUCER_SYSTEM.md
# Champion Tour – Producer System
Version: 1.0

## Purpose
This document defines the complete Producer system. The Producer is the core progression mechanic of Champion Tour and must follow these rules in every implementation.

---

# 1. Definition

A Producer is an object that generates merge items.

During the Football Academy there is only ONE active Producer.

The Producer evolves over time instead of creating additional producers.

---

# 2. Producer Lifecycle

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

Rules:

- Only one Producer exists.
- Upgrading replaces the current Producer.
- The previous visual is permanently removed.
- The Producer keeps the same board position.
- Progress is never lost.

---

# 3. Producer XP

Producer XP is earned ONLY by completing Orders.

Items generated:
❌ No XP

Merging:
❌ No XP

Order completed:
✅ Producer XP

This ensures that progression is driven by gameplay rather than repetitive tapping.

---

# 4. Producer Appearance

Lv1
Old football equipment bag.

Lv2
Cleaner bag with new details.

Lv3
Professional sports bag.

Lv4
Academy equipment cart.

Lv5
Premium academy equipment station.

Lv6
Elite football academy producer.

Every level should visually communicate improvement.

---

# 5. Rewards

Level Up Rewards

Lv2 → +1 Diamond
Lv3 → +1 Diamond
Lv4 → +2 Diamonds
Lv5 → +2 Diamonds
Lv6 → +3 Diamonds

Coins are earned through Orders, not Producer upgrades.

---

# 6. Level Up Sequence

1. Required Producer XP reached.
2. Level Up animation.
3. Old Producer disappears.
4. New Producer appears.
5. Diamond reward animation.
6. Gameplay resumes immediately.

Target duration:
2–3 seconds.

---

# 7. Football Academy Integration

Reaching Producer Lv6 unlocks:

Football Academy Renovation Event.

This is NOT optional.

The renovation becomes the player's primary objective.

---

# 8. Renovation Trigger

Producer Lv6
↓

Academy Renovation Begins
↓

Multiple renovation stages
↓

Football Academy Completed
↓

Future Sports Academy becomes available.

---

# 9. UI Rules

Producer should display:

- Premium artwork
- Subtle idle animation
- Selection feedback
- Cooldown indicator (when enabled)

During prototype mode:
- Hide debug counters such as 6/8.
- Hide developer information.

---

# 10. Balancing Principles

Producer upgrades should feel meaningful.

Each level should provide:
- Better visual quality
- Stronger sense of progression
- New player motivation

Never upgrade solely by increasing numbers.

---

# 11. Future Expansion

Future academies (Basketball, Swimming, etc.) will reuse the same Producer framework.

Only artwork, item chains and renovation themes change.

Core Producer rules never change.

---

# Codex Implementation Notes

Read:
00_PROJECT_RULES.md
01_GAME_VISION.md
02_CORE_GAMEPLAY.md
03_MERGE_SYSTEM.md

Implement the Producer system exactly as documented.

Do not introduce multiple simultaneous Producers unless a future design document explicitly allows it.
