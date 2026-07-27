# 04_PRODUCER_SYSTEM
Version: 2.0

## Football Academy Producers

Four permanent producers exist together on the board:

1. Ball Basket → Football chain
2. Equipment Locker → Equipment chain
3. Training Cart → Training equipment chain
4. Trophy Cabinet → Trophy chain

## Shared Rules

- All four producers are present when Football Academy starts.
- Every producer is clickable and consumes one Energy per production.
- Every producer owns independent charges and cooldown state.
- Every producer creates only level-one items from its assigned chain.
- Higher levels are created only by merging.
- Items merge only when both `chainId` and `level` are identical.
- Producer state is persisted.

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
Energy, cooldown, merge and order engines remain shared.
