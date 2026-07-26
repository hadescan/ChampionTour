/**
 * energy.js
 * Enerji sistemi: sabit bir max'a kadar regen olur, üretim enerji harcar.
 * GDD'deki producer cooldown mekaniğinin yerini alıyor (kullanıcı kararı).
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Energy = (function () {
  const cfg = window.ChampionTour.DATA.energy;

  const state = {
    current: cfg.startingEnergy,
    regenRemainingMs: cfg.regenIntervalMs
  };

  function getCurrent() {
    return state.current;
  }

  function getMax() {
    return cfg.maxEnergy;
  }

  /**
   * Yeterli enerji varsa harcar ve true döner. Yetersizse false döner, state değişmez.
   */
  function spend(amount) {
    if (state.current < amount) return false;
    state.current -= amount;
    render();
    return true;
  }

  function getRegenRemainingSeconds() {
    return Math.max(0, Math.ceil(state.regenRemainingMs / 1000));
  }

  /**
   * Her game-loop tick'inde çağrılır. deltaMs: son tick'ten bu yana geçen süre.
   */
  function tick(deltaMs) {
    if (state.current >= cfg.maxEnergy) {
      state.regenRemainingMs = cfg.regenIntervalMs;
      render();
      return;
    }

    state.regenRemainingMs -= deltaMs;

    while (state.regenRemainingMs <= 0 && state.current < cfg.maxEnergy) {
      state.current += 1;
      state.regenRemainingMs += cfg.regenIntervalMs;
    }

    if (state.current >= cfg.maxEnergy) {
      state.regenRemainingMs = cfg.regenIntervalMs;
    }

    render();
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function render() {
    const valueEl = document.getElementById('energyValue');
    const nextEl = document.getElementById('energyNext');
    if (!valueEl) return;

    valueEl.textContent = `${state.current}/${cfg.maxEnergy}`;

    if (nextEl) {
      nextEl.textContent =
        state.current >= cfg.maxEnergy
          ? window.t('energy.full')
          : `${window.t('energy.next_label')} ${formatTime(getRegenRemainingSeconds())}`;
    }
  }

  return { getCurrent, getMax, spend, tick, getRegenRemainingSeconds, render };
})();
