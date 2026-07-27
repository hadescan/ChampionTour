window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.AcademyProgression = (function () {
  'use strict';

  const STORAGE_KEY = 'championTour.prototype.academy.v1';
  const MAX_LEVEL = 30;
  const IMPROVEMENTS = Object.freeze({
    pitch: Object.freeze({
      name: 'Futbol Sahaları',
      description: 'Çimleri, çizgileri ve antrenman alanlarını geliştir.',
      icon: '⚽',
      maxLevel: 4
    }),
    stands: Object.freeze({
      name: 'Tribünler',
      description: 'Aileler ve taraftarlar için yeni oturma alanları kur.',
      icon: '🏟',
      maxLevel: 4
    }),
    clubhouse: Object.freeze({
      name: 'Kulüp Binası',
      description: 'Akademinin merkez binasını büyüt ve modernleştir.',
      icon: '🏠',
      maxLevel: 4
    }),
    fitness: Object.freeze({
      name: 'Fitness Merkezi',
      description: 'Oyuncular için profesyonel antrenman alanları aç.',
      icon: '🏋',
      maxLevel: 4
    }),
    paths: Object.freeze({
      name: 'Kampüs Yolları',
      description: 'Tesisleri birbirine bağlayan düzenli yollar oluştur.',
      icon: '➜',
      maxLevel: 4
    }),
    landscape: Object.freeze({
      name: 'Çevre Düzenlemesi',
      description: 'Ağaçlar, çiçekler ve dinlenme alanları ekle.',
      icon: '🌳',
      maxLevel: 5
    }),
    lighting: Object.freeze({
      name: 'Işıklandırma',
      description: 'Akademiyi akşam antrenmanlarına hazırla.',
      icon: '✦',
      maxLevel: 4
    })
  });
  const improvementKeys = Object.keys(IMPROVEMENTS);
  const state = {
    level: 1,
    xp: 0,
    pendingUpgrades: 0,
    improvements: Object.fromEntries(
      improvementKeys.map((key) => [key, 0])
    )
  };

  function xpRequired(level = state.level) {
    if (level >= MAX_LEVEL) return null;
    return 60 + level * 15;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;
      state.level = Math.max(
        1,
        Math.min(MAX_LEVEL, Math.floor(Number(saved.level) || 1))
      );
      state.xp = Math.max(0, Math.floor(Number(saved.xp) || 0));
      state.pendingUpgrades = Math.max(
        0,
        Math.floor(Number(saved.pendingUpgrades) || 0)
      );
      improvementKeys.forEach((key) => {
        const maxLevel = IMPROVEMENTS[key].maxLevel;
        state.improvements[key] = Math.max(
          0,
          Math.min(maxLevel, Math.floor(Number(saved.improvements?.[key]) || 0))
        );
      });
      if (state.level === MAX_LEVEL) state.xp = 0;
    } catch (error) {
      console.warn('Akademi ilerleme kaydı okunamadı.', error);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Akademi ilerleme kaydı yazılamadı.', error);
    }
  }

  function getState() {
    const required = xpRequired();
    return {
      level: state.level,
      maxLevel: MAX_LEVEL,
      xp: state.xp,
      xpToNext: required,
      progress: required ? Math.min(1, state.xp / required) : 1,
      pendingUpgrades: state.pendingUpgrades,
      improvements: { ...state.improvements },
      completed: state.level === MAX_LEVEL && state.pendingUpgrades === 0,
      nextWorld: state.level === MAX_LEVEL && state.pendingUpgrades === 0
        ? 'basketball_academy'
        : null
    };
  }

  function addXp(amount) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    const levelUps = [];

    while (remaining > 0 && state.level < MAX_LEVEL) {
      const required = xpRequired();
      const accepted = Math.min(remaining, required - state.xp);
      state.xp += accepted;
      remaining -= accepted;
      if (state.xp < required) continue;
      state.xp = 0;
      state.level += 1;
      state.pendingUpgrades += 1;
      levelUps.push(state.level);
    }
    if (state.level === MAX_LEVEL) state.xp = 0;
    save();
    return { levelUps, state: getState() };
  }

  function getUpgradeChoices() {
    const available = improvementKeys.filter(
      (key) => state.improvements[key] < IMPROVEMENTS[key].maxLevel
    );
    if (!available.length) return [];

    const startIndex =
      (state.level + state.pendingUpgrades + available.length) % available.length;
    const rotated = available
      .slice(startIndex)
      .concat(available.slice(0, startIndex));

    return rotated.slice(0, 3).map((key) => ({
      key,
      ...IMPROVEMENTS[key],
      level: state.improvements[key],
      nextLevel: state.improvements[key] + 1
    }));
  }

  function applyUpgrade(key) {
    const definition = IMPROVEMENTS[key];
    if (
      !definition ||
      state.pendingUpgrades <= 0 ||
      state.improvements[key] >= definition.maxLevel
    ) {
      return null;
    }

    state.improvements[key] += 1;
    state.pendingUpgrades -= 1;
    save();
    return {
      key,
      definition,
      level: state.improvements[key],
      state: getState()
    };
  }

  load();

  return {
    MAX_LEVEL,
    IMPROVEMENTS,
    addXp,
    applyUpgrade,
    getState,
    getUpgradeChoices
  };
})();
