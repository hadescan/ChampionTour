# 05_ITEM_CHAINS
Version: 2.1

## Shared Rules

- Every item has a `chainId` and level.
- Chain definitions are the central catalogue used by producers, board
  rendering, the information panel and Orders.
- Every chain declares its unlock level and order-eligible levels.
- Only identical chain and identical level may merge.
- Default chain length is level 1–6.
- Producers generate only level-one items.
- Orders may request items from every active producer chain.

## Football Academy Chains

### Ball Basket — Football Chain

1. Training Ball
2. Quality Training Ball
3. Match Ball
4. Professional Ball
5. Signed Ball
6. Championship Ball

### Water Station — Hydration Chain

The persisted `equipment` chain identifier remains unchanged for save
compatibility, while its Football Academy presentation is the Hydration Chain.

1. Water Cup
2. Water Bottle
3. Sports Bottle
4. Team Shaker
5. Thermos
6. Professional Hydration Set

### Training Cart — Training Chain

1. Training Cone
2. Cone Set
3. Training Hurdle
4. Coordination Ladder
5. Mini Goal
6. Professional Training Station

### Trophy Cabinet — Trophy Chain

1. Medal
2. Bronze Trophy
3. Silver Trophy
4. Gold Trophy
5. Championship Trophy
6. Legends Trophy

## Future Academies

Every new academy supplies its own producer and chain definitions while reusing
the shared merge, order, energy and save engines.
