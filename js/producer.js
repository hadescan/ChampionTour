/**
 * producer.js
 * Producer mantığı: item üretimi artık cooldown yerine ENERJİ harcayarak tetiklenir
 * (kullanıcı kararı, bkz. data.js -> energy notu).
 * Info paneli SADECE info butonu ile açılır (long-press yok).
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Producer = (function () {
  // producerId -> { level }
  const states = {};

  // boardIndex -> producerId (tick sırasında hangi hücreleri güncelleyeceğimizi biliriz)
  const boardIndexToProducerId = {};

  function getState(producerId) {
    if (!states[producerId]) {
      states[producerId] = { level: 1 };
    }
    return states[producerId];
  }

  function getDef(producerId) {
    return window.ChampionTour.DATA.producers[producerId];
  }

  /**
   * Producer'ın drop rate tablosuna göre ağırlıklı rastgele bir item seviyesi seçer.
   */
  function rollItemLevel(producerId) {
    const state = getState(producerId);
    const def = getDef(producerId);
    const rates = def.levels[state.level].dropRates;

    const roll = Math.random();
    let cumulative = 0;
    const levels = Object.keys(rates).map(Number).sort((a, b) => a - b);

    for (const level of levels) {
      cumulative += rates[level];
      if (roll <= cumulative) return level;
    }
    return levels[0];
  }

  function onProducerTap(index) {
    const cellData = window.ChampionTour.Board.getCell(index);
    if (!cellData || cellData.kind !== 'producer') return;
    const producerId = cellData.producerId;
    const cost = window.ChampionTour.DATA.energy.costPerProduction;

    if (window.ChampionTour.Energy.getCurrent() < cost) {
      window.ChampionTour.UI.showToast(window.t('energy.not_enough'));
      return;
    }

    const emptyIndex = window.ChampionTour.Board.findFirstEmptyCell();
    if (emptyIndex === -1) {
      window.ChampionTour.UI.showToast(window.t('board.full'));
      return;
    }

    window.ChampionTour.Energy.spend(cost);

    const def = getDef(producerId);
    const level = rollItemLevel(producerId);

    window.ChampionTour.Board.setCell(emptyIndex, {
      kind: 'item',
      chainId: def.chainId,
      level: level
    });
    window.ChampionTour.Board.playMergePop(emptyIndex);

    updateVisual(index, producerId);
  }

  /**
   * Producer hücresinin iç DOM yapısını oluşturur: ikon + info butonu.
   * board.js, hücre her render edildiğinde bunu çağırır.
   */
  function renderProducerCell(cellEl, producerId) {
    const index = Number(cellEl.dataset.index);
    boardIndexToProducerId[index] = producerId;

    const def = getDef(producerId);

    const img = document.createElement('img');
    img.className = 'cell-icon';
    img.src = `assets/icons/${def.icon}`;
    img.draggable = false;
    img.alt = window.t(def.nameKey);
    cellEl.appendChild(img);

    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'producer-info-btn';
    infoBtn.textContent = 'i';
    infoBtn.setAttribute('aria-label', 'Producer info');
    infoBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      window.ChampionTour.UI.openProducerPanel(producerId);
    });
    cellEl.appendChild(infoBtn);

    updateVisual(index, producerId);
  }

  function updateVisual(index, producerId) {
    const cellEl = window.ChampionTour.Board.getCellEl(index);
    if (!cellEl) return;

    const cost = window.ChampionTour.DATA.energy.costPerProduction;
    if (window.ChampionTour.Energy.getCurrent() >= cost) {
      cellEl.classList.add('ready');
    } else {
      cellEl.classList.remove('ready');
    }
  }

  /**
   * Her game-loop tick'inde çağrılır (main.js). Boarddaki tüm producer'ların
   * "tıklanabilir" (yeterli enerji var) görselini günceller.
   */
  function tick() {
    for (const indexStr of Object.keys(boardIndexToProducerId)) {
      const index = Number(indexStr);
      const producerId = boardIndexToProducerId[index];
      updateVisual(index, producerId);
    }
  }

  return {
    onProducerTap,
    renderProducerCell,
    tick,
    getState,
    getDef
  };
})();
