# 04_PRODUCER_SYSTEM
Version: 2.2

## Football Academy Producers

Four permanent producers exist together on the board:

1. Football Equipment Chest → Football chain
2. Water and Drink Station → Hydration chain
3. Training Equipment Shed → Training equipment chain
4. Trophy Workshop → Trophy chain

## Shared Rules

- All four producers are present when Football Academy starts.
- Every producer is clickable and consumes one Energy per production.
- Producers have no charge or cooldown gate. Production is blocked only when
  Energy is insufficient or the board has no empty cell.
- Producers may be dragged to an empty cell or swapped with any board item.
- Producers never merge and never disappear through item interactions.
- Every producer creates only level-one items from its assigned chain.
- Higher levels are created only by merging.
- Items merge only when both `chainId` and `level` are identical.
- Producer positions and all board items are persisted.

## Progression

Producer XP remains a shared Football Academy progression track earned only from
completed Orders. A producer level-up visually upgrades the producer family and
grants the documented Diamond rewards.

## Orders

Orders may request available items from every active Football producer. Order
generation must include chain identity and level, and must never treat items at
the same level from different chains as interchangeable.

## Future Academies

Each academy defines its own producer set and item chains in Sports Content.
Energy, merge, order and board-save engines remain shared.
