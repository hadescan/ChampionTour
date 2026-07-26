# 06_ORDER_SYSTEM.md
# Champion Tour – Order System
Version: 1.0

## Purpose
The Order System is the primary progression engine of Champion Tour.
Players advance the game by fulfilling customer orders, earning resources, and upgrading the Producer.

---

# 1. Design Goals

Orders must:
- Give players a clear short-term objective.
- Drive Producer progression.
- Encourage item merging.
- Never feel unfair or impossible.

Orders are the main source of:
- Coins
- Producer XP

Diamonds are NOT standard order rewards.

---

# 2. Order Flow

1. Player opens the game.
2. Active order cards are displayed.
3. Player generates items.
4. Player merges items.
5. Requested items are delivered.
6. Rewards are granted.
7. A new order replaces the completed one.

This loop repeats continuously.

---

# 3. Active Orders

Version 1.0:

Maximum visible orders: 3

Rules:
- At least one easy order.
- One medium order.
- One difficult order (optional early game).

The player should always have something achievable.

---

# 4. Order Generation Rules

Orders are generated based on:

- Producer level
- Player progression
- Existing item chains

Orders must never request an item that the current Producer cannot realistically produce.

---

# 5. Difficulty Scaling

Early Game:
Lv1–Lv2 items

Mid Game:
Lv2–Lv4 items

Late Football Academy:
Lv4–Lv6 items

Difficulty increases gradually.

---

# 6. Rewards

Every completed order grants:

- Coins
- Producer XP

Higher-level items increase rewards.

Example:

Easy Order
Small Coin reward
Low XP

Medium Order
Medium Coin reward
Medium XP

Hard Order
Large Coin reward
High XP

Exact balancing will be defined in Game Economy.

---

# 7. Producer XP

Orders are the ONLY source of Producer XP.

Generating items:
No XP

Merging items:
No XP

Completing orders:
Producer XP awarded

---

# 8. Order Card UI

Each order card contains:

- Requested item icon(s)
- Quantity
- Reward preview
- Deliver button (enabled only when requirements are met)

Design Rules:

- Rounded corners
- Premium appearance
- Clear hierarchy
- Easy readability

---

# 9. Deliver Sequence

Player presses Deliver.

Sequence:

1. Items disappear.
2. Reward animation.
3. Coins fly to coin counter.
4. XP is awarded.
5. Empty order slot briefly animates.
6. New order appears.

Target duration:
Less than 2 seconds.

---

# 10. Fairness Rules

The system must never:

- Require unavailable items.
- Generate impossible combinations.
- Trap the player.

The player must always have a path to complete every order.

---

# 11. Future Expansion

Future versions may introduce:

- Timed event orders
- VIP orders
- Tournament orders
- Academy renovation requests

These are excluded from Version 1.0.

---

# Codex Implementation Notes

Read:
00_PROJECT_RULES.md
01_GAME_VISION.md
02_CORE_GAMEPLAY.md
03_MERGE_SYSTEM.md
04_PRODUCER_SYSTEM.md
05_ITEM_CHAINS.md

Implement the Order System exactly as documented.
Do not invent reward systems outside these rules.
