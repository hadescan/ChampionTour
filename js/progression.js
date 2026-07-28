window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Progression = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;
  const ProducerProgression = window.ChampionTour.ProducerProgression;
  const STORAGE_KEY = 'championTour.prototype.progression.v1';
  const producer = {
    level: 1,
    xp: 0,
    rewardedLevels: []
  };
  const economy = { coins: 0, gems: 0, eventPoints: 0 };
  let orders = [];
  let pendingSpecialOrders = [];
  let loadedExistingOrders = false;
  const recentPrimaryChains = [];

  function normalizeProducerProgress() {
    producer.level = Math.max(1, Math.min(DATA.producer.maxLevel, producer.level));
    producer.xp = Math.max(0, Math.floor(producer.xp));
    while (producer.level < DATA.producer.maxLevel) {
      const requiredXp = DATA.producer.levels[producer.level].xpToNext;
      if (producer.xp < requiredXp) break;
      producer.xp -= requiredXp;
      producer.level += 1;
    }
    if (producer.level === DATA.producer.maxLevel) producer.xp = 0;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;
      if (saved.producer) {
        producer.level = Math.max(
          1,
          Math.min(DATA.producer.maxLevel, Math.floor(Number(saved.producer.level) || 1))
        );
        producer.xp = Math.max(0, Math.floor(Number(saved.producer.xp) || 0));
        producer.rewardedLevels = Array.isArray(saved.producer.rewardedLevels)
          ? saved.producer.rewardedLevels.map(Number)
          : [];
      }
      Object.keys(economy).forEach((key) => {
        economy[key] = Math.max(0, Math.floor(Number(saved.economy?.[key]) || 0));
      });
      if (Array.isArray(saved.orders) && saved.orders.length > 0) {
        orders = saved.orders
          .slice(0, DATA.orders.slotCount)
          .map(normalizeOrder);
        loadedExistingOrders = true;
      }
      pendingSpecialOrders = Array.isArray(saved.pendingSpecialOrders)
        ? saved.pendingSpecialOrders.map(normalizeOrder).filter((order) => order.special)
        : [];
      normalizeProducerProgress();
    } catch (error) {
      console.warn('Progression kaydı okunamadı.', error);
    }
    tick(Date.now());
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        producer,
        economy,
        orders,
        pendingSpecialOrders
      }));
      return true;
    } catch (error) {
      console.warn('Progression kaydı yazılamadı.', error);
      return false;
    }
  }

  function adjustEconomy(delta = {}) {
    const previous = { ...economy };
    const next = { ...economy };
    for (const key of Object.keys(economy)) {
      const change = Math.trunc(Number(delta[key]) || 0);
      next[key] = economy[key] + change;
      if (next[key] < 0) return null;
    }
    Object.assign(economy, next);
    if (save()) return { ...economy, xp: producer.xp };
    Object.assign(economy, previous);
    return null;
  }

  function applyProducerXp(amount) {
    const levelUps = [];
    let remainingXp = Math.max(0, Math.floor(Number(amount) || 0));
    while (remainingXp > 0 && producer.level < DATA.producer.maxLevel) {
      const requiredXp = DATA.producer.levels[producer.level].xpToNext;
      const acceptedXp = Math.min(remainingXp, requiredXp - producer.xp);
      producer.xp += acceptedXp;
      remainingXp -= acceptedXp;
      if (producer.xp < requiredXp) continue;
      producer.xp = 0;
      producer.level += 1;
      const reward = DATA.producer.levels[producer.level].diamondReward;
      const rewarded = producer.rewardedLevels.includes(producer.level);
      if (!rewarded) {
        producer.rewardedLevels.push(producer.level);
        economy.gems += reward;
      }
      levelUps.push({
        level: producer.level,
        diamondReward: rewarded ? 0 : reward
      });
    }
    if (producer.level === DATA.producer.maxLevel) producer.xp = 0;
    return levelUps;
  }

  function addProducerXp(amount) {
    const levelUps = applyProducerXp(amount);
    save();
    return {
      awardedXp: Math.max(0, Math.floor(Number(amount) || 0)),
      levelUps,
      state: getProducerState()
    };
  }

  function normalizeOrder(order) {
    const rawItems = (
      Array.isArray(order?.items) && order.items.length
        ? order.items
        : [{
            chainId: order?.chainId || 'footballs',
            level: order?.level,
            quantity: order?.quantity
          }]
    ).slice(0, 2);
    const quantityByItem = new Map();
    rawItems.forEach((item) => {
      const chainId = DATA.chains[item?.chainId] ? item.chainId : 'footballs';
      const level = Math.max(1, Math.min(DATA.maxItemLevel, Number(item?.level) || 1));
      const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      const key = `${chainId}:${level}`;
      const current = quantityByItem.get(key);
      quantityByItem.set(key, {
        chainId,
        level,
        quantity: (current?.quantity || 0) + quantity
      });
    });
    const items = Array.from(quantityByItem.values());
    const difficulty = DATA.orders.difficultyPattern.includes(order?.difficulty)
      ? order.difficulty
      : 'variable';
    const rewards = items.reduce((total, item) => {
      const reward = DATA.orders.rewards[item.level];
      total.coins += reward.coins * item.quantity;
      total.xp += reward.xp * item.quantity;
      total.gems += reward.gems * item.quantity;
      total.eventPoints += reward.eventPoints * item.quantity;
      return total;
    }, { coins: 0, xp: 0, gems: 0, eventPoints: 0, reputation: 0 });
    const reputationRange = DATA.orders.reputationRewards[difficulty];
    rewards.reputation = Math.max(
      reputationRange[0],
      Math.min(
        reputationRange[1],
        Math.floor(Number(order?.rewards?.reputation) || (
          reputationRange[0] + Math.random() * (reputationRange[1] - reputationRange[0] + 1)
        ))
      )
    );
    const primary = items[0];
    const special = Boolean(order?.special);
    const chainMaxLevel = window.ChampionTour.ProductionRules.maxLevelForChain(
      primary.chainId
    ) || DATA.maxItemLevel;
    const specialMaxLevel = special
      ? Math.max(1, Math.min(chainMaxLevel, Number(order?.specialMaxLevel) || primary.level))
      : null;
    const specialRequiredCount = special
      ? Math.max(1, Math.floor(
        Number(order?.specialRequiredCount) || DATA.specialOrders.maxItemRequiredCount
      ))
      : null;
    if (special) {
      primary.level = specialMaxLevel;
      primary.quantity = specialRequiredCount;
    }
    if (special) rewards.gems = DATA.specialOrders.diamondReward;
    return {
      chainId: primary.chainId,
      level: primary.level,
      quantity: primary.quantity,
      items,
      customerId: ['coach', 'captain', 'scout'].includes(order?.customerId)
        ? order.customerId
        : null,
      special,
      specialChainId: special ? primary.chainId : null,
      specialMaxLevel,
      specialRequiredCount,
      difficulty,
      rewards
    };
  }

  function accessibleMaxItemLevel(chainId = 'footballs') {
    const producerId = DATA.chains[chainId]?.producerId || 'ball_basket';
    return ProducerProgression.getProducerState(producerId).normalOrderMaxLevel;
  }

  function rollOrderLevel(maxLevel = accessibleMaxItemLevel()) {
    const totalWeight = DATA.orders.levelWeights
      .slice(1, maxLevel + 1)
      .reduce((sum, weight) => sum + weight, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (let level = 1; level <= maxLevel; level += 1) {
      cumulative += DATA.orders.levelWeights[level];
      if (roll <= cumulative) return level;
    }
    return maxLevel;
  }

  function activeChainIds() {
    return Object.values(DATA.chains)
      .filter((chain) => (
        chain.unlockLevel <= producer.level &&
        DATA.producers[chain.producerId]?.unlockLevel <= producer.level
      ))
      .map((chain) => chain.id);
  }

  function selectBalancedChain(excludedChainIds = []) {
    const available = activeChainIds().filter(
      (chainId) => !excludedChainIds.includes(chainId)
    );
    const candidates = available.length ? available : activeChainIds();
    const activeCounts = new Map(candidates.map((chainId) => [chainId, 0]));
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (activeCounts.has(item.chainId)) {
          activeCounts.set(item.chainId, activeCounts.get(item.chainId) + 1);
        }
      });
    });
    recentPrimaryChains.forEach((chainId, index) => {
      if (activeCounts.has(chainId)) {
        activeCounts.set(chainId, activeCounts.get(chainId) + 3 - index);
      }
    });
    const minimum = Math.min(...activeCounts.values());
    const leastRepresented = candidates.filter(
      (chainId) => activeCounts.get(chainId) === minimum
    );
    return leastRepresented[Math.floor(Math.random() * leastRepresented.length)];
  }

  function createOrder(forcedItemCount = 0, preferredPrimaryChain = null, difficulty = 'variable') {
    const itemCount = forcedItemCount > 0
      ? Math.max(1, Math.min(2, forcedItemCount))
      : producer.level >= 2 && Math.random() < .5 ? 2 : 1;
    const items = [];
    while (items.length < itemCount) {
      const shouldMixChains = items.length > 0 && Math.random() < .55;
      const chainId = items.length === 0 && activeChainIds().includes(preferredPrimaryChain)
        ? preferredPrimaryChain
        : selectBalancedChain(
          shouldMixChains ? [items[0].chainId] : []
        );
      const chain = DATA.chains[chainId];
      const maxLevel = Math.min(
        accessibleMaxItemLevel(chainId),
        Math.max(...chain.orderEligibleLevels)
      );
      const difficultyCap = {
        easy: Math.min(3, maxLevel),
        medium: Math.min(5, maxLevel),
        hard: maxLevel,
        variable: maxLevel
      }[difficulty] || maxLevel;
      const candidate = {
        chainId,
        level: rollOrderLevel(difficultyCap),
        quantity: 1
      };
      if (!items.some(
        (item) => item.chainId === candidate.chainId && item.level === candidate.level
      )) {
        items.push(candidate);
      }
    }
    recentPrimaryChains.unshift(items[0].chainId);
    recentPrimaryChains.splice(3);
    return normalizeOrder({ items, difficulty });
  }

  function ensureOrders() {
    const chainIds = activeChainIds();
    orders = orders.map((order, index) => normalizeOrder({
      ...order,
      difficulty: DATA.orders.difficultyPattern[index]
    }));
    while (orders.length < DATA.orders.slotCount) {
      const preferredChain = !loadedExistingOrders
        ? chainIds[orders.length % chainIds.length]
        : null;
      orders.push(createOrder(
        0,
        preferredChain,
        DATA.orders.difficultyPattern[orders.length]
      ));
    }
    if (
      producer.level >= 2 &&
      orders.length > 1 &&
      !orders.some((order) => order.items.length > 1)
    ) {
      orders[1] = createOrder(2, chainIds[1 % chainIds.length], 'easy');
    }
    save();
  }

  function queueMaxItemSpecialOrder(chainId, requestedMaxLevel) {
    if (!DATA.chains[chainId]) return false;
    const chainMaxLevel = window.ChampionTour.ProductionRules.maxLevelForChain(chainId);
    const maxLevel = Math.max(
      1,
      Math.min(chainMaxLevel, Number(requestedMaxLevel) || chainMaxLevel)
    );
    const exists = [...orders, ...pendingSpecialOrders].some(
      (order) => order.special && order.specialChainId === chainId
    );
    if (exists) return false;
    const special = normalizeOrder({
      special: true,
      customerId: 'scout',
      specialMaxLevel: maxLevel,
      specialRequiredCount: DATA.specialOrders.maxItemRequiredCount,
      items: [{
        chainId,
        level: maxLevel,
        quantity: DATA.specialOrders.maxItemRequiredCount
      }]
    });
    if (orders.length < DATA.orders.slotCount) orders.push(special);
    else pendingSpecialOrders.push(special);
    save();
    return true;
  }

  function tick(now) {
    return false;
  }

  function canProduce(producerId = 'ball_basket', now = Date.now()) {
    const state = ProducerProgression.getProducerState(producerId, now);
    return Boolean(state && state.charges > 0 && !state.replacementPendingContent);
  }

  function consumeCharge(producerId = 'ball_basket', now = Date.now()) {
    return ProducerProgression.consumeCharge(producerId, now);
  }

  function getProducerState(producerId = 'ball_basket', now = Date.now()) {
    const definition = DATA.producers[producerId] || DATA.producers.ball_basket;
    const progressionState = ProducerProgression.getProducerState(definition.id, now);
    const levelData = DATA.producer.levels[producer.level];
    return {
      id: definition.id,
      name: definition.name,
      chainId: definition.chainId,
      symbol: definition.symbol || null,
      charges: progressionState.charges,
      maxCharges: progressionState.capacity,
      cooldownEndsAt: progressionState.refillRemainingMs
        ? now + progressionState.refillRemainingMs
        : null,
      cooldownRemainingMs: progressionState.refillRemainingMs,
      level: progressionState.level,
      xp: producer.xp,
      xpToNext: levelData.xpToNext,
      isMaxLevel: producer.level === DATA.producer.maxLevel,
      artwork: progressionState.artwork || definition.artwork || levelData.artwork,
      normalOrderMaxLevel: progressionState.normalOrderMaxLevel,
      replacementPendingContent: progressionState.replacementPendingContent
    };
  }

  function getOrders() {
    ensureOrders();
    return orders.map((order) => ({
      chainId: order.chainId,
      level: order.level,
      quantity: order.quantity,
      items: order.items.map((item) => ({ ...item })),
      customerId: order.customerId,
      special: order.special,
      specialChainId: order.specialChainId,
      specialMaxLevel: order.specialMaxLevel,
      specialRequiredCount: order.specialRequiredCount,
      difficulty: order.difficulty,
      rewards: { ...order.rewards }
    }));
  }

  function fulfillOrder(slotIndex, deliveredItems) {
    ensureOrders();
    const order = orders[slotIndex];
    if (!order) return null;
    const delivered = Array.isArray(deliveredItems) ? deliveredItems : [deliveredItems];
    const counts = delivered.reduce((map, raw) => {
      const item = typeof raw === 'object'
        ? raw
        : { chainId: 'footballs', level: Number(raw) };
      const key = `${item.chainId}:${Number(item.level)}`;
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());
    const requirementsMet = order.items.every(
      (item) => (counts.get(`${item.chainId}:${item.level}`) || 0) >= item.quantity
    );
    const expectedCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (!requirementsMet || delivered.length !== expectedCount) return null;

    economy.coins += order.rewards.coins;
    economy.gems += order.rewards.gems;
    economy.eventPoints += order.rewards.eventPoints;
    const reputationProgress = ProducerProgression.addReputation(
      order.rewards.reputation
    );
    const producerProgress = applyProducerXp(order.rewards.xp);
    const completed = {
      chainId: order.chainId,
      level: order.level,
      items: order.items.map((item) => ({ ...item })),
      rewards: { ...order.rewards },
      producerProgress,
      reputationProgress
    };
    orders[slotIndex] = createOrder(
      0,
      null,
      DATA.orders.difficultyPattern[slotIndex]
    );
    save();
    return completed;
  }

  function getEconomy() {
    return { ...economy, xp: producer.xp };
  }

  load();
  ensureOrders();

  return {
    canProduce,
    consumeCharge,
    getProducerState,
    addProducerXp,
    getOrders,
    fulfillOrder,
    getEconomy,
    adjustEconomy,
    queueMaxItemSpecialOrder,
    tick
  };
})();
