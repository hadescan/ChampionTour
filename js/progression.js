window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Progression = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;
  const STORAGE_KEY = 'championTour.prototype.progression.v1';
  const producer = {
    charges: DATA.producer.maxCharges,
    cooldownEndsAt: null,
    level: 1,
    xp: 0,
    rewardedLevels: []
  };
  const economy = {
    coins: 0,
    gems: 0,
    eventPoints: 0
  };
  let orders = [];

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;

      if (saved.producer) {
        producer.charges = Math.max(0, Math.min(
          DATA.producer.maxCharges,
          Number(saved.producer.charges) || 0
        ));
        producer.cooldownEndsAt = Number(saved.producer.cooldownEndsAt) || null;
        producer.level = Math.max(1, Math.min(
          DATA.producer.maxLevel,
          Math.floor(Number(saved.producer.level) || 1)
        ));
        producer.xp = Math.max(0, Math.floor(Number(saved.producer.xp) || 0));
        producer.rewardedLevels = Array.isArray(saved.producer.rewardedLevels)
          ? saved.producer.rewardedLevels
            .map(Number)
            .filter((level) => level >= 2 && level <= DATA.producer.maxLevel)
          : [];
      }

      Object.keys(economy).forEach((key) => {
        economy[key] = Math.max(0, Math.floor(Number(saved.economy?.[key]) || 0));
      });

      if (!Number.isFinite(Number(saved.producer?.level))) {
        applyProducerXp(Math.max(0, Math.floor(Number(saved.economy?.xp) || 0)));
      } else {
        normalizeProducerProgress();
      }

      if (Array.isArray(saved.orders) && saved.orders.length === DATA.orders.slotCount) {
        orders = saved.orders.map(normalizeOrder);
      }
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
        orders
      }));
    } catch (error) {
      console.warn('Progression kaydı yazılamadı.', error);
    }
  }

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
      const rewardAlreadyGranted = producer.rewardedLevels.includes(producer.level);
      if (!rewardAlreadyGranted) {
        producer.rewardedLevels.push(producer.level);
        economy.gems += reward;
      }
      levelUps.push({
        level: producer.level,
        diamondReward: rewardAlreadyGranted ? 0 : reward
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
    const rawItems = (Array.isArray(order?.items) && order.items.length
      ? order.items
      : [{ level: order?.level, quantity: order?.quantity }]).slice(0, 2);
    const quantityByLevel = new Map();

    rawItems.forEach((item) => {
      const level = Math.max(
        1,
        Math.min(DATA.maxItemLevel, Number(item?.level) || 1)
      );
      const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      quantityByLevel.set(level, (quantityByLevel.get(level) || 0) + quantity);
    });

    const items = Array.from(quantityByLevel, ([level, quantity]) => ({
      level,
      quantity
    }));
    const rewards = items.reduce(
      (total, item) => {
        const levelReward = DATA.orders.rewards[item.level];
        total.coins += levelReward.coins * item.quantity;
        total.xp += levelReward.xp * item.quantity;
        total.gems += levelReward.gems * item.quantity;
        total.eventPoints += levelReward.eventPoints * item.quantity;
        return total;
      },
      { coins: 0, xp: 0, gems: 0, eventPoints: 0 }
    );
    const primary = items[0];

    return {
      level: primary.level,
      quantity: primary.quantity,
      items,
      customerId: ['coach', 'captain', 'scout'].includes(order?.customerId)
        ? order.customerId
        : null,
      rewards
    };
  }

  function rollOrderLevel() {
    const roll = Math.random();
    let cumulative = 0;
    for (let level = 1; level <= DATA.maxItemLevel; level += 1) {
      cumulative += DATA.orders.levelWeights[level];
      if (roll <= cumulative) return level;
    }
    return 1;
  }

  function createOrder(forcedItemCount = 0) {
    const multiItemRoll = Math.random();
    const itemCount = forcedItemCount > 0
      ? Math.max(1, Math.min(2, forcedItemCount))
      : producer.level >= 2 && multiItemRoll < 0.5
          ? 2
          : 1;
    const levels = [];

    while (levels.length < itemCount) {
      let level = rollOrderLevel();
      let attempts = 0;
      while (levels.includes(level) && attempts < 6) {
        level = rollOrderLevel();
        attempts += 1;
      }
      if (levels.includes(level)) {
        level = Array.from(
          { length: DATA.maxItemLevel },
          (_, index) => index + 1
        ).find((candidate) => !levels.includes(candidate));
      }
      levels.push(level);
    }

    return normalizeOrder({
      items: levels.map((level) => ({ level, quantity: 1 }))
    });
  }

  function ensureOrders() {
    while (orders.length < DATA.orders.slotCount) orders.push(createOrder());
    if (
      producer.level >= 2 &&
      orders.length > 1 &&
      !orders.some((order) => order.items.length > 1)
    ) {
      orders[1] = createOrder(2);
    }
    save();
  }

  function tick(now) {
    if (
      producer.charges === 0 &&
      Number.isFinite(producer.cooldownEndsAt) &&
      now >= producer.cooldownEndsAt
    ) {
      producer.charges = DATA.producer.maxCharges;
      producer.cooldownEndsAt = null;
      save();
      return true;
    }
    return false;
  }

  function canProduce(now = Date.now()) {
    tick(now);
    return producer.charges > 0;
  }

  function consumeCharge(now = Date.now()) {
    if (!canProduce(now)) return false;
    producer.charges -= 1;
    if (producer.charges === 0) {
      producer.cooldownEndsAt = now + DATA.producer.cooldownMs;
    }
    save();
    return true;
  }

  function getProducerState(now = Date.now()) {
    tick(now);
    const levelData = DATA.producer.levels[producer.level];
    return {
      charges: producer.charges,
      maxCharges: DATA.producer.maxCharges,
      cooldownEndsAt: producer.cooldownEndsAt,
      cooldownRemainingMs: producer.cooldownEndsAt
        ? Math.max(0, producer.cooldownEndsAt - now)
        : 0,
      level: producer.level,
      xp: producer.xp,
      xpToNext: levelData.xpToNext,
      isMaxLevel: producer.level === DATA.producer.maxLevel,
      artwork: levelData.artwork
    };
  }

  function getOrders() {
    ensureOrders();
    return orders.map((order) => ({
      level: order.level,
      quantity: order.quantity,
      items: order.items.map((item) => ({ ...item })),
      customerId: order.customerId,
      rewards: { ...order.rewards }
    }));
  }

  function fulfillOrder(slotIndex, deliveredItems) {
    ensureOrders();
    const order = orders[slotIndex];
    if (!order) return null;

    const deliveredLevels = Array.isArray(deliveredItems)
      ? deliveredItems.map(Number)
      : [Number(deliveredItems)];
    const deliveredCounts = deliveredLevels.reduce((counts, level) => {
      counts.set(level, (counts.get(level) || 0) + 1);
      return counts;
    }, new Map());
    const requirementsMet = order.items.every(
      (item) => (deliveredCounts.get(item.level) || 0) >= item.quantity
    );
    const expectedItemCount = order.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    if (!requirementsMet || deliveredLevels.length !== expectedItemCount) return null;

    economy.coins += order.rewards.coins;
    economy.gems += order.rewards.gems;
    economy.eventPoints += order.rewards.eventPoints;
    const producerProgress = applyProducerXp(order.rewards.xp);
    const completed = {
      level: order.level,
      items: order.items.map((item) => ({ ...item })),
      rewards: { ...order.rewards },
      producerProgress
    };
    orders[slotIndex] = createOrder();
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
    tick
  };
})();
