window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.ProductionRules = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;

  function validateChainConfig(chains = DATA.chains) {
    Object.values(chains).forEach((chain) => {
      const maximum = Number(chain.maxItemLevel);
      if (!Number.isInteger(maximum) || maximum < 1 || maximum > DATA.absoluteMaxItemLevel) {
        throw new RangeError(`${chain.id || 'chain'} maxItemLevel 1–${DATA.absoluteMaxItemLevel} arasında olmalı.`);
      }
    });
    return true;
  }

  function levelForEnergy(energy) {
    const normalized = Number(energy);
    if (!DATA.productionModes.energyOptions.includes(normalized)) return 1;
    return Math.min(DATA.absoluteMaxItemLevel, Math.log2(normalized) + 1);
  }

  function maxLevelForChain(chainId) {
    return Math.min(
      DATA.absoluteMaxItemLevel,
      Math.max(1, Number(DATA.chains[chainId]?.maxItemLevel) || 0)
    );
  }

  function supportedEnergyOptions(chainId) {
    const maxLevel = maxLevelForChain(chainId);
    return DATA.productionModes.energyOptions.filter(
      (energy) => levelForEnergy(energy) <= maxLevel
    );
  }

  function resultForEnergy(energy, random = Math.random, producerId = 'ball_basket') {
    const producer = window.ChampionTour.ProducerProgression
      ?.getProducerState(producerId);
    const chainMax = maxLevelForChain(producer?.chainId || DATA.producers[producerId]?.chainId);
    const table = DATA.productionModes.dropTables[energy] ||
      DATA.productionModes.dropTables[DATA.productionModes.defaultEnergy];
    const roll = random();
    let cumulative = 0;
    let selected = table[0].level;
    table.some((drop) => {
      cumulative += drop.weight;
      if (roll >= cumulative) return false;
      selected = drop.level;
      return true;
    });
    const baseLevel = levelForEnergy(energy);
    const level = Math.min(chainMax, selected);
    return {
      level,
      rare: selected > baseLevel,
      exceptional: selected >= baseLevel + 2,
      producerLevel: producer?.level || 1
    };
  }

  validateChainConfig();
  return {
    levelForEnergy,
    maxLevelForChain,
    supportedEnergyOptions,
    resultForEnergy,
    validateChainConfig
  };
})();
