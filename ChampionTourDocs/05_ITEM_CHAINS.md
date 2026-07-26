# 05_ITEM_CHAINS.md
# Champion Tour – Item Chains
Version: 1.0

## Purpose
This document defines every merge chain used in Champion Tour. Every item belongs to exactly one chain.

---

# Design Principles

- Each chain has a clear visual evolution.
- Every level should look more valuable than the previous.
- Players should instantly recognize the next upgrade.

Default chain length:
Lv1 → Lv6

Future updates may extend special chains.

---

# Football Academy Chains

## Chain A – Footballs

Lv1 - Deflated Football
Lv2 - Training Football
Lv3 - Match Football
Lv4 - Professional Match Ball
Lv5 - Championship Ball
Lv6 - Elite Tournament Ball

Purpose:
Core order chain used throughout the Football Academy.

---

## Chain B – Football Boots

Lv1 - Old Boots
Lv2 - Basic Boots
Lv3 - Training Boots
Lv4 - Professional Boots
Lv5 - Elite Boots
Lv6 - Golden Match Boots

Purpose:
Higher-value order chain.

---

## Chain C – Referee Equipment

Lv1 - Whistle
Lv2 - Yellow Card
Lv3 - Red Card
Lv4 - Referee Notebook
Lv5 - Referee Kit
Lv6 - Professional Referee Set

Purpose:
Support chain with medium rewards.

---

## Chain D – Training Equipment

Lv1 - Cone
Lv2 - Marker Disc
Lv3 - Agility Ladder
Lv4 - Training Pole
Lv5 - Mini Goal
Lv6 - Complete Training Kit

Purpose:
Academy progression chain.

---

# Merge Formula

Two identical items create one item of the next level.

2 × LvN → 1 × LvN+1

No exceptions in Version 1.0.

---

# Producer Output

The Football Producer generates only Lv1 items.

Higher-level items must always be obtained through merging.

The producer never generates Lv2+ items.

---

# Orders

Orders may request:

- Any level within a chain
- Multiple chains simultaneously

High-level orders reward more Coins and Producer XP.

Diamonds are never direct order rewards.

---

# Visual Consistency

Within the same chain:

- Shape should evolve naturally.
- Color quality should improve.
- Materials should become more premium.
- Silhouette must remain recognizable.

---

# Naming Rules

Item names should be:

- Short
- Easy to translate
- Sports themed
- Consistent across all languages

---

# Future Expansion

Additional academies (Basketball, Swimming, etc.) will each introduce their own independent item chains while following the same merge rules.

---

# Codex Notes

Read:
00_PROJECT_RULES.md
01_GAME_VISION.md
02_CORE_GAMEPLAY.md
03_MERGE_SYSTEM.md
04_PRODUCER_SYSTEM.md

Never invent new chains unless they are documented.
