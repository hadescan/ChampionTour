window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.ProductionRules = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;

  function levelForEnergy(energy) {
    const normalized = Number(energy);
    if (!DATA.productionModes.energyOptions.includes(normalized)) return 1;
    return Math.min(DATA.maxItemLevel, Math.log2(normalized) + 1);
  }

  function maxLevelForChain(chainId) {
    const chain = DATA.chains[chainId];
    if (!chain) return 0;
    for (let level = chain.assets.length - 1; level >= 1; level -= 1) {
      if (chain.assets[level]) return level;
    }
    return 0;
  }

  function supportedEnergyOptions(chainId) {
    const maxLevel = maxLevelForChain(chainId);
    return DATA.productionModes.energyOptions.filter(
      (energy) => levelForEnergy(energy) <= maxLevel
    );
  }

  function resultForEnergy(energy, random = Math.random, producerId = 'ball_basket') {
    const baseLevel = levelForEnergy(energy);
    const producer = window.ChampionTour.ProducerProgression
      ?.getProducerState(producerId);
    const drops = producer?.drops || { 1: 1 };
    const roll = random();
    let cumulative = 0;
    let rolledLevel = 1;
    Object.entries(drops).some(([level, chance]) => {
      cumulative += chance;
      if (roll > cumulative) return false;
      rolledLevel = Number(level);
      return true;
    });
    const level = Math.min(DATA.maxItemLevel, baseLevel + rolledLevel - 1);
    return { level, rare: rolledLevel > 1, producerLevel: producer?.level || 1 };
  }

  return { levelForEnergy, maxLevelForChain, supportedEnergyOptions, resultForEnergy };
})();
