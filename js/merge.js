/**
 * merge.js
 * Merge kuralları:
 * - Sadece aynı chainId + aynı level olan itemlar merge olur.
 * - Merge sonucu bir üst seviyedeki item olur.
 * - Zincirin son seviyesindeyse merge olmaz (MVP'de üst sınır).
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Merge = (function () {
  function canMerge(itemA, itemB) {
    if (!itemA || !itemB) return false;
    if (itemA.kind !== 'item' || itemB.kind !== 'item') return false;
    return itemA.chainId === itemB.chainId && itemA.level === itemB.level;
  }

  function nextLevelExists(chainId, level) {
    const chain = window.ChampionTour.DATA.chains[chainId];
    return chain.levels.some((l) => l.level === level + 1);
  }

  /**
   * İki item'ı merge etmeyi dener.
   * Başarılıysa yeni item objesini döner, değilse null.
   */
  function tryMerge(itemA, itemB) {
    if (!canMerge(itemA, itemB)) return null;
    if (!nextLevelExists(itemA.chainId, itemA.level)) return null;

    return {
      kind: 'item',
      chainId: itemA.chainId,
      level: itemA.level + 1
    };
  }

  return { canMerge, tryMerge, nextLevelExists };
})();
