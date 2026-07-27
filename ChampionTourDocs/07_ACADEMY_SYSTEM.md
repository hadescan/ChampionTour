# 07_ACADEMY_SYSTEM
Version: 2.0

## Core Goal

The Merge Board is a progression tool. The player's primary long-term objective
is to restore the world's most prestigious Sports Campus.

## Sports Campus

There is one persistent Sports Campus containing sequential academies:

1. Football Academy
2. Basketball Academy
3. Baseball Academy
4. Shooting Academy
5. Swimming Academy
6. Horse Academy

Only one academy may be active at a time. The next academy remains locked until
the active academy is fully restored.

## Level Up Flow

When academy XP reaches the next level:

1. Gameplay pauses.
2. The full-screen Sports Campus opens.
3. The player enters the active academy.
4. Exactly one predefined restoration becomes available.
5. The restoration is applied and saved.
6. Gameplay resumes when no restoration is pending.

Random upgrade choices are not used.

## Football Academy

Football Academy begins as an old, incomplete facility. Its 29 restorations span
levels 2–30 and are grouped into:

- Clubhouse
- Main Stands
- Main Pitch
- Performance Centre
- Campus Infrastructure
- Completion

Every level completes one physical component. Level 30 produces a modern,
colourful, illuminated and complete Football Academy.

## Completion Flow

After the level 30 restoration:

- Football Academy changes to Completed.
- The Sports Campus opens.
- Basketball Academy changes from Locked to Available.
- Other academies remain Locked.

Basketball content must provide its own producer art, item-chain content,
restoration plan and campus appearance before it becomes playable.

## Data Architecture

Academy identity, producer definition, item-chain references and restoration
steps belong to the Sports Content data layer. Progression consumes this data
without embedding sport-specific rules.

Adding a sport requires:

1. One academy content definition.
2. One evolving producer definition.
3. Sport-specific item chains.
4. A sequential restoration plan.
5. Sport-specific presentation assets.

Merge, Order, Energy and Save rules remain shared.
