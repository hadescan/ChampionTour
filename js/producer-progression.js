window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.ProducerProgression = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;
  const CONFIG = DATA.producerProgression;
  const STORAGE_KEY = 'championTour.prototype.producerProgression.v2';
  const producerIds = Object.keys(DATA.producers);
  const state = {
    reputation: 0,
    producers: {},
    discoveries: {},
    activeMasteryOrders: {},
    completedMasteries: {},
    retiredProducers: [],
    replacements: {},
    tutorialsSeen: {}
  };

  function defaultProducerState(producerId) {
    const level = 1;
    return {
      producerId,
      level,
      masteryPoints: 0
    };
  }

  function normalize() {
    state.reputation = Math.max(0, Math.floor(Number(state.reputation) || 0));
    producerIds.forEach((producerId) => {
      const saved = state.producers[producerId] || {};
      state.producers[producerId] = {
        ...defaultProducerState(producerId),
        level: Math.max(1, Math.min(3, Math.floor(Number(saved.level) || 1))),
        masteryPoints: Math.max(0, Math.floor(Number(saved.masteryPoints) || 0))
      };
    });
    Object.keys(DATA.chains).forEach((chainId) => {
      state.discoveries[chainId] = Math.max(
        0,
        Math.min(DATA.maxItemLevel, Math.floor(Number(state.discoveries[chainId]) || 0))
      );
    });
    state.retiredProducers = Array.isArray(state.retiredProducers)
      ? [...new Set(state.retiredProducers.filter((id) => DATA.producers[id]))]
      : [];
    state.activeMasteryOrders = state.activeMasteryOrders || {};
    state.completedMasteries = state.completedMasteries || {};
    state.replacements = state.replacements || {};
    state.tutorialsSeen = state.tutorialsSeen || {};
    syncLevels();
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') Object.assign(state, saved);
    } catch (error) {
      console.warn('Producer ilerleme kaydı okunamadı.', error);
    }
    normalize();
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('Producer ilerleme kaydı yazılamadı.', error);
      return false;
    }
  }

  function syncLevels() {
    const upgrades = [];
    CONFIG.reputationMilestones.forEach((milestone) => {
      const current = state.producers[milestone.producerId];
      if (state.reputation < milestone.reputation || current.level >= milestone.level) return;
      current.level = milestone.level;
      upgrades.push({ ...milestone });
    });
    return upgrades;
  }

  function getProducerState(producerId) {
    const producer = state.producers[producerId];
    const definition = DATA.producers[producerId];
    const config = CONFIG.levels[producer.level];
    const replacement = state.replacements[producerId]
      ? CONFIG.retirement[producerId]
      : null;
    return {
      ...producer,
      name: replacement?.replacementName || definition.name,
      chainId: definition.chainId,
      artwork: replacement?.replacementArtwork ||
        definition.artworks?.[producer.level] ||
        definition.artwork,
      normalOrderMaxLevel: config.normalOrderMaxLevel,
      drops: { ...config.drops },
      replacementPendingContent: Boolean(replacement)
    };
  }

  function addReputation(amount) {
    const awarded = Math.max(0, Math.floor(Number(amount) || 0));
    state.reputation += awarded;
    const upgrades = syncLevels();
    save();
    return { awarded, reputation: state.reputation, upgrades };
  }

  function nextMilestones(limit = 3) {
    return [
      ...CONFIG.reputationMilestones.map((milestone) => ({
        ...milestone,
        type: 'upgrade',
        label: `${DATA.producers[milestone.producerId].name} Seviye ${milestone.level}`
      })),
      ...Object.entries(CONFIG.masteryMilestones).map(([chainId, reputation]) => ({
        reputation,
        chainId,
        type: 'mastery',
        label: `${DATA.chains[chainId].name} ustalık hedefi`
      }))
    ]
      .filter((milestone) => milestone.reputation > state.reputation)
      .sort((a, b) => a.reputation - b.reputation)
      .slice(0, limit);
  }

  function recordDiscovery(chainId, level) {
    if (!DATA.chains[chainId]) return { changed: false };
    const previous = state.discoveries[chainId] || 0;
    const next = Math.max(previous, Math.min(DATA.maxItemLevel, Number(level) || 0));
    state.discoveries[chainId] = next;
    save();
    return {
      changed: next > previous,
      masteryDiscovered: previous < DATA.maxItemLevel && next === DATA.maxItemLevel
    };
  }

  function evaluateMastery(counts) {
    const opened = [];
    Object.keys(DATA.chains).forEach((chainId) => {
      const count = Number(counts?.[chainId]) || 0;
      if (
        count >= DATA.specialOrders.maxItemRequiredCount &&
        !state.activeMasteryOrders[chainId] &&
        !state.completedMasteries[chainId]
      ) {
        state.activeMasteryOrders[chainId] = {
          chainId,
          level: DATA.maxItemLevel,
          quantity: DATA.specialOrders.maxItemRequiredCount,
          openedAt: Date.now(),
          rewards: { ...DATA.specialOrders.rewards }
        };
        opened.push(chainId);
      }
    });
    if (opened.length) save();
    return opened;
  }

  function getMasteryOrders() {
    return Object.values(state.activeMasteryOrders).map((order) => ({
      ...order,
      rewards: { ...order.rewards }
    }));
  }

  function completeMastery(chainId) {
    const order = state.activeMasteryOrders[chainId];
    if (!order) return null;
    const producerId = DATA.chains[chainId].producerId;
    delete state.activeMasteryOrders[chainId];
    state.completedMasteries[chainId] = true;
    state.producers[producerId].masteryPoints += order.rewards.mastery;
    const reputationResult = addReputation(order.rewards.reputation);
    save();
    return { ...order, reputationResult };
  }

  function retirementStatus(producerId) {
    const rule = CONFIG.retirement[producerId];
    if (!rule) return null;
    const chainId = DATA.producers[producerId].chainId;
    const producer = state.producers[producerId];
    return {
      eligible:
        producer.level === 3 &&
        state.discoveries[chainId] >= DATA.maxItemLevel &&
        Boolean(state.completedMasteries[chainId]) &&
        state.reputation >= rule.reputation,
      levelReady: producer.level === 3,
      discoveryReady: state.discoveries[chainId] >= DATA.maxItemLevel,
      masteryReady: Boolean(state.completedMasteries[chainId]),
      reputationReady: state.reputation >= rule.reputation,
      rule
    };
  }

  function retire(producerId) {
    const status = retirementStatus(producerId);
    if (!status?.eligible || state.replacements[producerId]) return false;
    state.retiredProducers.push(producerId);
    state.replacements[producerId] = status.rule.replacementId;
    save();
    return true;
  }

  function markTutorialSeen(key) {
    state.tutorialsSeen[key] = true;
    save();
  }

  function getState() {
    return JSON.parse(JSON.stringify({
      ...state,
      nextMilestones: nextMilestones()
    }));
  }

  function resetForTests() {
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, {
      reputation: 0,
      producers: {},
      discoveries: {},
      activeMasteryOrders: {},
      completedMasteries: {},
      retiredProducers: [],
      replacements: {},
      tutorialsSeen: {}
    });
    normalize();
    save();
  }

  load();

  return {
    getState,
    getProducerState,
    addReputation,
    nextMilestones,
    recordDiscovery,
    evaluateMastery,
    getMasteryOrders,
    completeMastery,
    retirementStatus,
    retire,
    markTutorialSeen,
    resetForTests
  };
})();
