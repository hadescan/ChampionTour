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

### Equipment Locker — Equipment Chain

1. Football Socks
2. Football Boots
3. Shin Guards
4. Shirt
5. Goalkeeper Gloves
6. Professional Equipment Set

### Training Cart — Training Chain

1. Cone
2. Training Hurdle
3. Mini Goal
4. Coordination Ladder
5. Shooting Target
6. Professional Training Station

### Trophy Cabinet — Trophy Chain

1. Medal
2. Small Trophy
3. Bronze Trophy
4. Silver Trophy
5. Gold Trophy
6. Championship Trophy

## Future Academies

Every new academy supplies its own producer and chain definitions while reusing
the shared merge, order, energy and save engines.
