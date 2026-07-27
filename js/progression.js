window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Progression = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;
  const STORAGE_KEY = 'championTour.prototype.progression.v1';
  const producer = {
    level: 1,
    xp: 0,
    rewardedLevels: []
  };
  const producerUnits = Object.fromEntries(
    Object.values(DATA.producers).map((definition) => [
      definition.id,
      { charges: definition.maxCharges, cooldownEndsAt: null }
    ])
  );
  const economy = { coins: 0, gems: 0, eventPoints: 0 };
  let orders = [];

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
      Object.entries(producerUnits).forEach(([id, unit]) => {
        const definition = DATA.producers[id];
        const savedUnit = saved.producerUnits?.[id];
        if (savedUnit) {
          unit.charges = Math.max(
            0,
            Math.min(definition.maxCharges, Number(savedUnit.charges) || 0)
          );
          unit.cooldownEndsAt = Number(savedUnit.cooldownEndsAt) || null;
        } else if (id === 'ball_basket' && saved.producer) {
          unit.charges = Math.max(
            0,
            Math.min(definition.maxCharges, Number(saved.producer.charges) || definition.maxCharges)
          );
          unit.cooldownEndsAt = Number(saved.producer.cooldownEndsAt) || null;
        }
      });
      Object.keys(economy).forEach((key) => {
        economy[key] = Math.max(0, Math.floor(Number(saved.economy?.[key]) || 0));
      });
      if (Array.isArray(saved.orders) && saved.orders.length === DATA.orders.slotCount) {
        orders = saved.orders.map(normalizeOrder);
      }
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
        producerUnits,
        economy,
        orders
      }));
    } catch (error) {
      console.warn('Progression kaydı yazılamadı.', error);
    }
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
    const rewards = items.reduce((total, item) => {
      const reward = DATA.orders.rewards[item.level];
      total.coins += reward.coins * item.quantity;
      total.xp += reward.xp * item.quantity;
      total.gems += reward.gems * item.quantity;
      total.eventPoints += reward.eventPoints * item.quantity;
      return total;
    }, { coins: 0, xp: 0, gems: 0, eventPoints: 0 });
    const primary = items[0];
    return {
      chainId: primary.chainId,
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
    const itemCount = forcedItemCount > 0
      ? Math.max(1, Math.min(2, forcedItemCount))
      : producer.level >= 2 && Math.random() < .5 ? 2 : 1;
    const chainIds = Object.keys(DATA.chains);
    const items = [];
    while (items.length < itemCount) {
      const candidate = {
        chainId: chainIds[Math.floor(Math.random() * chainIds.length)],
        level: rollOrderLevel(),
        quantity: 1
      };
      if (!items.some(
        (item) => item.chainId === candidate.chainId && item.level === candidate.level
      )) {
        items.push(candidate);
      }
    }
    return normalizeOrder({ items });
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
    let changed = false;
    Object.entries(producerUnits).forEach(([id, unit]) => {
      if (
        unit.charges === 0 &&
        Number.isFinite(unit.cooldownEndsAt) &&
        now >= unit.cooldownEndsAt
      ) {
        unit.charges = DATA.producers[id].maxCharges;
        unit.cooldownEndsAt = null;
        changed = true;
      }
    });
    if (changed) save();
    return changed;
  }

  function canProduce(producerId = 'ball_basket', now = Date.now()) {
    tick(now);
    return (producerUnits[producerId]?.charges || 0) > 0;
  }

  function consumeCharge(producerId = 'ball_basket', now = Date.now()) {
    if (!canProduce(producerId, now)) return false;
    const unit = producerUnits[producerId];
    const definition = DATA.producers[producerId];
    unit.charges -= 1;
    if (unit.charges === 0) unit.cooldownEndsAt = now + definition.cooldownMs;
    save();
    return true;
  }

  function getProducerState(producerId = 'ball_basket', now = Date.now()) {
    tick(now);
    const definition = DATA.producers[producerId] || DATA.producers.ball_basket;
    const unit = producerUnits[definition.id];
    const levelData = DATA.producer.levels[producer.level];
    return {
      id: definition.id,
      name: definition.name,
      chainId: definition.chainId,
      symbol: definition.symbol || null,
      charges: unit.charges,
      maxCharges: definition.maxCharges,
      cooldownEndsAt: unit.cooldownEndsAt,
      cooldownRemainingMs: unit.cooldownEndsAt
        ? Math.max(0, unit.cooldownEndsAt - now)
        : 0,
      level: producer.level,
      xp: producer.xp,
      xpToNext: levelData.xpToNext,
      isMaxLevel: producer.level === DATA.producer.maxLevel,
      artwork: definition.artwork || levelData.artwork
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
    const producerProgress = applyProducerXp(order.rewards.xp);
    const completed = {
      chainId: order.chainId,
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
