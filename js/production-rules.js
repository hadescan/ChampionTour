window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.ProductionRules = (function () {
  'use strict';

  const DATA = window.ChampionTour.GameData;

  function levelForEnergy(energy) {
    const normalized = Number(energy);
    if (!DATA.productionModes.energyOptions.includes(normalized)) return 1;
    return Math.min(DATA.maxItemLevel, Math.log2(normalized) + 1);
  }

  function resultForEnergy(energy, random = Math.random) {
    const normalized = Number(energy);
    if (normalized !== DATA.productionModes.defaultEnergy) {
      return { level: levelForEnergy(normalized), rare: false };
    }
    const roll = random();
    if (roll < DATA.productionModes.rareLevel4Chance) {
      return { level: Math.min(4, DATA.maxItemLevel), rare: true };
    }
    if (
      roll <
      DATA.productionModes.rareLevel4Chance +
      DATA.productionModes.rareLevel3Chance
    ) {
      return { level: Math.min(3, DATA.maxItemLevel), rare: true };
    }
    return { level: 1, rare: false };
  }

  return { levelForEnergy, resultForEnergy };
})();
