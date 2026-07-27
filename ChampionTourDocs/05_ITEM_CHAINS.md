# 05_ITEM_CHAINS
Version: 2.0

## Shared Rules

- Every item has a `chainId` and level.
- Only identical chain and identical level may merge.
- Default chain length is level 1–6.
- Producers generate only level-one items.
- Orders may request items from every active producer chain.

## Football Academy Chains

### Ball Basket — Football Chain

1. Football
2. Training Ball
3. Match Ball
4. Professional Ball
5. Signed Ball
6. Collectible Ball

### Equipment Locker — Equipment Chain

1. Shirt
2. Football Boots
3. Shin Guards
4. Goalkeeper Gloves
5. Professional Shirt
6. Elite Equipment Set

### Training Cart — Training Chain

1. Cone
2. Training Hurdle
3. Mini Goal
4. Full Goal
5. Shooting Target
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
the shared merge, order, energy, cooldown and save engines.
