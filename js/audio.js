window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Audio = (function () {
  'use strict';

  const sources = {
    merge: null,
    producer: null,
    coin: null,
    button: null,
    reward: null
  };

  function register(id, source) {
    if (Object.prototype.hasOwnProperty.call(sources, id)) sources[id] = source;
  }

  function play(id) {
    const source = sources[id];
    if (!source) return;
    const audio = new Audio(source);
    audio.volume = .55;
    audio.play().catch(() => {});
  }

  return { register, play };
})();
