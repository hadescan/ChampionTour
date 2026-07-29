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
- Every producer is clickable and uses the globally selected 1, 2, 4, 8 or
  16 Energy production mode.
- Producers have no charge or cooldown gate. Production is blocked only when
  Energy is insufficient or the board has no empty cell.
- Producers may be dragged to an empty cell or swapped with any board item.
- Producers never merge and never disappear through item interactions.
- The selected Energy maps to a minimum generated level; higher Energy creates
  a higher starting level according to the production rules.
- Higher levels remain primarily merge-driven.
- Items merge only when both `chainId` and `level` are identical.
- Producer positions and all board items are persisted.
- Producers carry one consistent lightning identity badge. This badge never
  displays charge, capacity, cooldown or a numeric production count.

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
