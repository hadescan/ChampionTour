window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Progression = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;
  const STORAGE_KEY = 'championTour.prototype.progression.v1';
  const producer = {
    charges: DATA.producer.maxCharges,
    cooldownEndsAt: null
  };
  const economy = {
    coins: 0,
    xp: 0,
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
      }

      Object.keys(economy).forEach((key) => {
        economy[key] = Math.max(0, Math.floor(Number(saved.economy?.[key]) || 0));
      });

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

  function normalizeOrder(order) {
    const level = Math.max(1, Math.min(DATA.maxItemLevel, Number(order?.level) || 1));
    return {
      level,
      quantity: 1,
      rewards: { ...DATA.orders.rewards[level] }
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

  function createOrder() {
    return normalizeOrder({ level: rollOrderLevel() });
  }

  function ensureOrders() {
    while (orders.length < DATA.orders.slotCount) orders.push(createOrder());
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
    return {
      charges: producer.charges,
      maxCharges: DATA.producer.maxCharges,
      cooldownEndsAt: producer.cooldownEndsAt,
      cooldownRemainingMs: producer.cooldownEndsAt
        ? Math.max(0, producer.cooldownEndsAt - now)
        : 0
    };
  }

  function getOrders() {
    ensureOrders();
    return orders.map((order) => ({
      level: order.level,
      quantity: order.quantity,
      rewards: { ...order.rewards }
    }));
  }

  function fulfillOrder(slotIndex, itemLevel) {
    ensureOrders();
    const order = orders[slotIndex];
    if (!order || order.level !== itemLevel) return null;

    Object.keys(economy).forEach((key) => {
      economy[key] += order.rewards[key];
    });
    const completed = {
      level: order.level,
      rewards: { ...order.rewards }
    };
    orders[slotIndex] = createOrder();
    save();
    return completed;
  }

  function getEconomy() {
    return { ...economy };
  }

  load();
  ensureOrders();

  return {
    canProduce,
    consumeCharge,
    getProducerState,
    getOrders,
    fulfillOrder,
    getEconomy,
    tick
  };
})();
