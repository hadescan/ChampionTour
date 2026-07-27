# 02_CORE_GAMEPLAY.md

# Champion Tour – Core Gameplay
Version 1.0

## Purpose
This document defines the player's complete gameplay loop from launching the game until ending a play session.

---

# Core Loop

Open Game
↓
Collect Energy
↓
Use Producer
↓
Generate Items
↓
Merge Items
↓
Create Higher Level Items
↓
Complete Orders
↓
Earn Coins + Producer XP
↓
Upgrade Producer
↓
Receive Diamond Reward
↓
Renovate Football Academy
↓
Repeat

---

# Session Flow

A normal play session should last between 3 and 10 minutes.

Every session must provide at least one visible achievement:
- Finish an order
- Discover a new item
- Upgrade producer
- Progress academy renovation

The player should never leave without feeling progress.

---

# Merge Board Rules

- Fixed grid layout.
- Four active Football Academy producers.
- Drag & drop merge.
- Double-click merge.
- No accidental merges.
- Empty tiles remain available for strategy.

---

# Producer Interaction

The active academy's producers are the heart of gameplay.

Player actions:
1. Choose and tap a producer.
2. Receive an item.
3. Place item on board.
4. Merge with identical items.
5. Continue until requested items are produced.

Producer upgrades unlock better progression, not a new producer object.

---

# Orders

Orders request merged items.

Rewards:
- Coins
- Producer XP

Orders do NOT directly give diamonds.

---

# Producer Progression

Producer XP is earned only from completed orders.

Level Up:
Lv1→Lv2→Lv3→Lv4→Lv5→Lv6

Each level:
- Changes appearance.
- Unlocks stronger progression.
- Awards diamonds according to Project Rules.

---

# Academy Progression

Producer Lv6 unlocks Football Academy renovation.

Renovation is completed through a sequence of visual upgrades.

Renovation completion becomes the major objective before introducing the next sport.

---

# Economy Principles

Coins:
General progression currency.

Diamonds:
Premium progression reward.

Energy:
Limits producer usage after balancing.
During prototype development, energy restrictions may be disabled.

---

# UX Principles

Gameplay should feel:
- Fast
- Smooth
- Responsive
- Relaxing

Players should spend time making decisions, not waiting for UI.

---

# Forbidden Design Decisions

- No forced advertisements.
- No fake waiting timers.
- No unnecessary confirmation dialogs.
- No random punishment mechanics.
- No visual clutter.
