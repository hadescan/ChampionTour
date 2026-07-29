window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.AcademyProgression = (function () {
  'use strict';

  const STORAGE_KEY = 'championTour.prototype.academy.v2';
  const LEGACY_STORAGE_KEY = 'championTour.prototype.academy.v1';
  const CONTENT = window.ChampionTour.SportsContent;
  const DATA = window.ChampionTour.GameData;
  const ACADEMIES = CONTENT.academies;
  const FOOTBALL_RENOVATIONS = CONTENT.getAcademy('football').renovations;
  const MAX_LEVEL = FOOTBALL_RENOVATIONS.length + 1;
  const state = {
    level: 1,
    xp: 0,
    totalXp: 0,
    appliedLevel: 1,
    activeAcademyId: 'football'
  };

  function xpRequired(level = state.level) {
    if (level >= MAX_LEVEL) return null;
    return 60 + level * 15;
  }

  function readSavedState() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (current) return current;

      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (!legacy) return null;
      const appliedCount = Object.values(legacy.improvements || {})
        .reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
      return {
        level: legacy.level,
        xp: legacy.xp,
        totalXp: legacy.totalXp,
        appliedLevel: Math.min(
          Number(legacy.level) || 1,
          Math.max(1, appliedCount + 1)
        ),
        activeAcademyId: 'football'
      };
    } catch (error) {
      console.warn('Akademi ilerleme kaydı okunamadı.', error);
      return null;
    }
  }

  function load() {
    const saved = readSavedState();
    if (!saved) return;
    state.level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(saved.level) || 1)));
    state.xp = Math.max(0, Math.floor(Number(saved.xp) || 0));
    state.totalXp = Math.max(
      0,
      Math.floor(Number(saved.totalXp) || (
        DATA.academyEconomy.renovations[Math.max(0, state.level - 2)]?.totalXp || 0
      ) + state.xp)
    );
    state.appliedLevel = Math.max(
      1,
      Math.min(state.level, Math.floor(Number(saved.appliedLevel) || 1))
    );
    state.activeAcademyId = String(saved.activeAcademyId || 'football');
    if (state.level === MAX_LEVEL) state.xp = 0;
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Akademi ilerleme kaydı yazılamadı.', error);
    }
  }

  function getAcademies() {
    const footballComplete = state.appliedLevel >= MAX_LEVEL;
    return ACADEMIES.map((academy, index) => ({
      id: academy.id,
      name: academy.name,
      shortName: academy.shortName,
      icon: academy.icon,
      theme: academy.theme,
      description: academy.description,
      status: index === 0
        ? footballComplete ? 'completed' : 'active'
        : index === 1 && footballComplete ? 'available' : 'locked',
      progress: index === 0 ? (state.appliedLevel - 1) / (MAX_LEVEL - 1) : 0
    }));
  }

  function getFacilityProgress() {
    const applied = FOOTBALL_RENOVATIONS.slice(
      0,
      Math.max(0, state.appliedLevel - 1)
    );
    const facilityNames = [...new Set(
      FOOTBALL_RENOVATIONS.map((renovation) => renovation.facility)
    )];
    return facilityNames.map((name) => {
      const steps = FOOTBALL_RENOVATIONS.filter(
        (renovation) => renovation.facility === name
      );
      const completed = applied.filter(
        (renovation) => renovation.facility === name
      ).length;
      return {
        name,
        completed,
        total: steps.length,
        progress: steps.length ? completed / steps.length : 0,
        status: completed === steps.length
          ? 'completed'
          : completed > 0 ? 'active' : 'locked'
      };
    });
  }

  function getState() {
    const required = xpRequired();
    const pendingRenovations = Math.max(0, state.level - state.appliedLevel);
    const completed = state.appliedLevel >= MAX_LEVEL;
    const nextBalance = DATA.academyEconomy.renovations[state.appliedLevel - 1] || null;
    const economy = window.ChampionTour.Progression?.getEconomy?.() || { coins: 0 };
    const renovationDefinition = pendingRenovations > 0
      ? FOOTBALL_RENOVATIONS[state.appliedLevel - 1]
      : null;
    const nextRenovation = renovationDefinition && nextBalance
      ? {
          ...renovationDefinition,
          requiredTotalXp: nextBalance.totalXp,
          coinCost: nextBalance.coins,
          remainingXp: Math.max(0, nextBalance.totalXp - state.totalXp),
          remainingCoins: Math.max(0, nextBalance.coins - economy.coins),
          affordable: state.totalXp >= nextBalance.totalXp && economy.coins >= nextBalance.coins
        }
      : null;
    return {
      level: state.level,
      maxLevel: MAX_LEVEL,
      xp: state.xp,
      totalXp: state.totalXp,
      xpToNext: required,
      progress: required ? Math.min(1, state.xp / required) : 1,
      appliedLevel: state.appliedLevel,
      pendingRenovations,
      pendingUpgrades: pendingRenovations,
      completed,
      activeAcademyId: state.activeAcademyId,
      nextWorld: completed ? 'basketball' : null,
      nextRenovation,
      facilityProgress: getFacilityProgress()
    };
  }

  function addXp(amount) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    state.totalXp += remaining;
    const levelUps = [];
    while (remaining > 0 && state.level < MAX_LEVEL) {
      const required = xpRequired();
      const accepted = Math.min(remaining, required - state.xp);
      state.xp += accepted;
      remaining -= accepted;
      if (state.xp < required) continue;
      state.xp = 0;
      state.level += 1;
      levelUps.push(state.level);
    }
    if (state.level === MAX_LEVEL) state.xp = 0;
    save();
    return { levelUps, state: getState() };
  }

  function applyNextRenovation() {
    if (state.appliedLevel >= state.level || state.appliedLevel >= MAX_LEVEL) {
      return null;
    }
    const balance = DATA.academyEconomy.renovations[state.appliedLevel - 1];
    if (!balance || state.totalXp < balance.totalXp) return null;
    const economy = window.ChampionTour.Progression.adjustEconomy({ coins: -balance.coins });
    if (!economy) return null;
    const renovation = {
      ...FOOTBALL_RENOVATIONS[state.appliedLevel - 1],
      requiredTotalXp: balance.totalXp,
      coinCost: balance.coins
    };
    state.appliedLevel += 1;
    save();
    return { renovation, state: getState() };
  }

  function setActiveAcademy(id) {
    const academy = getAcademies().find((entry) => entry.id === id);
    if (!academy || academy.status === 'locked') return false;
    state.activeAcademyId = id;
    save();
    return true;
  }

  load();

  return {
    MAX_LEVEL,
    ACADEMIES,
    FOOTBALL_RENOVATIONS,
    addXp,
    applyNextRenovation,
    getAcademies,
    getState,
    setActiveAcademy
  };
})();
