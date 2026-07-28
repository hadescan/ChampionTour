(function () {
  'use strict';

  const BOARD_COLUMNS = 7;
  const BOARD_ROWS = 9;
  const CELL_COUNT = BOARD_COLUMNS * BOARD_ROWS;
  const DATA = window.ChampionTour.GameData;
  const Progression = window.ChampionTour.Progression;
  const ProductionRules = window.ChampionTour.ProductionRules;
  const Academy = window.ChampionTour.AcademyProgression;
  const GameAudio = window.ChampionTour.Audio;
  const TESTING_MODE = DATA.testing;
  const PRODUCER_STARTS = Object.freeze([
    Object.freeze({ index: 8, producerId: 'ball_basket' }),
    Object.freeze({ index: 12, producerId: 'equipment_locker' }),
    Object.freeze({ index: 50, producerId: 'training_cart' }),
    Object.freeze({ index: 54, producerId: 'trophy_cabinet' })
  ]);
  const MAX_LEVEL = DATA.maxItemLevel;
  const MAX_ENERGY = 100;
  const PRODUCTION_COST = DATA.producer.energyCost;
  const REGEN_INTERVAL_MS = 2 * 60 * 1000;
  const STORAGE_KEY = 'championTour.prototype.energy.v1';
  const BOARD_STORAGE_KEY = 'championTour.prototype.board.v2';
  const SHADOW_SOURCE = 'assets/Football/shadow.png';
  const DRAG_THRESHOLD = 7;
  const PRODUCER_PRESS_MS = 120;
  const PRODUCER_EXIT_HOLD_MS = 50;
  const PRODUCER_MIN_FLIGHT_MS = 190;
  const PRODUCER_MAX_FLIGHT_MS = 280;
  const PRODUCER_FLIGHT_MS_PER_CELL = 15;
  const PRODUCER_LANDING_MS = 110;
  const PRODUCER_SPAWN_FALLBACK_MS = 120;
  const SPAWN_VISUAL_STAGGER_MS = 65;
  const MAX_ACTIVE_SPAWN_VISUALS = 3;
  const MERGE_DEPARTURE_MS = 105;
  const MERGE_SPARKS_MS = 320;
  const DRAG_FOLLOW_OFFSET = 4;
  const DRAG_MAX_TILT = 3;
  const DROP_SETTLE_MS = 100;
  const INVALID_DROP_MS = 150;
  const MERGE_ANTICIPATION_MS = 55;
  const ORDER_DELIVERY_MS = 420;
  const ORDER_CARD_RESOLVE_MS = 940;
  const ORDER_REWARD_START_MS = 430;
  const ORDER_REWARD_FLIGHT_MS = 470;
  const ORDER_COUNTER_PULSE_MS = 240;
  const INITIAL_STORAGE_CAPACITY = DATA.storage.initialCapacity;
  const STORAGE_SLOT_UNLOCK_COST = DATA.storage.slotUnlockCost;
  const DEFAULT_ITEM_SELL_PRICE = DATA.economy.defaultItemSellPrice;
  const PRODUCTION_ENERGY_OPTIONS = DATA.productionModes.energyOptions;
  const DEFAULT_PRODUCTION_ENERGY = DATA.productionModes.defaultEnergy;

  const TEXT = {
    emptyCell: window.t('board.empty_cell'),
    producer: window.t('producer.football_academy.name'),
    ballLevel: (level) => window.t('prototype.ball_level').replace('{level}', String(level)),
    boardFull: window.t('prototype.board_full'),
    noEnergy: window.t('energy.not_enough'),
    maxReached: window.t('prototype.max_reached'),
    sameLevel: window.t('prototype.same_level'),
    full: window.t('energy.full')
  };

  const state = {
    cells: new Array(CELL_COUNT).fill(null),
    drag: null,
    producerPointer: null,
    storage: new Array(INITIAL_STORAGE_CAPACITY).fill(null),
    storageCapacity: INITIAL_STORAGE_CAPACITY,
    storageDrag: null,
    selectedProductionEnergy: DEFAULT_PRODUCTION_ENERGY,
    energy: MAX_ENERGY,
    nextEnergyAt: null
  };

  let boardElement;
  let cellElements = [];
  let toastTimer;
  let mergeSparksElement;
  let selectedItemLevel = null;
  let selectedItemChainId = null;
  let selectedInfo = null;
  let selectedCellIndex = -1;
  let itemInfoTimer;
  let lastItemTapIndex = -1;
  let lastItemTapAt = 0;
  const pendingSpawnTargets = new Set();
  const spawnVisualQueue = [];
  let activeSpawnVisuals = 0;
  let nextSpawnVisualStartAt = 0;
  let orderReadinessScheduled = false;
  const counterAnimations = new Map();
  const producerHighlightTimers = new Map();
  let saleConfirmationIndex = -1;
  let saleConfirmTimer = 0;
  let saleInProgress = false;
  let lastSale = null;
  let specialOrderCheckScheduled = false;

  function itemSource(chainId, level) {
    return DATA.chains[chainId]?.assets[level] || DATA.chains.footballs.assets[level];
  }

  function producerSource(producerId = 'ball_basket') {
    return DATA.producers[producerId]?.artwork || DATA.producers.ball_basket.artwork;
  }

  function applyUiIcons(root = document) {
    root.querySelectorAll('[data-ui-icon]').forEach((image) => {
      image.src = DATA.uiIcons[image.dataset.uiIcon];
    });
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = window.t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      element.setAttribute('aria-label', window.t(element.dataset.i18nAria));
    });
  }

  function createItemShadow() {
    const shadow = document.createElement('img');
    shadow.className = 'item-shadow';
    shadow.src = SHADOW_SOURCE;
    shadow.alt = '';
    shadow.draggable = false;
    shadow.setAttribute('aria-hidden', 'true');
    return shadow;
  }

  function loadEnergy() {
    let saved = null;

    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.warn('Enerji kaydı okunamadı; varsayılan değer kullanılacak.', error);
    }

    if (saved && Number.isFinite(saved.energy)) {
      state.energy = Math.min(MAX_ENERGY, Math.max(0, Math.floor(saved.energy)));
      state.nextEnergyAt = Number.isFinite(saved.nextEnergyAt) ? saved.nextEnergyAt : null;
    }

    updateRegeneration(Date.now());
    saveEnergy();
  }

  function saveEnergy() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        energy: state.energy,
        nextEnergyAt: state.nextEnergyAt,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn('Enerji durumu kaydedilemedi.', error);
    }
  }

  function updateRegeneration(now) {
    if (state.energy >= MAX_ENERGY) {
      state.energy = MAX_ENERGY;
      state.nextEnergyAt = null;
      return false;
    }

    if (!Number.isFinite(state.nextEnergyAt)) {
      state.nextEnergyAt = now + REGEN_INTERVAL_MS;
      return true;
    }

    if (now < state.nextEnergyAt) return false;

    const earned = 1 + Math.floor((now - state.nextEnergyAt) / REGEN_INTERVAL_MS);
    state.energy = Math.min(MAX_ENERGY, state.energy + earned);

    if (state.energy >= MAX_ENERGY) {
      state.nextEnergyAt = null;
    } else {
      state.nextEnergyAt += earned * REGEN_INTERVAL_MS;
    }

    return true;
  }

  function spendEnergy(amount) {
    if (
      TESTING_MODE.enabled &&
      (TESTING_MODE.bypassEnergy || TESTING_MODE.infiniteEnergyInTest)
    ) {
      renderEnergy();
      return true;
    }

    if (state.energy < amount) return false;

    const wasFull = state.energy === MAX_ENERGY;
    state.energy -= amount;

    if (wasFull || !Number.isFinite(state.nextEnergyAt)) {
      state.nextEnergyAt = Date.now() + REGEN_INTERVAL_MS;
    }

    saveEnergy();
    renderEnergy();
    return true;
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function renderEnergy() {
    const value = document.getElementById('energyValue');
    const timer = document.getElementById('energyTimer');
    const timerRow = document.getElementById('energyTimerRow');
    const fill = document.getElementById('energyFill');

    const infiniteEnergy = TESTING_MODE.enabled && TESTING_MODE.infiniteEnergyInTest;
    value.textContent = infiniteEnergy ? '∞' : String(state.energy);
    fill.style.width = `${(state.energy / MAX_ENERGY) * 100}%`;

    if (infiniteEnergy || state.energy >= MAX_ENERGY) {
      timer.textContent = '';
      timerRow.hidden = true;
    } else {
      timer.textContent = formatCountdown(state.nextEnergyAt - Date.now());
      timerRow.hidden = false;
    }

    updateProducerReadiness();
  }

  function energyTick() {
    if (updateRegeneration(Date.now())) saveEnergy();
    renderEnergy();
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function showSaleToast(item, originalIndex) {
    const toast = document.getElementById('toast');
    toast.textContent = `Ürün ${DEFAULT_ITEM_SELL_PRICE} altına satıldı`;
    const undoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.textContent = 'Geri al';
    undoButton.addEventListener('click', undoLastSale, { once: true });
    toast.appendChild(undoButton);
    lastSale = { item, originalIndex };
    toast.classList.add('show', 'sale-toast');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show', 'sale-toast');
      lastSale = null;
    }, 4000);
  }

  function undoLastSale() {
    if (!lastSale) return;
    const targetIndex = state.cells[lastSale.originalIndex] === null
      ? lastSale.originalIndex
      : state.cells.findIndex((item) => item === null);
    if (targetIndex < 0) {
      showToast(TEXT.boardFull);
      return;
    }
    const economy = Progression.adjustEconomy({ coins: -DEFAULT_ITEM_SELL_PRICE });
    if (!economy) return;
    state.cells[targetIndex] = lastSale.item;
    if (!saveBoardState()) {
      state.cells[targetIndex] = null;
      Progression.adjustEconomy({ coins: DEFAULT_ITEM_SELL_PRICE });
      showToast('Geri alma tamamlanamadı');
      return;
    }
    lastSale = null;
    renderCell(targetIndex, 'spawned');
    renderEconomy();
    document.getElementById('toast').classList.remove('show', 'sale-toast');
    showToast('Satış geri alındı');
  }

  function itemName(chainId, level) {
    return DATA.chains[chainId]?.itemNames[level] || window.t(`item.football.lv${level}`);
  }

  function itemDescription(chainId, level) {
    if (level >= MAX_LEVEL) {
      return `${itemName(chainId, level)}, ${DATA.chains[chainId].name.toLocaleLowerCase('tr-TR')} içindeki en yüksek seviyedir.`;
    }
    return `İki ${itemName(chainId, level)} birleştirerek ${itemName(chainId, level + 1)} oluştur.`;
  }

  function selectCell(index) {
    if (selectedCellIndex >= 0) {
      cellElements[selectedCellIndex]?.classList.remove('item-selected');
    }
    selectedCellIndex = index;
    cellElements[index]?.classList.add('item-selected');
  }

  function highlightProducer(producerId) {
    const index = state.cells.findIndex(
      (item) => item?.type === 'producer' && item.producerId === producerId
    );
    if (index < 0) return;
    const cell = cellElements[index];
    window.clearTimeout(producerHighlightTimers.get(producerId));
    cell.classList.remove('source-highlight');
    void cell.offsetWidth;
    cell.classList.add('source-highlight');
    producerHighlightTimers.set(
      producerId,
      window.setTimeout(() => {
        cell.classList.remove('source-highlight');
        producerHighlightTimers.delete(producerId);
      }, 1350)
    );
  }

  function showItemInfo(level, index = selectedCellIndex, chainId = 'footballs') {
    const panel = document.getElementById('itemInfoPanel');
    const name = document.getElementById('itemInfoName');
    const description = document.getElementById('itemInfoDescription');
    const icon = document.getElementById('itemInfoIcon');
    const levelElement = document.getElementById('itemInfoLevel');
    const producerElement = document.getElementById('itemInfoProducer');
    const rarityElement = document.getElementById('itemInfoRarity');
    const nextElement = document.getElementById('itemInfoNext');
    const definition = DATA.items[level];
    document.getElementById('producerXpDebug').hidden = true;
    document.getElementById('itemInfoButton').hidden = false;
    document.getElementById('producerOutputChip').hidden = true;
    document.getElementById('productionModeControl').hidden = true;
    panel.classList.remove('is-producer');
    if (index >= 0) selectCell(index);
    highlightMergePartners(index, chainId, level);
    const producerId = DATA.chains[chainId].producerId;
    selectedInfo = { type: 'item', chainId, level, producerId };
    highlightProducer(producerId);

    clearTimeout(itemInfoTimer);
    if (
      selectedItemLevel === level &&
      selectedItemChainId === chainId &&
      selectedCellIndex === index &&
      panel.classList.contains('is-visible')
    ) return;

    function reveal() {
      selectedItemLevel = level;
      selectedItemChainId = chainId;
      name.textContent = itemName(chainId, level);
      description.textContent = itemDescription(chainId, level);
      icon.src = itemSource(chainId, level);
      icon.alt = itemName(chainId, level);
      levelElement.textContent = window.t('item.info.level').replace('{level}', String(level));
      producerElement.textContent = window.t('item.info.from').replace(
        '{producer}',
        DATA.producers[DATA.chains[chainId].producerId].name
      );
      rarityElement.textContent = DATA.chains[chainId].name;
      nextElement.textContent = definition.nextLevel
        ? window.t('item.info.next').replace('{item}', itemName(chainId, definition.nextLevel))
        : window.t('item.info.max');
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.remove('is-empty');
      panel.classList.add('is-visible');
    }

    const wasVisible = panel.classList.contains('is-visible');
    reveal();
    if (wasVisible) {
      panel.classList.remove('content-change');
      void panel.offsetWidth;
      panel.classList.add('content-change');
      itemInfoTimer = window.setTimeout(
        () => panel.classList.remove('content-change'),
        170
      );
    }
    updateControlCenter();
  }

  function showProducerInfo(index) {
    const panel = document.getElementById('itemInfoPanel');
    const producerId = state.cells[index]?.producerId || 'ball_basket';
    const producerState = Progression.getProducerState(producerId);
    const debugButton = document.getElementById('producerXpDebug');
    clearTimeout(itemInfoTimer);
    selectedItemLevel = null;
    selectedItemChainId = null;
    selectedInfo = { type: 'producer', producerId };
    selectCell(index);
    document.getElementById('itemInfoIcon').src = producerSource(producerId);
    document.getElementById('itemInfoIcon').alt = producerState.name;
    document.getElementById('itemInfoName').textContent = producerState.name;
    document.getElementById('itemInfoLevel').textContent =
      window.t('producer.progress.level').replace('{level}', String(producerState.level));
    document.getElementById('itemInfoDescription').textContent =
      DATA.producers[producerId].description;
    document.getElementById('itemInfoProducer').textContent = 'Üretici';
    document.getElementById('itemInfoRarity').textContent =
      state.energy >= PRODUCTION_COST ? 'Hazır' : 'Enerji gerekli';
    document.getElementById('itemInfoNext').textContent =
      'Üretmek için dokun. Taşımak için sürükle.';
    const producer = DATA.producers[producerId];
    const outputChip = document.getElementById('producerOutputChip');
    document.getElementById('producerOutputIcon').src = itemSource(producer.chainId, 1);
    document.getElementById('producerOutputIcon').alt = itemName(producer.chainId, 1);
    document.getElementById('producerOutputName').textContent = itemName(producer.chainId, 1);
    outputChip.hidden = false;
    renderProductionModeControl(producer.chainId);
    debugButton.hidden = true;
    document.getElementById('itemInfoButton').hidden = false;
    debugButton.textContent = window.t('producer.progress.debug_xp').replace(
      '{amount}',
      String(TESTING_MODE.producerXpIncrement)
    );
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-producer');
    panel.classList.remove('is-empty');
    panel.classList.add('is-visible');
    updateControlCenter();
  }

  function clearItemInfo() {
    clearTimeout(itemInfoTimer);
    selectedItemLevel = null;
    selectedItemChainId = null;
    selectedInfo = null;
    if (selectedCellIndex >= 0) {
      cellElements[selectedCellIndex]?.classList.remove('item-selected');
      selectedCellIndex = -1;
    }
    const panel = document.getElementById('itemInfoPanel');
    panel.classList.remove('is-producer');
    document.getElementById('itemInfoIcon').src = 'assets/icons/sports_bag.svg';
    document.getElementById('itemInfoIcon').alt = '';
    document.getElementById('itemInfoName').textContent = window.t('item.info.default_title');
    document.getElementById('itemInfoLevel').textContent = '';
    document.getElementById('itemInfoDescription').textContent =
      window.t('item.info.default_description');
    document.getElementById('itemInfoProducer').textContent = '';
    document.getElementById('itemInfoRarity').textContent = '';
    document.getElementById('itemInfoNext').textContent = '';
    document.getElementById('producerOutputChip').hidden = true;
    document.getElementById('productionModeControl').hidden = true;
    cellElements.forEach((cell) => cell.classList.remove('merge-partner-hint'));
    document.getElementById('producerXpDebug').hidden = true;
    document.getElementById('itemInfoButton').hidden = true;
    panel.classList.remove('is-empty', 'content-change');
    panel.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
    updateControlCenter();
  }

  function highlightMergePartners(selectedIndex, chainId, level) {
    cellElements.forEach((cell, index) => {
      const item = state.cells[index];
      cell.classList.toggle(
        'merge-partner-hint',
        index !== selectedIndex &&
        item?.type === 'ball' &&
        item.chainId === chainId &&
        item.level === level &&
        level < MAX_LEVEL
      );
    });
    window.setTimeout(
      () => cellElements.forEach((cell) => cell.classList.remove('merge-partner-hint')),
      900
    );
  }

  function detailImage(src, alt, className = '') {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    if (className) image.className = className;
    return image;
  }

  function detailHeading(kicker, title, levelText, imageSource) {
    const hero = document.createElement('header');
    hero.className = 'item-detail-hero';
    hero.appendChild(detailImage(imageSource, title, 'item-detail-hero-image'));
    const copy = document.createElement('div');
    const small = document.createElement('small');
    small.textContent = kicker;
    const heading = document.createElement('h2');
    heading.id = 'itemDetailTitle';
    heading.textContent = title;
    const badge = document.createElement('span');
    badge.textContent = levelText;
    copy.append(small, heading, badge);
    hero.appendChild(copy);
    return hero;
  }

  function producerLink(producerId) {
    const producer = DATA.producers[producerId];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item-detail-producer-link';
    button.appendChild(detailImage(producerSource(producerId), producer.name));
    const copy = document.createElement('span');
    const label = document.createElement('small');
    label.textContent = 'HANGİ ÜRETİCİDEN GELİR?';
    const name = document.createElement('strong');
    name.textContent = producer.name;
    copy.append(label, name);
    button.appendChild(copy);
    button.addEventListener('click', () => highlightProducer(producerId));
    return button;
  }

  function renderItemDetail() {
    if (!selectedInfo) return;
    const content = document.getElementById('itemDetailContent');
    content.innerHTML = '';

    if (selectedInfo.type === 'item') {
      const { chainId, level, producerId } = selectedInfo;
      content.appendChild(detailHeading(
        DATA.chains[chainId].name,
        itemName(chainId, level),
        `Seviye ${level}`,
        itemSource(chainId, level)
      ));
      const description = document.createElement('p');
      description.className = 'item-detail-description';
      description.textContent = itemDescription(chainId, level);
      const position = document.createElement('p');
      position.className = 'item-detail-position';
      position.textContent = `Zincirdeki yeri: ${level} / ${MAX_LEVEL}`;
      content.append(description, producerLink(producerId), position);
      return;
    }

    const producerId = selectedInfo.producerId;
    const producer = DATA.producers[producerId];
    const producerState = Progression.getProducerState(producerId);
    content.appendChild(detailHeading(
      'ÜRETİCİ',
      producer.name,
      `Seviye ${producerState.level}`,
      producerSource(producerId)
    ));
    const description = document.createElement('p');
    description.className = 'item-detail-description';
    description.textContent = producer.description;
    content.appendChild(description);
    const chain = document.createElement('div');
    chain.className = 'item-detail-chain';
    chain.setAttribute('aria-label', `${producer.name} ürün zinciri`);
    for (let level = 1; level <= MAX_LEVEL; level += 1) {
      const entry = document.createElement('article');
      entry.appendChild(detailImage(
        itemSource(producer.chainId, level),
        itemName(producer.chainId, level)
      ));
      const badge = document.createElement('small');
      badge.textContent = `SV. ${level}`;
      const name = document.createElement('strong');
      name.textContent = itemName(producer.chainId, level);
      entry.append(badge, name);
      chain.appendChild(entry);
    }
    content.appendChild(chain);
  }

  function openItemDetail() {
    if (!selectedInfo) return;
    renderItemDetail();
    document.getElementById('itemDetailOverlay').hidden = false;
    document.body.classList.add('item-detail-open');
  }

  function closeItemDetail() {
    document.getElementById('itemDetailOverlay').hidden = true;
    document.body.classList.remove('item-detail-open');
  }

  function normalizeSavedItem(item, allowProducer = true) {
    if (allowProducer && item?.type === 'producer' && DATA.producers[item.producerId]) {
      return { type: 'producer', producerId: item.producerId };
    }
    if (item?.type === 'ball' && DATA.chains[item.chainId || 'footballs']) {
      return {
        type: 'ball',
        chainId: item.chainId || 'footballs',
        level: Math.max(1, Math.min(MAX_LEVEL, Number(item.level) || 1))
      };
    }
    return null;
  }

  function saveBoardState() {
    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify({
        version: 3,
        cells: state.cells,
        storageCapacity: state.storageCapacity,
        storage: state.storage,
        selectedProductionEnergy: state.selectedProductionEnergy
      }));
      scheduleSpecialOrderCheck();
      return true;
    } catch (error) {
      console.warn('Board kaydı yazılamadı.', error);
      return false;
    }
  }

  function scheduleSpecialOrderCheck() {
    if (specialOrderCheckScheduled) return;
    specialOrderCheckScheduled = true;
    queueMicrotask(() => {
      specialOrderCheckScheduled = false;
      let created = false;
      Object.keys(DATA.chains).forEach((chainId) => {
        const maxLevel = ProductionRules.maxLevelForChain(chainId);
        const boardCount = state.cells.reduce(
          (total, item) => total + Number(
            item?.type === 'ball' &&
            item.chainId === chainId &&
            item.level === maxLevel
          ),
          0
        );
        const storageCount = state.storage.reduce(
          (total, item) => total + Number(
            item?.type === 'ball' &&
            item.chainId === chainId &&
            item.level === maxLevel
          ),
          0
        );
        const count = boardCount + storageCount;
        if (count >= DATA.specialOrders.maxItemRequiredCount) {
          created = Progression.queueMaxItemSpecialOrder(chainId, maxLevel) || created;
        }
      });
      if (created) renderOrders();
    });
  }

  function loadBoardState() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(BOARD_STORAGE_KEY));
    } catch (error) {
      console.warn('Board kaydı okunamadı; güvenli başlangıç kullanılacak.', error);
    }
    if (Array.isArray(saved?.cells) && saved.cells.length === CELL_COUNT) {
      state.cells = saved.cells.map((item) => normalizeSavedItem(item, true));
    }
    state.storageCapacity = Math.max(
      INITIAL_STORAGE_CAPACITY,
      Math.floor(Number(saved?.storageCapacity) || INITIAL_STORAGE_CAPACITY)
    );
    state.storage = Array.from(
      { length: state.storageCapacity },
      (_, index) => normalizeSavedItem(saved?.storage?.[index], false)
    );
    state.selectedProductionEnergy = PRODUCTION_ENERGY_OPTIONS.includes(
      Number(saved?.selectedProductionEnergy)
    )
      ? Number(saved.selectedProductionEnergy)
      : DEFAULT_PRODUCTION_ENERGY;

    const presentProducerIds = new Set(
      state.cells
        .filter((item) => item?.type === 'producer')
        .map((item) => item.producerId)
    );
    PRODUCER_STARTS.forEach(({ index: preferredIndex, producerId }) => {
      if (presentProducerIds.has(producerId)) return;
      const targetIndex = state.cells[preferredIndex] === null
        ? preferredIndex
        : state.cells.findIndex((item) => item === null);
      if (targetIndex < 0) {
        console.warn(`Board dolu olduğu için ${producerId} migration sırasında eklenemedi.`);
        return;
      }
      state.cells[targetIndex] = { type: 'producer', producerId };
      presentProducerIds.add(producerId);
    });
    saveBoardState();
  }

  function createBoard() {
    boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    cellElements = [];

    for (let index = 0; index < CELL_COUNT; index += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = String(index);
      cell.tabIndex = 0;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', TEXT.emptyCell);
      cell.addEventListener('pointerdown', beginPointer);
      boardElement.appendChild(cell);
      cellElements.push(cell);
    }

    createMergeSparkPool();
    loadBoardState();
    state.cells.forEach((item, index) => {
      if (item) renderCell(index);
    });
  }

  function itemVisualScale(chainId, level) {
    const scaleByChain = {
      footballs: [1, 1.04, 1.02, 1.02, 1.02, 1.02, 1],
      equipment: [1, 1.13, 1.09, 1.08, 1.06, 1.08, 1],
      training: [1, 1.06, 1.07, 1.12, 1.08, 1.08, 1],
      trophies: [1, 1.12, 1.08, 1.07, 1.06, 1, 1]
    };
    return scaleByChain[chainId]?.[level] || 1;
  }

  function renderCell(index, animationClass) {
    scheduleOrderReadinessUpdate();
    const cell = cellElements[index];
    const item = state.cells[index];
    cell.className = 'cell';
    cell.innerHTML = '';

    if (!item) {
      cell.setAttribute('aria-label', TEXT.emptyCell);
      return;
    }

    cell.classList.add('occupied');
    if (animationClass) {
      void cell.offsetWidth;
      cell.classList.add(animationClass);
    }

    if (item.type === 'producer') {
      cell.classList.add('producer-cell');
      const producerState = Progression.getProducerState(item.producerId);
      cell.dataset.producerId = item.producerId;
      cell.setAttribute('aria-label', producerState.name);
      const producerWrapper = document.createElement('div');
      producerWrapper.className = 'producer-wrap';
      producerWrapper.appendChild(createItemShadow());

      const producerImage = document.createElement('img');
      producerImage.className = 'producer-image';
      producerImage.src = producerSource(item.producerId);
      producerImage.alt = '';
      producerImage.draggable = false;
      producerImage.setAttribute('aria-hidden', 'true');
      producerImage.addEventListener('pointerdown', beginProducerPointer);
      producerWrapper.appendChild(producerImage);
      cell.appendChild(producerWrapper);
      const energyBadge = document.createElement('span');
      energyBadge.className = 'producer-energy-badge';
      const energyIcon = document.createElement('img');
      energyIcon.src = DATA.uiIcons.producerEnergy;
      energyIcon.alt = '';
      energyBadge.appendChild(energyIcon);
      energyBadge.setAttribute('aria-hidden', 'true');
      cell.appendChild(energyBadge);
      if (index === selectedCellIndex) cell.classList.add('item-selected');
      updateProducerReadiness();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'ball-wrap';
    wrapper.style.background = 'transparent';
    wrapper.style.setProperty(
      '--item-visual-scale',
      String(itemVisualScale(item.chainId, item.level))
    );
    wrapper.appendChild(createItemShadow());

    const image = document.createElement('img');
    image.className = 'ball';
    image.src = itemSource(item.chainId, item.level);
    image.alt = itemName(item.chainId, item.level);
    image.draggable = false;
    image.style.background = 'transparent';
    image.style.objectFit = 'contain';
    wrapper.appendChild(image);
    cell.appendChild(wrapper);
    if (index === selectedCellIndex) cell.classList.add('item-selected');
    cell.setAttribute('aria-label', itemName(item.chainId, item.level));
  }

  function updateProducerReadiness() {
    cellElements.forEach((producerCell, index) => {
      const item = state.cells[index];
      if (item?.type !== 'producer') return;
      const energyReady =
        state.energy >= PRODUCTION_COST;
      producerCell.classList.toggle('ready', energyReady);
    });
  }

  function renderPlayerProgression() {
    const academyState = Academy.getState();
    const requiredXp = Math.max(1, Number(academyState.xpToNext) || 1);
    const levelValue = document.getElementById('playerLevelValue');
    const xpValue = document.getElementById('xpValue');
    const xpRing = document.getElementById('playerXpRing');

    levelValue.textContent = String(academyState.level);
    xpValue.textContent = academyState.completed
      ? 'TAMAMLANDI'
      : `${academyState.xp} / ${requiredXp} XP`;
    xpRing.style.setProperty('--xp-progress', String(academyState.progress));
    document.querySelector('.player-level-card')?.setAttribute(
      'aria-label',
      `Football Academy seviye ${academyState.level}`
    );
  }

  function renderAcademyWorld() {
    const academyState = Academy.getState();
    const world = document.getElementById('academyWorld');
    if (!world) return;

    const appliedRenovations = Academy.FOOTBALL_RENOVATIONS.slice(
      0,
      Math.max(0, academyState.appliedLevel - 1)
    );
    const zones = ['pitch', 'stands', 'clubhouse', 'fitness', 'paths', 'landscape', 'lighting'];
    zones.forEach((zone) => {
      const zoneSteps = Academy.FOOTBALL_RENOVATIONS.filter(
        (renovation) => renovation.zone === zone
      );
      const completeSteps = appliedRenovations.filter(
        (renovation) => renovation.zone === zone
      );
      const progress = zoneSteps.length ? completeSteps.length / zoneSteps.length : 0;
      world.style.setProperty(`--${zone}-progress`, String(progress));
      world.dataset[zone] = String(completeSteps.length);
    });
    world.dataset.level = String(academyState.appliedLevel);
    world.classList.toggle('academy-completed', academyState.completed);
    document.body.classList.toggle('football-academy-completed', academyState.completed);
  }

  function closeSportsCampus() {
    const academyState = Academy.getState();
    if (academyState.pendingRenovations > 0) return;
    document.getElementById('sportsCampusOverlay').hidden = true;
    document.body.classList.remove('campus-open');
  }

  function showCampusMap() {
    document.querySelector('.sports-campus-screen').hidden = false;
    document.getElementById('footballRenovationScreen').hidden = true;
  }

  function renderCampusMap() {
    const academyState = Academy.getState();
    const grid = document.getElementById('campusAcademyGrid');
    const closeButton = document.getElementById('campusCloseButton');
    document.getElementById('campusLevelValue').textContent = String(academyState.level);
    document.getElementById('campusProgressText').textContent = academyState.completed
      ? 'Football Academy tamamlandı • Basketball Academy açıldı'
      : `Football Academy • ${academyState.appliedLevel} / ${academyState.maxLevel}`;
    closeButton.hidden = academyState.pendingRenovations > 0;
    grid.innerHTML = '';

    Academy.getAcademies().forEach((academy) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `campus-academy-card is-${academy.status}`;
      button.dataset.academyId = academy.id;
      button.disabled = academy.status === 'locked';
      button.innerHTML =
        `<span class="campus-academy-art campus-art-${academy.theme}" aria-hidden="true">` +
          `<span class="campus-academy-icon">${academy.icon}</span>` +
          `<span class="campus-facility-shape"></span>` +
        `</span>` +
        `<span class="campus-academy-copy">` +
          `<small>${academy.status === 'completed' ? 'TAMAMLANDI' : academy.status === 'active' ? 'AKTİF AKADEMİ' : academy.status === 'available' ? 'YENİ AKADEMİ' : 'KİLİTLİ'}</small>` +
          `<strong>${academy.name}</strong>` +
          `<span>${academy.description}</span>` +
        `</span>` +
        `<span class="campus-card-status" aria-hidden="true">${academy.status === 'completed' ? '✓' : academy.status === 'locked' ? '🔒' : '›'}</span>` +
        (academy.id === 'football'
          ? `<span class="campus-card-progress"><i style="width:${Math.round(academy.progress * 100)}%"></i></span>`
          : '');
      button.addEventListener('click', () => {
        if (academy.id === 'football') {
          renderFootballRenovation();
        } else if (academy.status === 'available') {
          Academy.setActiveAcademy(academy.id);
          showToast('Basketball Academy bir sonraki spor yolculuğuna hazır');
        } else {
          showToast('Önce mevcut akademiyi tamamla');
        }
      });
      grid.appendChild(button);
    });
  }

  function renderFootballRenovation() {
    const academyState = Academy.getState();
    const renovation = academyState.nextRenovation;
    const actionPanel = document.getElementById('renovationActionPanel');
    const actionButton = document.getElementById('renovationActionButton');
    const facilityStrip = document.getElementById('facilityProgressStrip');
    document.querySelector('.sports-campus-screen').hidden = true;
    document.getElementById('footballRenovationScreen').hidden = false;
    const campusVisual = document.getElementById('footballCampusVisual');
    campusVisual.dataset.stage = String(academyState.appliedLevel);
    Array.from(campusVisual.classList)
      .filter((className) => className.startsWith('renovation-step-'))
      .forEach((className) => campusVisual.classList.remove(className));
    Academy.FOOTBALL_RENOVATIONS
      .slice(0, Math.max(0, academyState.appliedLevel - 1))
      .forEach((step) => campusVisual.classList.add(`renovation-step-${step.id}`));
    document.getElementById('renovationLevelValue').textContent =
      `${academyState.appliedLevel} / ${academyState.maxLevel}`;
    facilityStrip.innerHTML = academyState.facilityProgress.map((facility) =>
      `<span class="facility-progress-item is-${facility.status}">` +
        `<i aria-hidden="true">${facility.status === 'completed' ? '✓' : facility.completed + 1}</i>` +
        `<span><strong>${facility.name}</strong><small>${facility.completed}/${facility.total}</small></span>` +
      `</span>`
    ).join('');

    if (academyState.completed) {
      document.getElementById('footballRenovationSubtitle').textContent =
        'Dünya standartlarında, yaşayan ve ışıl ışıl bir futbol akademisi.';
      document.getElementById('renovationActionIcon').textContent = '🏆';
      document.getElementById('renovationActionKicker').textContent = 'AKADEMİ TAMAMLANDI';
      document.getElementById('renovationActionTitle').textContent = 'Şampiyonların evi hazır';
      document.getElementById('renovationActionDescription').textContent =
        'Basketball Academy artık Spor Kampüsü ekranında açıldı.';
      actionButton.innerHTML = '<span>Spor Kampüsüne dön</span><small>Yeni akademiyi gör</small>';
      actionButton.onclick = () => {
        renderCampusMap();
        showCampusMap();
      };
      actionPanel.classList.add('is-complete');
      return;
    }

    actionPanel.classList.remove('is-complete');
    document.getElementById('footballRenovationSubtitle').textContent =
      renovation
        ? 'Yeni seviyeni tek, anlamlı bir kampüs geliştirmesine dönüştür.'
        : 'Siparişleri tamamla, XP kazan ve sıradaki yenilemeyi aç.';
    document.getElementById('renovationActionIcon').textContent = renovation?.icon || '⭐';
    document.getElementById('renovationActionKicker').textContent = renovation
      ? `${renovation.facility.toUpperCase()} • SEVİYE ${renovation.level}`
      : 'SIRADAKİ GELİŞTİRME KİLİTLİ';
    document.getElementById('renovationActionTitle').textContent =
      renovation?.title || `Seviye ${academyState.level + 1}'e ulaş`;
    document.getElementById('renovationActionDescription').textContent =
      renovation?.description || 'Yeni bir sipariş tamamlayarak akademi XP’si kazan.';
    actionButton.disabled = !renovation;
    actionButton.innerHTML = renovation
      ? '<span>Geliştirmeyi yap</span><small>Tek kampüs yenilemesi</small>'
      : '<span>Henüz hazır değil</span><small>Oyuna dön ve XP kazan</small>';
    actionButton.onclick = renovation
      ? () => {
          const result = Academy.applyNextRenovation();
          if (!result) return;
          document.getElementById('footballCampusVisual').classList.add('is-renovating');
          window.setTimeout(() => {
            document.getElementById('footballCampusVisual').classList.remove('is-renovating');
            renderAcademyWorld();
            renderPlayerProgression();
            showToast(`${result.renovation.title} tamamlandı`);
            renderFootballRenovation();
          }, 420);
        }
      : () => closeSportsCampus();
  }

  function openSportsCampus(openRenovation = false) {
    renderCampusMap();
    const overlay = document.getElementById('sportsCampusOverlay');
    overlay.hidden = false;
    document.body.classList.add('campus-open');
    if (openRenovation) renderFootballRenovation();
    else showCampusMap();
  }

  function handleAcademyProgress(academyProgress) {
    renderAcademyWorld();
    renderPlayerProgression();
    if (!academyProgress?.levelUps?.length) return;
    window.setTimeout(() => openSportsCampus(false), 180);
  }

  function renderEconomy() {
    const economy = Progression.getEconomy();
    document.getElementById('coinValue').textContent = String(economy.coins);
    document.getElementById('gemValue').textContent = String(economy.gems);
    document.getElementById('eventValue').textContent = String(economy.eventPoints);
    renderPlayerProgression();
  }

  function findOrderItem(chainId, level) {
    return state.cells.findIndex(
      (item, index) =>
        item?.type === 'ball' &&
        item.chainId === chainId &&
        item.level === level &&
        !cellElements[index]?.classList.contains('merge-resolving')
    );
  }

  function orderRequirements(order) {
    const source = Array.isArray(order?.items) && order.items.length
      ? order.items
      : [{ chainId: order?.chainId || 'footballs', level: order?.level, quantity: order?.quantity }];
    const quantitiesByItem = new Map();

    source.forEach((requirement) => {
      const chainId = DATA.chains[requirement?.chainId]
        ? requirement.chainId
        : 'footballs';
      const level = Math.max(
        1,
        Math.min(MAX_LEVEL, Number(requirement?.level) || 1)
      );
      const quantity = Math.max(1, Math.floor(Number(requirement?.quantity) || 1));
      const key = `${chainId}:${level}`;
      const current = quantitiesByItem.get(key);
      quantitiesByItem.set(key, {
        chainId,
        level,
        quantity: (current?.quantity || 0) + quantity
      });
    });

    return Array.from(quantitiesByItem.values());
  }

  function boardItemCount(chainId, level) {
    return state.cells.reduce(
      (count, item, index) =>
        count + Number(
          item?.type === 'ball' &&
          item.chainId === chainId &&
          item.level === level &&
          !cellElements[index]?.classList.contains('merge-resolving')
        ),
      0
    );
  }

  function totalItemCount(chainId, level) {
    return boardItemCount(chainId, level) + state.storage.reduce(
      (count, item) =>
        count + Number(
          item?.type === 'ball' &&
          item.chainId === chainId &&
          item.level === level
        ),
      0
    );
  }

  function analyzeOrderReadiness(order) {
    const requirements = orderRequirements(order).map((requirement) => ({
      ...requirement,
      available: order.special
        ? totalItemCount(requirement.chainId, requirement.level)
        : boardItemCount(requirement.chainId, requirement.level)
    }));
    const availableItems = requirements.reduce(
      (total, requirement) =>
        total + Math.min(requirement.available, requirement.quantity),
      0
    );
    return {
      requirements,
      partial: availableItems > 0,
      full:
        requirements.length > 0 &&
        requirements.every(
          (requirement) => requirement.available >= requirement.quantity
        )
    };
  }

  function updateOrderReadiness() {
    const orders = Progression.getOrders();
    const boardHighlights = new Map();
    const ordersStrip = document.getElementById('ordersStrip');
    let newlyReadyOrder = false;

    document.querySelectorAll('.order-card').forEach((card) => {
      const orderIndex = Number(card.dataset.orderIndex);
      const order = orders[orderIndex];
      const presenting = card.classList.contains('order-presenting');
      const readiness = order && !presenting
        ? analyzeOrderReadiness(order)
        : { requirements: [], partial: false, full: false };
      card.classList.toggle('order-partial', readiness.partial && !readiness.full);
      card.classList.toggle('order-ready', readiness.full);
      if (readiness.full && card.dataset.wasReady !== 'true') {
        newlyReadyOrder = true;
      }
      card.dataset.wasReady = readiness.full ? 'true' : 'false';
      card.style.order = readiness.full ? '0' : '1';
      card.dataset.readiness = readiness.full
        ? 'full'
        : readiness.partial
          ? 'partial'
          : 'none';

      card.querySelectorAll('.order-item-chip').forEach((chip) => {
        const requirement = readiness.requirements.find(
          (candidate) =>
            candidate.chainId === chip.dataset.chainId &&
            candidate.level === Number(chip.dataset.level)
        );
        const itemReady = Boolean(requirement?.available);
        chip.classList.toggle(
          'item-partial',
          readiness.partial && !readiness.full && itemReady
        );
        chip.classList.toggle('item-ready', readiness.full && itemReady);
      });

      const deliverButton = card.querySelector('.order-deliver-button');
      if (deliverButton) {
        deliverButton.hidden = !readiness.full;
        deliverButton.disabled = !readiness.full;
      }

      readiness.requirements.forEach((requirement) => {
        if (!requirement.available) return;
        const key = `${requirement.chainId}:${requirement.level}`;
        const current = boardHighlights.get(key);
        if (readiness.full || current !== 'full') {
          boardHighlights.set(
            key,
            readiness.full ? 'full' : 'partial'
          );
        }
      });
    });

    if (newlyReadyOrder && ordersStrip) {
      ordersStrip.scrollLeft = 0;
      updateOrdersScrollProgress();
    }

    cellElements.forEach((cell, index) => {
      const item = state.cells[index];
      const highlight = item?.type === 'ball'
        ? boardHighlights.get(`${item.chainId}:${item.level}`)
        : null;
      cell.classList.toggle('order-match-partial', highlight === 'partial');
      cell.classList.toggle('order-match', highlight === 'full');
    });
  }

  function scheduleOrderReadinessUpdate() {
    if (orderReadinessScheduled) return;
    orderReadinessScheduled = true;
    queueMicrotask(() => {
      orderReadinessScheduled = false;
      updateOrderReadiness();
    });
  }

  function fulfillReadyOrder(orderIndex) {
    const card = document.querySelector(
      `.order-card[data-order-index="${orderIndex}"]`
    );
    const order = Progression.getOrders()[orderIndex];
    if (!card || !order || card.classList.contains('order-presenting')) return;

    const readiness = analyzeOrderReadiness(order);
    if (!readiness.full) {
      scheduleOrderReadinessUpdate();
      return;
    }

    if (order.special) {
      fulfillSpecialOrder(orderIndex, order, readiness, card);
      return;
    }

    const firstRequirement = readiness.requirements[0];
    const fromIndex = findOrderItem(firstRequirement.chainId, firstRequirement.level);
    if (fromIndex < 0) {
      scheduleOrderReadinessUpdate();
      return;
    }

    const sourceCell = cellElements[fromIndex];
    const sourceRect = sourceCell.getBoundingClientRect();
    const deliveryGhost = createGhost(
      state.cells[fromIndex],
      sourceRect.left + sourceRect.width / 2,
      sourceRect.top + sourceRect.height / 2
    );
    tryFulfillOrder(fromIndex, orderIndex, deliveryGhost);
  }

  function fulfillSpecialOrder(orderIndex, order, readiness, card) {
    const requirement = readiness.requirements[0];
    const boardMatches = state.cells
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        item?.type === 'ball' &&
        item.chainId === requirement.chainId &&
        item.level === requirement.level
      )
      .slice(0, requirement.quantity);
    const neededFromStorage = requirement.quantity - boardMatches.length;
    const storageMatches = state.storage
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        item?.type === 'ball' &&
        item.chainId === requirement.chainId &&
        item.level === requirement.level
      )
      .slice(0, neededFromStorage);
    if (boardMatches.length + storageMatches.length !== requirement.quantity) return;
    const deliveredItems = Array.from(
      { length: requirement.quantity },
      () => ({ chainId: requirement.chainId, level: requirement.level })
    );
    const completed = Progression.fulfillOrder(orderIndex, deliveredItems);
    if (!completed) return;
    boardMatches.forEach(({ index }) => {
      state.cells[index] = null;
      renderCell(index);
    });
    storageMatches.forEach(({ index }) => {
      state.storage[index] = null;
    });
    saveBoardState();
    renderStorage();
    renderEconomy();
    const academyProgress = Academy.addXp(completed.rewards.xp);
    playProducerUpgrade(completed.producerProgress);
    handleAcademyProgress(academyProgress);
    card.classList.add('order-presenting', 'order-complete');
    GameAudio.play('reward');
    showToast('Özel sipariş tamamlandı · +1 elmas');
    window.setTimeout(() => renderOrderSlot(orderIndex), ORDER_CARD_RESOLVE_MS);
  }

  function collectOrderItemIndices(readiness, preferredIndex = -1) {
    const collected = [];

    readiness.requirements.forEach((requirement) => {
      const matches = state.cells
        .map((item, index) => ({ item, index }))
        .filter(
          ({ item, index }) =>
            item?.type === 'ball' &&
            item.chainId === requirement.chainId &&
            item.level === requirement.level &&
            !collected.includes(index) &&
            !cellElements[index]?.classList.contains('merge-resolving')
        )
        .map(({ index }) => index);

      if (matches.includes(preferredIndex)) {
        matches.splice(matches.indexOf(preferredIndex), 1);
        matches.unshift(preferredIndex);
      }
      collected.push(...matches.slice(0, requirement.quantity));
    });

    return collected;
  }

  function createCustomerPortrait(order, index) {
    const customerKeys = ['coach', 'captain', 'scout'];
    const customerKey = order.customerId || customerKeys[index % customerKeys.length];
    const portraitSources = {
      coach: 'assets/UI/Customers/customer_coach.png',
      captain: 'assets/UI/Customers/customer_player.png',
      scout: 'assets/UI/Customers/customer_scout.png'
    };
    const portrait = document.createElement('div');
    portrait.className = `customer-portrait customer-${customerKey}`;
    portrait.dataset.customer = customerKey;
    portrait.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = portraitSources[customerKey] || portraitSources.coach;
    image.alt = '';
    image.draggable = false;
    portrait.appendChild(image);
    return portrait;
  }

  function customerName(order, index) {
    const customerKeys = ['coach', 'captain', 'scout'];
    const customerKey = order.customerId || customerKeys[index % customerKeys.length];
    return {
      coach: 'Koç Emre',
      captain: 'Maya',
      scout: 'Derya'
    }[customerKey];
  }

  function createOrderCard(order, index) {
    const card = document.createElement('article');
    card.className = 'order-card';
    card.dataset.orderIndex = String(index);
    if (order.special) {
      card.classList.add('special-order');
      const badge = document.createElement('span');
      badge.className = 'special-order-badge';
      badge.textContent = '+1 ◆';
      card.appendChild(badge);
    }
    card.appendChild(createCustomerPortrait(order, index));

    const requirements = orderRequirements(order);
    if (requirements.length > 1) card.classList.add('multi-requirement');

    const customer = document.createElement('strong');
    customer.className = 'order-customer-name';
    customer.textContent = customerName(order, index);
    card.appendChild(customer);

    const items = document.createElement('div');
    items.className = 'order-items';
    if (requirements.length > 1) items.classList.add('multi-item');

    requirements.forEach((requirement) => {
      const chip = document.createElement('span');
      chip.className = 'order-item-chip';
      chip.dataset.chainId = requirement.chainId;
      chip.dataset.level = String(requirement.level);

      const image = document.createElement('img');
      image.src = itemSource(requirement.chainId, requirement.level);
      image.alt = itemName(requirement.chainId, requirement.level);
      chip.appendChild(image);

      if (requirement.quantity > 1) {
        const itemQuantity = document.createElement('small');
        itemQuantity.className = 'order-item-quantity';
        itemQuantity.textContent = `×${requirement.quantity}`;
        chip.appendChild(itemQuantity);
      }
      items.appendChild(chip);
    });
    card.appendChild(items);

    const quantity = document.createElement('strong');
    quantity.className = 'order-quantity';
    quantity.textContent = `×${requirements[0].quantity}`;
    quantity.hidden = requirements.length > 1;
    card.appendChild(quantity);

    const rewards = document.createElement('span');
    rewards.className = 'order-rewards';
    rewards.innerHTML =
      `<span class="order-reward order-reward-coins">` +
        `<i aria-hidden="true"></i><strong>${order.rewards.coins}</strong>` +
      `</span>` +
      `<span class="order-reward order-reward-xp">` +
        `<i aria-hidden="true">★</i><strong>${order.rewards.xp}</strong>` +
      `</span>`;
    card.appendChild(rewards);

    const deliverButton = document.createElement('button');
    deliverButton.className = 'order-deliver-button';
    deliverButton.type = 'button';
    deliverButton.textContent = '✓';
    deliverButton.hidden = true;
    deliverButton.disabled = true;
    deliverButton.setAttribute('aria-label', 'Siparişi teslim et');
    deliverButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    deliverButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearItemInfo();
      fulfillReadyOrder(index);
    });
    card.appendChild(deliverButton);

    card.setAttribute(
      'aria-label',
      requirements
        .map(
          (requirement) =>
            `${itemName(requirement.chainId, requirement.level)}, ` +
            `${window.t('orders.quantity')} ${requirement.quantity}`
        )
        .join('; ')
    );
    return card;
  }

  function updateOrdersScrollProgress() {
    const root = document.getElementById('ordersStrip');
    const thumb = document.getElementById('ordersScrollThumb');
    if (!root || !thumb) return;
    const maximum = Math.max(0, root.scrollWidth - root.clientWidth);
    const progress = maximum ? root.scrollLeft / maximum : 0;
    thumb.style.setProperty('--orders-progress-x', `${progress * 100}%`);
  }

  function renderOrders() {
    const root = document.getElementById('ordersStrip');
    const previousScrollLeft = root.scrollLeft;
    root.innerHTML = '';
    Progression.getOrders().forEach((order, index) => {
      root.appendChild(createOrderCard(order, index));
    });
    requestAnimationFrame(() => {
      root.scrollLeft = Math.min(
        previousScrollLeft,
        Math.max(0, root.scrollWidth - root.clientWidth)
      );
      updateOrdersScrollProgress();
    });
    scheduleOrderReadinessUpdate();
  }

  function renderOrderSlot(index) {
    const root = document.getElementById('ordersStrip');
    const currentCard = root.querySelector(
      `.order-card[data-order-index="${index}"]`
    );
    const nextOrder = Progression.getOrders()[index];
    if (!currentCard || !nextOrder) {
      renderOrders();
      return;
    }

    const nextCard = createOrderCard(nextOrder, index);
    nextCard.classList.add('order-entering');
    currentCard.replaceWith(nextCard);
    window.setTimeout(() => nextCard.classList.remove('order-entering'), 260);
    updateOrdersScrollProgress();
    scheduleOrderReadinessUpdate();
  }

  function setupOrdersStripInteraction() {
    const root = document.getElementById('ordersStrip');
    if (!root) return;
    let pointerState = null;

    root.addEventListener('scroll', updateOrdersScrollProgress, { passive: true });
    root.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      root.scrollLeft += event.deltaY;
      event.preventDefault();
    }, { passive: false });

    root.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('.order-deliver-button')) return;
      pointerState = {
        id: event.pointerId,
        startX: event.clientX,
        startScroll: root.scrollLeft,
        moved: false
      };
      root.setPointerCapture?.(event.pointerId);
    });

    root.addEventListener('pointermove', (event) => {
      if (!pointerState || pointerState.id !== event.pointerId) return;
      const distance = event.clientX - pointerState.startX;
      if (!pointerState.moved && Math.abs(distance) < 8) return;
      pointerState.moved = true;
      root.classList.add('is-dragging');
      root.scrollLeft = pointerState.startScroll - distance;
      event.preventDefault();
    });

    const finishPointer = (event) => {
      if (!pointerState || pointerState.id !== event.pointerId) return;
      root.releasePointerCapture?.(event.pointerId);
      root.classList.remove('is-dragging');
      pointerState = null;
    };
    root.addEventListener('pointerup', finishPointer);
    root.addEventListener('pointercancel', finishPointer);
    window.addEventListener('resize', updateOrdersScrollProgress);
    updateOrdersScrollProgress();
  }

  function animateCounterValue(target, endValue) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startValue = Number.parseInt(target.textContent, 10) || 0;
    const finalValue = Math.max(0, Math.floor(Number(endValue) || 0));
    const activeAnimation = counterAnimations.get(target.id);
    if (activeAnimation) cancelAnimationFrame(activeAnimation.frame);

    if (reducedMotion || startValue === finalValue) {
      target.textContent = String(finalValue);
      counterAnimations.delete(target.id);
      return;
    }

    const duration = Math.min(360, Math.max(210, Math.abs(finalValue - startValue) * 7));
    const startedAt = performance.now();
    const animation = { frame: 0, target: finalValue };
    counterAnimations.set(target.id, animation);

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      target.textContent = String(
        Math.round(startValue + (finalValue - startValue) * eased)
      );
      if (progress < 1 && counterAnimations.get(target.id) === animation) {
        animation.frame = requestAnimationFrame(tick);
      } else {
        target.textContent = String(finalValue);
        if (counterAnimations.get(target.id) === animation) {
          counterAnimations.delete(target.id);
        }
      }
    };
    animation.frame = requestAnimationFrame(tick);
  }

  function pulseRewardCounter(targetId, displayedValue) {
    const target = document.getElementById(targetId);
    const pill = target?.closest('.hud-capsule, .resource-pill, .player-level-card');
    if (!target || !pill) return;

    const economy = Progression.getEconomy();
    const economyKey = {
      coinValue: 'coins',
      xpValue: 'xp',
      gemValue: 'gems',
      eventValue: 'eventPoints'
    }[targetId];
    const resolvedValue = displayedValue ?? economy[economyKey];
    if (targetId === 'coinValue') animateCounterValue(target, resolvedValue);
    else if (targetId === 'xpValue') renderPlayerProgression();
    else target.textContent = String(resolvedValue);
    pill.classList.remove('reward-received');
    void pill.offsetWidth;
    pill.classList.add('reward-received');
    window.setTimeout(
      () => pill.classList.remove('reward-received'),
      ORDER_COUNTER_PULSE_MS
    );
  }

  function playRewardFlights(orderCard, rewards, rewardTotals, onXpArrive) {
    const sourceRect = orderCard.getBoundingClientRect();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [
      ['coins', 'coinValue', '●'],
      ['xp', 'xpValue', '★'],
      ['gems', 'gemValue', '◆'],
      ['eventPoints', 'eventValue', '⚑']
    ];

    targets.forEach(([rewardKey, targetId, symbol], index) => {
      if (!rewards[rewardKey]) return;
      const target = document.getElementById(targetId);
      if (!target || target.hidden) return;
      if (reducedMotion) {
        pulseRewardCounter(targetId, rewardTotals[rewardKey]);
        if (rewardKey === 'xp') onXpArrive?.();
        return;
      }
      const targetRect = target.getBoundingClientRect();
      const flight = document.createElement('span');
      flight.className = `reward-flight reward-${rewardKey}`;
      flight.innerHTML =
        `<span class="reward-flight-symbol">${symbol}</span>` +
        `<strong>+${rewards[rewardKey]}</strong>`;
      flight.setAttribute('aria-hidden', 'true');
      flight.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
      flight.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
      flight.style.setProperty('--reward-x', `${targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)}px`);
      flight.style.setProperty('--reward-y', `${targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)}px`);
      const rewardDelay = ORDER_REWARD_START_MS + index * 40;
      flight.style.setProperty('--reward-delay', `${rewardDelay}ms`);
      document.body.appendChild(flight);
      window.setTimeout(() => {
        pulseRewardCounter(targetId, rewardTotals[rewardKey]);
        if (rewardKey === 'xp') onXpArrive?.();
      }, rewardDelay + ORDER_REWARD_FLIGHT_MS - 35);
      window.setTimeout(
        () => flight.remove(),
        rewardDelay + ORDER_REWARD_FLIGHT_MS + 40
      );
    });
  }

  function playOrderDelivery(ghost, card, chainId, itemLevel, sequenceIndex = 0) {
    if (!ghost) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ghost.remove();
      return;
    }
    const image = card.querySelector(
      `.order-item-chip[data-chain-id="${chainId}"][data-level="${itemLevel}"] img`
    );
    const imageRect = image?.getBoundingClientRect() || card.getBoundingClientRect();
    const ghostX = Number.parseFloat(ghost.style.left);
    const ghostY = Number.parseFloat(ghost.style.top);
    ghost.style.setProperty(
      '--order-delivery-x',
      `${imageRect.left + imageRect.width / 2 - ghostX}px`
    );
    ghost.style.setProperty(
      '--order-delivery-y',
      `${imageRect.top + imageRect.height / 2 - ghostY}px`
    );
    ghost.style.setProperty('--drag-tilt', '0deg');
    ghost.style.animationDelay = `${sequenceIndex * 90}ms`;
    ghost.querySelectorAll('.drag-ghost-content, .drag-ghost-shadow').forEach(
      (element) => { element.style.animationDelay = `${sequenceIndex * 90}ms`; }
    );
    ghost.classList.add('order-delivery');
    window.setTimeout(
      () => ghost.remove(),
      ORDER_DELIVERY_MS + sequenceIndex * 90
    );
  }

  function playProducerUpgrade(levelUps) {
    if (!levelUps.length) return;
    const producerIndices = state.cells
      .map((item, index) => item?.type === 'producer' ? index : -1)
      .filter((index) => index >= 0);
    const producerIndex = producerIndices[0];
    const totalDiamonds = levelUps.reduce(
      (total, levelUp) => total + levelUp.diamondReward,
      0
    );

    producerIndices.forEach((index) => renderCell(index, 'producer-upgrade'));
    if (producerIndices.includes(selectedCellIndex)) {
      showProducerInfo(selectedCellIndex);
    }

    const producerCell = cellElements[producerIndex];
    window.setTimeout(
      () => producerIndices.forEach(
        (index) => cellElements[index]?.classList.remove('producer-upgrade')
      ),
      1200
    );
    const target = document.getElementById('gemValue');
    if (totalDiamonds > 0 && producerCell && target) {
      const sourceRect = producerCell.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const flight = document.createElement('span');
      flight.className = 'reward-flight producer-diamond-flight';
      flight.textContent = `◆ +${totalDiamonds}`;
      flight.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
      flight.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
      flight.style.setProperty(
        '--reward-x',
        `${targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)}px`
      );
      flight.style.setProperty(
        '--reward-y',
        `${targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)}px`
      );
      flight.style.setProperty('--reward-delay', '180ms');
      document.body.appendChild(flight);
      window.setTimeout(() => pulseRewardCounter('gemValue'), 615);
      window.setTimeout(() => flight.remove(), 700);
    }

    const finalLevel = levelUps[levelUps.length - 1].level;
    const message = window.t('producer.progress.upgraded')
      .replace('{level}', String(finalLevel));
    const rewardMessage = totalDiamonds > 0
      ? ` ${window.t('producer.progress.diamonds').replace('{amount}', String(totalDiamonds))}`
      : '';
    showToast(`${message}${rewardMessage}`);
  }

  function tryFulfillOrder(fromIndex, orderIndex, deliveryGhost) {
    const item = state.cells[fromIndex];
    const card = document.querySelector(`.order-card[data-order-index="${orderIndex}"]`);
    if (!card || card.classList.contains('order-presenting')) {
      deliveryGhost?.remove();
      return false;
    }
    const order = Progression.getOrders()[orderIndex];
    const readiness = order ? analyzeOrderReadiness(order) : null;
    const itemMatchesOrder = readiness?.requirements.some(
      (requirement) =>
        requirement.chainId === item?.chainId &&
        requirement.level === item?.level
    );
    if (!readiness?.full || !itemMatchesOrder) {
      deliveryGhost?.remove();
      showToast(window.t('orders.wrong_item'));
      scheduleOrderReadinessUpdate();
      return false;
    }

    const consumedIndices = collectOrderItemIndices(readiness, fromIndex);
    const requiredItemCount = readiness.requirements.reduce(
      (total, requirement) => total + requirement.quantity,
      0
    );
    if (consumedIndices.length !== requiredItemCount) {
      deliveryGhost?.remove();
      scheduleOrderReadinessUpdate();
      return false;
    }

    const deliveries = consumedIndices.map((index) => {
      const sourceItem = state.cells[index];
      if (index === fromIndex && deliveryGhost) {
        return {
          ghost: deliveryGhost,
          chainId: sourceItem.chainId,
          level: sourceItem.level
        };
      }
      const sourceRect = cellElements[index].getBoundingClientRect();
      return {
        ghost: createGhost(
          sourceItem,
          sourceRect.left + sourceRect.width / 2,
          sourceRect.top + sourceRect.height / 2
        ),
        chainId: sourceItem.chainId,
        level: sourceItem.level
      };
    });
    const deliveredItems = consumedIndices.map(
      (index) => ({
        chainId: state.cells[index].chainId,
        level: state.cells[index].level
      })
    );
    const completed = Progression.fulfillOrder(orderIndex, deliveredItems);
    if (!completed) {
      deliveries.forEach((delivery) => delivery.ghost?.remove());
      showToast(window.t('orders.wrong_item'));
      return false;
    }
    const academyProgress = Academy.addXp(completed.rewards.xp);

    card.classList.remove('order-target');
    card.classList.add('order-presenting', 'order-complete');
    const deliveredStamp = document.createElement('span');
    deliveredStamp.className = 'order-delivered-stamp';
    deliveredStamp.textContent = '✓';
    deliveredStamp.setAttribute('aria-hidden', 'true');
    card.appendChild(deliveredStamp);
    deliveries.forEach((delivery, sequenceIndex) => {
      playOrderDelivery(
        delivery.ghost,
        card,
        delivery.chainId,
        delivery.level,
        sequenceIndex
      );
    });
    const rewardTotals = Progression.getEconomy();
    consumedIndices.forEach((index) => {
      state.cells[index] = null;
      renderCell(index);
    });
    saveBoardState();
    if (consumedIndices.includes(selectedCellIndex)) clearItemInfo();
    playRewardFlights(
      card,
      completed.rewards,
      rewardTotals,
      () => {
        playProducerUpgrade(completed.producerProgress);
        handleAcademyProgress(academyProgress);
      }
    );
    GameAudio.play('reward');
    const orderResolveDelay =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 40
        : ORDER_CARD_RESOLVE_MS;
    window.setTimeout(() => {
      renderOrderSlot(orderIndex);
    }, orderResolveDelay);
    return true;
  }

  function nearestEmptyCell(originIndex) {
    const availableCells = [];

    state.cells.forEach((item, index) => {
      if (item === null && !pendingSpawnTargets.has(index)) {
        availableCells.push(index);
      }
    });

    if (!availableCells.length) return -1;
    const originRow = Math.floor(originIndex / BOARD_COLUMNS);
    const originColumn = originIndex % BOARD_COLUMNS;
    return availableCells.sort((a, b) => {
      const aRow = Math.floor(a / BOARD_COLUMNS);
      const aColumn = a % BOARD_COLUMNS;
      const bRow = Math.floor(b / BOARD_COLUMNS);
      const bColumn = b % BOARD_COLUMNS;
      return Math.hypot(aRow - originRow, aColumn - originColumn) -
        Math.hypot(bRow - originRow, bColumn - originColumn);
    })[0];
  }

  function createMergeSparkPool() {
    mergeSparksElement = document.createElement('div');
    mergeSparksElement.className = 'merge-sparks';
    mergeSparksElement.setAttribute('aria-hidden', 'true');
    const directions = [
      [-24, -4], [-17, -18], [0, -25], [18, -17],
      [25, 1], [17, 19], [0, 25], [-19, 17]
    ];

    directions.forEach(([x, y], index) => {
      const spark = document.createElement('span');
      spark.className = 'merge-spark';
      spark.style.setProperty('--spark-x', `${x}px`);
      spark.style.setProperty('--spark-y', `${y}px`);
      spark.style.setProperty('--spark-delay', `${index * 5}ms`);
      mergeSparksElement.appendChild(spark);
    });
  }

  function playMergeSparks(cell) {
    const sparks = mergeSparksElement.cloneNode(true);
    cell.appendChild(sparks);
    void sparks.offsetWidth;
    sparks.classList.add('is-active');
    window.setTimeout(() => sparks.remove(), MERGE_SPARKS_MS);
  }

  function productionLevelForEnergy(energy) {
    return ProductionRules.levelForEnergy(energy);
  }

  function productionResult(energy, random = Math.random) {
    return ProductionRules.resultForEnergy(energy, random);
  }

  function createProducerLaunch(targetIndex, producerIndex, chainId, level, rare, onComplete) {
    const producerCell = cellElements[producerIndex];
    const targetCell = cellElements[targetIndex];
    let launch;
    let content;
    let image;
    let shadow;
    let motionAnimation;
    let contentAnimation;
    let shadowAnimation;
    let fallbackTimer;
    let finished = false;

    function adoptLandingVisual() {
      const renderedWrapper = targetCell.querySelector('.ball-wrap');
      if (!renderedWrapper || !content || !image) return;

      motionAnimation?.cancel();
      contentAnimation?.cancel();
      shadowAnimation?.cancel();
      content.className = 'ball-wrap';
      image.className = 'ball';
      image.alt = itemName(chainId, level);
      image.removeAttribute('aria-hidden');
      image.style.background = 'transparent';
      image.style.objectFit = 'contain';
      renderedWrapper.replaceWith(content);
    }

    function finishLaunch() {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallbackTimer);

      try {
        pendingSpawnTargets.delete(targetIndex);
        targetCell?.classList.remove('spawn-reserved');

        if (targetCell && state.cells[targetIndex] === null) {
          state.cells[targetIndex] = { type: 'ball', chainId, level };
          saveBoardState();
          renderCell(targetIndex);
          adoptLandingVisual();
          targetCell.classList.add('spawn-landed');
          targetCell.classList.toggle('rare-spawn', rare);
          if (level > 1) {
            targetCell.dataset.spawnLevel = `Sv.${level}`;
            targetCell.classList.add('summary-spawn');
          }
          launch?.remove();
          window.setTimeout(
            () => {
              targetCell.classList.remove('spawn-landed', 'rare-spawn', 'summary-spawn');
              delete targetCell.dataset.spawnLevel;
            },
            PRODUCER_LANDING_MS
          );
        }
      } finally {
        launch?.remove();
        onComplete();
      }
    }

    if (!producerCell || !targetCell) {
      finishLaunch();
      return;
    }

    const producerSprite = producerCell.querySelector('.producer-image');
    if (!producerSprite) {
      finishLaunch();
      return;
    }

    const producerRect = producerSprite.getBoundingClientRect();
    const targetRect = targetCell.getBoundingClientRect();
    const itemGroundOffset = Number.parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--item-ground-offset')
    ) || 0;
    const travelX =
      targetRect.left + targetRect.width / 2 -
      (producerRect.left + producerRect.width / 2);
    const travelY =
      targetRect.top + targetRect.height / 2 + itemGroundOffset -
      (producerRect.top + producerRect.height / 2);
    const travelDistance = Math.hypot(travelX, travelY) || 1;
    const perpendicularX = -travelY / travelDistance;
    const perpendicularY = travelX / travelDistance;
    const arcHeight = targetRect.height * .11;
    const distanceInCells =
      travelDistance / Math.max(targetRect.width, targetRect.height);
    const flightDuration = Math.min(
      PRODUCER_MAX_FLIGHT_MS,
      PRODUCER_MIN_FLIGHT_MS +
        Math.max(0, distanceInCells - 1) * PRODUCER_FLIGHT_MS_PER_CELL
    );
    const motionDuration = PRODUCER_EXIT_HOLD_MS + flightDuration;
    const connectionOffset = PRODUCER_EXIT_HOLD_MS / motionDuration;
    const pushOffset = connectionOffset + (1 - connectionOffset) * .18;
    const cruiseOffset = connectionOffset + (1 - connectionOffset) * .68;
    launch = document.createElement('div');
    content = document.createElement('div');

    launch.className = 'producer-launch';
    content.className = 'producer-launch-content';
    launch.style.left = `${producerRect.left + producerRect.width / 2}px`;
    launch.style.top = `${producerRect.top + producerRect.height / 2}px`;
    launch.style.width = `${targetRect.width * .92}px`;
    launch.style.height = `${targetRect.height * .92}px`;
    shadow = createItemShadow();
    content.appendChild(shadow);
    image = document.createElement('img');
    image.className = 'producer-launch-ball';
    image.src = itemSource(chainId, level);
    image.alt = '';
    image.draggable = false;
    image.setAttribute('aria-hidden', 'true');
    content.appendChild(image);
    launch.appendChild(content);

    document.body.appendChild(launch);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveDuration = reducedMotion ? 1 : motionDuration;
    motionAnimation = launch.animate(
      [
        {
          offset: 0,
          transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
          easing: 'linear'
        },
        {
          offset: connectionOffset,
          transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
          easing: 'cubic-bezier(.42, 0, .58, 1)'
        },
        {
          offset: pushOffset,
          transform:
            `translate(-50%, -50%) translate3d(` +
            `${travelX * .1 + perpendicularX * arcHeight * .45}px, ` +
            `${travelY * .1 + perpendicularY * arcHeight * .45}px, 0)`,
          easing: 'cubic-bezier(.22, .61, .36, 1)'
        },
        {
          offset: cruiseOffset,
          transform:
            `translate(-50%, -50%) translate3d(` +
            `${travelX * .7 + perpendicularX * arcHeight}px, ` +
            `${travelY * .7 + perpendicularY * arcHeight}px, 0)`,
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        {
          offset: 1,
          transform:
            `translate(-50%, -50%) translate3d(${travelX}px, ${travelY}px, 0)`
        }
      ],
      {
        duration: effectiveDuration,
        easing: 'linear',
        fill: 'forwards'
      }
    );
    contentAnimation = content.animate(
      [
        {
          offset: 0,
          transform: 'scale(.9)',
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        {
          offset: .11,
          transform: 'scale(.88)',
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        {
          offset: connectionOffset,
          transform: 'scale(.9)',
          easing: 'cubic-bezier(.18, .76, .26, 1)'
        },
        {
          offset: pushOffset,
          transform: 'scale(.94)',
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        {
          offset: cruiseOffset,
          transform: 'scale(.98)',
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        { offset: 1, transform: 'scale(1)' }
      ],
      {
        duration: effectiveDuration,
        easing: 'linear',
        fill: 'forwards'
      }
    );
    shadowAnimation = shadow.animate(
      [
        {
          offset: 0,
          transform: 'translateX(-50%) scale(.82)',
          opacity: .12,
          easing: 'linear'
        },
        {
          offset: connectionOffset,
          transform: 'translateX(-50%) scale(.82)',
          opacity: .12,
          easing: 'cubic-bezier(.42, 0, .58, 1)'
        },
        {
          offset: pushOffset,
          transform: 'translateX(-50%) scale(.7)',
          opacity: .1,
          easing: 'cubic-bezier(.22, .61, .36, 1)'
        },
        {
          offset: cruiseOffset,
          transform: 'translateX(-50%) scale(.84)',
          opacity: .22,
          easing: 'cubic-bezier(.2, .72, .28, 1)'
        },
        {
          offset: 1,
          transform: 'translateX(-50%) scale(1)',
          opacity: .4
        }
      ],
      {
        duration: effectiveDuration,
        easing: 'linear',
        fill: 'forwards'
      }
    );
    motionAnimation.addEventListener('finish', finishLaunch, { once: true });
    fallbackTimer = window.setTimeout(
      finishLaunch,
      effectiveDuration + PRODUCER_SPAWN_FALLBACK_MS
    );
  }

  function scheduleSpawnVisuals() {
    while (
      activeSpawnVisuals < MAX_ACTIVE_SPAWN_VISUALS &&
      spawnVisualQueue.length > 0
    ) {
      const spawn = spawnVisualQueue.shift();
      const { targetIndex, producerIndex, chainId, level, rare } = spawn;
      const now = Date.now();
      const startAt = Math.max(now, nextSpawnVisualStartAt);
      const delay = startAt - now;
      nextSpawnVisualStartAt = startAt + SPAWN_VISUAL_STAGGER_MS;
      activeSpawnVisuals += 1;

      window.setTimeout(() => {
        let visualFinished = false;
        const finishVisual = () => {
          if (visualFinished) return;
          visualFinished = true;
          activeSpawnVisuals -= 1;
          scheduleSpawnVisuals();
        };

        try {
          createProducerLaunch(targetIndex, producerIndex, chainId, level, rare, finishVisual);
        } catch (error) {
          pendingSpawnTargets.delete(targetIndex);
          cellElements[targetIndex]?.classList.remove('spawn-reserved');
          if (state.cells[targetIndex] === null) {
            state.cells[targetIndex] = { type: 'ball', chainId, level };
            saveBoardState();
            renderCell(targetIndex);
          }
          finishVisual();
        }
      }, delay);
    }
  }

  function enqueueSpawnVisual(targetIndex, producerIndex, chainId, level, rare) {
    spawnVisualQueue.push({ targetIndex, producerIndex, chainId, level, rare });
    scheduleSpawnVisuals();
  }

  function activateProducer(producerIndex) {
    const producerItem = state.cells[producerIndex];
    const producerCell = cellElements[producerIndex];
    if (producerItem?.type !== 'producer' || !producerCell) return false;
    const producerId = producerItem.producerId;
    const producerState = Progression.getProducerState(producerId);
    const chainId = producerState.chainId;
    const emptyIndex = nearestEmptyCell(producerIndex);
    if (emptyIndex === -1) {
      showToast(TEXT.boardFull);
      return false;
    }

    const energyCost = state.selectedProductionEnergy;
    const result = productionResult(
      energyCost,
      window.ChampionTour.testingRandom || Math.random
    );
    if (!spendEnergy(energyCost)) {
      producerCell.classList.remove('energy-denied');
      void producerCell.offsetWidth;
      producerCell.classList.add('energy-denied');
      window.setTimeout(
        () => producerCell.classList.remove('energy-denied'),
        320
      );
      showToast(TEXT.noEnergy);
      return false;
    }

    producerCell.classList.remove('producer-pressed');
    void producerCell.offsetWidth;
    producerCell.classList.add('producer-pressed');
    window.setTimeout(
      () => producerCell.classList.remove('producer-pressed'),
      PRODUCER_PRESS_MS
    );
    GameAudio.play('producer');
    pendingSpawnTargets.add(emptyIndex);
    cellElements[emptyIndex].classList.add('spawn-reserved');
    enqueueSpawnVisual(emptyIndex, producerIndex, chainId, result.level, result.rare);
    return true;
  }

  function createGhost(item, x, y) {
    let ghost;

    if (item.type === 'ball') {
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost ball-ghost';

      const content = document.createElement('div');
      content.className = 'drag-ghost-content';

      const shadow = createItemShadow();
      shadow.classList.add('drag-ghost-shadow');
      content.appendChild(shadow);

      const image = document.createElement('img');
      image.className = 'drag-ghost-ball';
      image.src = itemSource(item.chainId, item.level);
      image.alt = '';
      image.draggable = false;
      content.appendChild(image);
      ghost.appendChild(content);
    } else {
      ghost = document.createElement('div');
      ghost.className = 'producer-ghost';
      const image = document.createElement('img');
      image.className = 'producer-ghost-image';
      image.src = producerSource(item.producerId);
      image.alt = '';
      image.draggable = false;
      ghost.appendChild(image);
      const badge = document.createElement('span');
      badge.className = 'producer-energy-badge';
      const energyIcon = document.createElement('img');
      energyIcon.src = DATA.uiIcons.producerEnergy;
      energyIcon.alt = '';
      badge.appendChild(energyIcon);
      badge.setAttribute('aria-hidden', 'true');
      ghost.appendChild(badge);
    }

    ghost.classList.add('drag-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ghost);
    moveGhost(ghost, x, y, x, y);
    return ghost;
  }

  function moveGhost(ghost, x, y, previousX, previousY) {
    const deltaX = x - previousX;
    const deltaY = y - previousY;
    const distance = Math.hypot(deltaX, deltaY);
    const followX = distance ? deltaX / distance * DRAG_FOLLOW_OFFSET : 0;
    const followY = distance ? deltaY / distance * DRAG_FOLLOW_OFFSET : 0;
    const tilt = Math.max(-DRAG_MAX_TILT, Math.min(DRAG_MAX_TILT, deltaX * .12));

    ghost.style.left = `${x - followX}px`;
    ghost.style.top = `${y - followY}px`;
    ghost.style.setProperty('--drag-tilt', `${tilt}deg`);
  }

  function beginProducerPointer(event) {
    if (state.producerPointer || state.drag || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    state.producerPointer = {
      producerIndex: Number(event.target.closest('.cell')?.dataset.index),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null,
      target: null,
      lastX: event.clientX,
      lastY: event.clientY
    };
    window.addEventListener('pointermove', moveProducerPointer);
    window.addEventListener('pointerup', endProducerPointer);
    window.addEventListener('pointercancel', cancelProducerPointer);
  }

  function moveProducerPointer(event) {
    const pointer = state.producerPointer;
    if (!pointer || event.pointerId !== pointer.pointerId) return;
    if (
      Math.hypot(
        event.clientX - pointer.startX,
        event.clientY - pointer.startY
      ) >= DRAG_THRESHOLD
    ) {
      if (!pointer.moved) {
        pointer.moved = true;
        cellElements[pointer.producerIndex].classList.add('drag-source');
        pointer.ghost = createGhost(
          state.cells[pointer.producerIndex],
          event.clientX,
          event.clientY
        );
      } else {
        moveGhost(
          pointer.ghost,
          event.clientX,
          event.clientY,
          pointer.lastX,
          pointer.lastY
        );
      }
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.target?.classList.remove('drag-target', 'invalid-target');
      pointer.target = cellFromPoint(event.clientX, event.clientY);
      if (
        pointer.target &&
        Number(pointer.target.dataset.index) !== pointer.producerIndex
      ) {
        pointer.target.classList.add('drag-target');
      }
    }
  }

  function finishProducerPointer() {
    const pointer = state.producerPointer;
    if (pointer) {
      cellElements[pointer.producerIndex]?.classList.remove('drag-source');
      pointer.target?.classList.remove('drag-target', 'invalid-target');
      pointer.ghost?.remove();
    }
    window.removeEventListener('pointermove', moveProducerPointer);
    window.removeEventListener('pointerup', endProducerPointer);
    window.removeEventListener('pointercancel', cancelProducerPointer);
    state.producerPointer = null;
  }

  function endProducerPointer(event) {
    const pointer = state.producerPointer;
    if (!pointer || event.pointerId !== pointer.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const wasSelectedForProduction =
      !pointer.moved &&
      selectedCellIndex === pointer.producerIndex &&
      selectedInfo?.type === 'producer' &&
      selectedInfo.producerId === state.cells[pointer.producerIndex]?.producerId;
    const target = pointer.moved
      ? cellFromPoint(event.clientX, event.clientY)
      : null;
    const targetIndex = target ? Number(target.dataset.index) : pointer.producerIndex;
    const producerIndex = pointer.producerIndex;
    finishProducerPointer();
    if (!pointer.moved) {
      showProducerInfo(producerIndex);
      if (wasSelectedForProduction) activateProducer(producerIndex);
      return;
    }
    if (targetIndex === producerIndex || targetIndex < 0) return;
    const targetItem = state.cells[targetIndex];
    state.cells[targetIndex] = state.cells[producerIndex];
    state.cells[producerIndex] = targetItem;
    saveBoardState();
    renderCell(producerIndex);
    renderCell(targetIndex);
  }

  function cancelProducerPointer(event) {
    if (
      state.producerPointer &&
      event.pointerId !== state.producerPointer.pointerId
    ) return;
    finishProducerPointer();
  }

  function beginPointer(event) {
    const source = event.currentTarget;
    const fromIndex = Number(source.dataset.index);
    const item = state.cells[fromIndex];

    if (!item) {
      clearItemInfo();
      return;
    }

    if (item.type === 'producer') {
      beginProducerPointer(event);
      return;
    }

    startPointer(fromIndex, event);
  }

  function startPointer(fromIndex, event) {
    const item = state.cells[fromIndex];
    if (!item || state.drag) return;

    event.preventDefault();
    state.drag = {
      fromIndex,
      item,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null,
      target: null,
      lastX: event.clientX,
      lastY: event.clientY
    };

    window.addEventListener('pointermove', movePointer);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', cancelPointer);
  }

  function cellFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    return element ? element.closest('.cell') : null;
  }

  function interactionTargetFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    return element ? element.closest('.cell, .order-card, .storage-button, .storage-slot') : null;
  }

  function clearTarget() {
    if (!state.drag?.target) return;
    state.drag.target.classList.remove('drag-target', 'invalid-target', 'order-target');
    state.drag.target = null;
  }

  function isValidTarget(fromIndex, toIndex) {
    if (fromIndex === toIndex) return false;
    if (pendingSpawnTargets.has(toIndex)) return false;
    if (cellElements[toIndex].classList.contains('merge-resolving')) return false;
    const from = state.cells[fromIndex];
    const to = state.cells[toIndex];
    if (!to) return true;
    return from.type === 'ball' &&
      to.type === 'ball' &&
      from.chainId === to.chainId &&
      from.level === to.level &&
      from.level < MAX_LEVEL;
  }

  function movePointer(event) {
    if (!state.drag) return;

    const distance = Math.hypot(
      event.clientX - state.drag.startX,
      event.clientY - state.drag.startY
    );

    if (!state.drag.moved && distance < DRAG_THRESHOLD) return;

    if (!state.drag.moved) {
      state.drag.moved = true;
      cellElements[state.drag.fromIndex].classList.add('drag-source');
      state.drag.ghost = createGhost(state.drag.item, event.clientX, event.clientY);
    } else {
      moveGhost(
        state.drag.ghost,
        event.clientX,
        event.clientY,
        state.drag.lastX,
        state.drag.lastY
      );
    }
    state.drag.lastX = event.clientX;
    state.drag.lastY = event.clientY;

    clearTarget();
    const target = interactionTargetFromPoint(event.clientX, event.clientY);
    if (!target) return;

    if (target.classList.contains('order-card')) {
      const orderIndex = Number(target.dataset.orderIndex);
      const order = Progression.getOrders()[orderIndex];
      const matches = orderRequirements(order).some(
        (requirement) =>
          requirement.chainId === state.drag.item.chainId &&
          requirement.level === state.drag.item.level
      );
      target.classList.add(matches
        ? 'order-target'
        : 'invalid-target');
      state.drag.target = target;
      return;
    }

    if (target.matches('.storage-button, .storage-slot')) {
      const storageIndex = Number(target.dataset.storageIndex);
      const available = state.drag.item.type === 'ball' && (
        target.classList.contains('storage-button') ||
        (Number.isInteger(storageIndex) && state.storage[storageIndex] === null)
      );
      target.classList.add(available ? 'drag-target' : 'invalid-target');
      state.drag.target = target;
      return;
    }

    if (Number(target.dataset.index) === state.drag.fromIndex) return;

    const targetIndex = Number(target.dataset.index);
    target.classList.add(isValidTarget(state.drag.fromIndex, targetIndex)
      ? 'drag-target'
      : 'invalid-target');
    state.drag.target = target;
  }

  function endPointer(event) {
    if (!state.drag) return;

    const fromIndex = state.drag.fromIndex;
    const item = state.drag.item;
    const wasMoved = state.drag.moved;
    const interactionTarget = wasMoved
      ? interactionTargetFromPoint(event.clientX, event.clientY)
      : null;
    const orderCard = interactionTarget?.classList.contains('order-card')
      ? interactionTarget
      : null;
    const storageTarget = interactionTarget?.matches('.storage-button, .storage-slot')
      ? interactionTarget
      : null;
    const target = interactionTarget?.classList.contains('cell')
      ? interactionTarget
      : null;
    const toIndex = target ? Number(target.dataset.index) : fromIndex;
    const orderIndex = orderCard ? Number(orderCard.dataset.orderIndex) : -1;
    const orderAvailable =
      orderCard && !orderCard.classList.contains('order-presenting');
    const orderMatches = orderCard
      ? orderAvailable && orderRequirements(Progression.getOrders()[orderIndex]).some(
          (requirement) =>
            requirement.chainId === item.chainId &&
            requirement.level === item.level
        )
      : false;
    const invalidDrop = wasMoved && (
      (!target && !orderCard && !storageTarget) ||
      (orderCard && !orderMatches) ||
      (target && toIndex === fromIndex) ||
      (target && !isValidTarget(fromIndex, toIndex)) ||
      (storageTarget && item.type !== 'ball')
    );
    const deliveryGhost = finishPointer(invalidDrop, Boolean(orderMatches));

    if (!wasMoved) {
      if (item.type === 'ball') handleItemTap(fromIndex, item);
      return;
    }

    if (orderCard) {
      if (orderMatches) tryFulfillOrder(fromIndex, orderIndex, deliveryGhost);
      else if (!orderAvailable) return;
      else showToast(window.t('orders.wrong_item'));
      return;
    }

    if (storageTarget) {
      const storageIndex = storageTarget.classList.contains('storage-slot')
        ? Number(storageTarget.dataset.storageIndex)
        : -1;
      storeBoardItem(fromIndex, storageIndex);
      return;
    }

    if (toIndex !== fromIndex) dropItem(fromIndex, toIndex);
  }

  function handleItemTap(index, item) {
    const now = Date.now();
    const isDoubleTap = lastItemTapIndex === index && now - lastItemTapAt <= 320;
    lastItemTapIndex = index;
    lastItemTapAt = now;
    showItemInfo(item.level, index, item.chainId);

    if (isDoubleTap) {
      lastItemTapIndex = -1;
      autoMerge(index);
    }
  }

  function autoMerge(fromIndex) {
    const from = state.cells[fromIndex];
    if (!from || from.type !== 'ball' || from.level >= MAX_LEVEL) return false;

    const fromRow = Math.floor(fromIndex / BOARD_COLUMNS);
    const fromColumn = fromIndex % BOARD_COLUMNS;
    let targetIndex = -1;
    let closestDistance = Infinity;

    state.cells.forEach((candidate, index) => {
      if (
        index === fromIndex ||
        cellElements[index].classList.contains('merge-resolving') ||
        candidate?.type !== 'ball' ||
        candidate.chainId !== from.chainId ||
        candidate.level !== from.level
      ) return;

      const row = Math.floor(index / BOARD_COLUMNS);
      const column = index % BOARD_COLUMNS;
      const distance = Math.hypot(row - fromRow, column - fromColumn);
      if (distance < closestDistance) {
        closestDistance = distance;
        targetIndex = index;
      }
    });

    if (targetIndex === -1) {
      showToast(TEXT.sameLevel);
      return false;
    }

    dropItem(fromIndex, targetIndex);
    return true;
  }

  function cancelPointer() {
    finishPointer(true);
  }

  function finishPointer(invalidDrop = false, preserveGhost = false) {
    if (!state.drag) return;
    const dragState = state.drag;
    let retainedGhost = null;
    const sourceCell = cellElements[dragState.fromIndex];
    sourceCell.classList.remove('drag-source');
    clearTarget();

    if (dragState.ghost && dragState.item.type === 'ball') {
      if (preserveGhost) {
        retainedGhost = dragState.ghost;
      } else if (invalidDrop) {
        const sourceRect = sourceCell.getBoundingClientRect();
        const ghostX = Number.parseFloat(dragState.ghost.style.left);
        const ghostY = Number.parseFloat(dragState.ghost.style.top);
        dragState.ghost.style.setProperty(
          '--drag-return-x',
          `${sourceRect.left + sourceRect.width / 2 - ghostX}px`
        );
        dragState.ghost.style.setProperty(
          '--drag-return-y',
          `${sourceRect.top + sourceRect.height / 2 - ghostY}px`
        );
        dragState.ghost.classList.add('drag-return');
        window.setTimeout(() => dragState.ghost.remove(), INVALID_DROP_MS);
      } else {
        dragState.ghost.classList.add('drag-drop');
        window.setTimeout(() => dragState.ghost.remove(), DROP_SETTLE_MS);
      }
    } else if (dragState.ghost) {
      dragState.ghost.remove();
    }

    window.removeEventListener('pointermove', movePointer);
    window.removeEventListener('pointerup', endPointer);
    window.removeEventListener('pointercancel', cancelPointer);
    state.drag = null;
    return retainedGhost;
  }

  function dropItem(fromIndex, toIndex) {
    const from = state.cells[fromIndex];
    const to = state.cells[toIndex];
    if (!from) return;
    if (
      cellElements[fromIndex].classList.contains('merge-resolving') ||
      cellElements[toIndex].classList.contains('merge-resolving')
    ) return;

    if (!to) {
      if (selectedCellIndex === fromIndex) selectedCellIndex = toIndex;
      state.cells[toIndex] = from;
      state.cells[fromIndex] = null;
      saveBoardState();
      renderCell(fromIndex);
      renderCell(toIndex);
      return;
    }

    if (
      from.type === 'ball' &&
      to.type === 'ball' &&
      from.chainId === to.chainId &&
      from.level === to.level &&
      from.level < MAX_LEVEL
    ) {
      const nextLevel = from.level + 1;
      const fromCell = cellElements[fromIndex];
      const toCell = cellElements[toIndex];
      const fromRect = fromCell.getBoundingClientRect();
      const toRect = toCell.getBoundingClientRect();
      const deltaX = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
      const deltaY = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const shiftX = deltaX / distance * 6;
      const shiftY = deltaY / distance * 6;
      const targetEcho = toCell.querySelector('.ball-wrap').cloneNode(true);

      fromCell.style.setProperty('--merge-shift-x', `${shiftX}px`);
      fromCell.style.setProperty('--merge-shift-y', `${shiftY}px`);
      toCell.style.setProperty('--merge-shift-x', `${-shiftX}px`);
      toCell.style.setProperty('--merge-shift-y', `${-shiftY}px`);
      targetEcho.style.setProperty('--merge-shift-x', `${-shiftX}px`);
      targetEcho.style.setProperty('--merge-shift-y', `${-shiftY}px`);
      targetEcho.classList.add('merge-echo', 'merge-away');

      fromCell.classList.add('merge-resolving');
      toCell.classList.add('merge-resolving');
      fromCell.classList.add('merge-anticipation');
      toCell.classList.add('merge-anticipation');
      window.setTimeout(() => {
        fromCell.classList.remove('merge-anticipation');
        toCell.classList.remove('merge-anticipation');
        fromCell.classList.add('merge-away');

        state.cells[fromIndex] = null;
        state.cells[toIndex] = {
          type: 'ball',
          chainId: from.chainId,
          level: nextLevel
        };
        saveBoardState();
        if (selectedCellIndex === fromIndex || selectedCellIndex === toIndex) {
          selectedCellIndex = toIndex;
        }
        renderCell(toIndex, 'merge-pop');
        playMergeSparks(cellElements[toIndex]);
        GameAudio.play('merge');
        if (selectedItemLevel === from.level) {
          showItemInfo(nextLevel, toIndex, from.chainId);
        }
        cellElements[toIndex].appendChild(targetEcho);

        window.setTimeout(() => {
          targetEcho.remove();
          renderCell(fromIndex);
        }, MERGE_DEPARTURE_MS);
      }, MERGE_ANTICIPATION_MS);
      return;
    }

    if (
      from.type === 'ball' &&
      to.type === 'ball' &&
      from.chainId === to.chainId &&
      from.level === MAX_LEVEL &&
      to.level === MAX_LEVEL
    ) {
      showToast(TEXT.maxReached);
    } else if (from.type === 'ball' && to.type === 'ball') {
      showToast(TEXT.sameLevel);
    }
  }

  function renderProductionModeControl(chainId) {
    const control = document.getElementById('productionModeControl');
    if (!control) return;
    const options = ProductionRules.supportedEnergyOptions(chainId);
    if (!options.includes(state.selectedProductionEnergy)) {
      state.selectedProductionEnergy = options[0] || DEFAULT_PRODUCTION_ENERGY;
    }
    const energy = state.selectedProductionEnergy;
    const level = productionLevelForEnergy(energy);
    document.getElementById('productionModeValue').textContent = String(energy);
    document.getElementById('productionModeSummary').textContent =
      energy === DEFAULT_PRODUCTION_ENERGY
        ? `${energy} enerji • Standart`
        : `${energy} enerji • Sv.${level}`;
    control.hidden = false;
    control.dataset.chainId = chainId;
  }

  function cycleProductionMode(event) {
    event.preventDefault();
    event.stopPropagation();
    if (selectedInfo?.type !== 'producer') return;
    const producer = DATA.producers[selectedInfo.producerId];
    const options = ProductionRules.supportedEnergyOptions(producer.chainId);
    const currentIndex = options.indexOf(state.selectedProductionEnergy);
    state.selectedProductionEnergy = options[(currentIndex + 1) % options.length];
    saveBoardState();
    renderProductionModeControl(producer.chainId);
  }

  function updateControlCenter() {
    const count = state.storage.filter(Boolean).length;
    const countElement = document.getElementById('storageCount');
    if (countElement) countElement.textContent = `${count}/${state.storageCapacity}`;
    const sellButton = document.getElementById('sellButton');
    if (!sellButton) return;
    const item = selectedCellIndex >= 0 ? state.cells[selectedCellIndex] : null;
    const sellable = item?.type === 'ball' && !item.locked && !item.favorite;
    sellButton.disabled = !sellable || saleInProgress;
    if (!sellable || saleConfirmationIndex !== selectedCellIndex) {
      sellButton.classList.remove('is-confirming');
      sellButton.querySelector('span').textContent = `+${DEFAULT_ITEM_SELL_PRICE}`;
    }
  }

  function renderStorage() {
    updateControlCenter();
    document.getElementById('storageCapacityValue').textContent =
      `${state.storageCapacity} SLOT`;
    const grid = document.getElementById('storageGrid');
    grid.innerHTML = '';
    state.storage.forEach((item, index) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'storage-slot';
      slot.dataset.storageIndex = String(index);
      slot.setAttribute('aria-label', item ? itemName(item.chainId, item.level) : 'Boş depo slotu');
      if (item) {
        const image = document.createElement('img');
        image.src = itemSource(item.chainId, item.level);
        image.alt = '';
        image.draggable = false;
        slot.appendChild(image);
        slot.addEventListener('click', () => moveStorageItemToBoard(index));
      }
      grid.appendChild(slot);
    });
    const unlock = document.createElement('button');
    unlock.type = 'button';
    unlock.className = 'storage-slot storage-unlock';
    unlock.innerHTML =
      `<strong>+1 SLOT</strong><span>${STORAGE_SLOT_UNLOCK_COST} ◆</span>`;
    unlock.addEventListener('click', unlockStorageSlot);
    grid.appendChild(unlock);
  }

  function openStorage() {
    clearItemInfo();
    renderStorage();
    document.getElementById('storageOverlay').hidden = false;
    document.body.classList.add('storage-open');
  }

  function closeStorage() {
    document.getElementById('storageOverlay').hidden = true;
    document.body.classList.remove('storage-open');
  }

  function storeBoardItem(fromIndex, preferredSlot = -1) {
    const item = state.cells[fromIndex];
    if (item?.type !== 'ball') {
      showToast('Üreticiler depoya taşınamaz');
      return false;
    }
    const targetIndex = preferredSlot >= 0 && state.storage[preferredSlot] === null
      ? preferredSlot
      : state.storage.findIndex((stored) => stored === null);
    if (targetIndex < 0) {
      showToast('Depo dolu');
      return false;
    }
    state.cells[fromIndex] = null;
    state.storage[targetIndex] = item;
    if (!saveBoardState()) {
      state.cells[fromIndex] = item;
      state.storage[targetIndex] = null;
      showToast('Depo kaydedilemedi');
      return false;
    }
    if (selectedCellIndex === fromIndex) clearItemInfo();
    renderCell(fromIndex);
    renderStorage();
    showToast('Ürün depoya taşındı');
    return true;
  }

  function moveStorageItemToBoard(storageIndex) {
    const item = state.storage[storageIndex];
    if (!item) return;
    const boardIndex = state.cells.findIndex(
      (cellItem, index) => cellItem === null && !pendingSpawnTargets.has(index)
    );
    if (boardIndex < 0) {
      showToast(TEXT.boardFull);
      return;
    }
    state.storage[storageIndex] = null;
    state.cells[boardIndex] = item;
    if (!saveBoardState()) {
      state.storage[storageIndex] = item;
      state.cells[boardIndex] = null;
      showToast('Taşıma kaydedilemedi');
      return;
    }
    renderCell(boardIndex, 'spawned');
    renderStorage();
    showToast('Ürün boarda taşındı');
  }

  function unlockStorageSlot() {
    const economy = Progression.adjustEconomy({ gems: -STORAGE_SLOT_UNLOCK_COST });
    if (!economy) {
      showToast('Yeterli elmas yok');
      return;
    }
    state.storageCapacity += 1;
    state.storage.push(null);
    if (!saveBoardState()) {
      state.storageCapacity -= 1;
      state.storage.pop();
      Progression.adjustEconomy({ gems: STORAGE_SLOT_UNLOCK_COST });
      showToast('Depo genişletilemedi');
      return;
    }
    renderEconomy();
    renderStorage();
    showToast('Depoya 1 slot eklendi');
  }

  function resetSaleConfirmation() {
    window.clearTimeout(saleConfirmTimer);
    saleConfirmationIndex = -1;
    updateControlCenter();
  }

  function handleSellClick() {
    const index = selectedCellIndex;
    const item = state.cells[index];
    if (item?.type !== 'ball' || item.locked || item.favorite || saleInProgress) return;
    if (saleConfirmationIndex !== index) {
      saleConfirmationIndex = index;
      const button = document.getElementById('sellButton');
      button.classList.add('is-confirming');
      button.querySelector('span').textContent = 'SAT?';
      saleConfirmTimer = window.setTimeout(resetSaleConfirmation, 3000);
      return;
    }
    saleInProgress = true;
    window.clearTimeout(saleConfirmTimer);
    state.cells[index] = null;
    const economy = Progression.adjustEconomy({ coins: DEFAULT_ITEM_SELL_PRICE });
    if (!economy || !saveBoardState()) {
      state.cells[index] = item;
      if (economy) Progression.adjustEconomy({ coins: -DEFAULT_ITEM_SELL_PRICE });
      saleInProgress = false;
      resetSaleConfirmation();
      showToast('Satış tamamlanamadı');
      return;
    }
    renderCell(index);
    clearItemInfo();
    renderEconomy();
    pulseRewardCounter('coinValue', Progression.getEconomy().coins);
    saleInProgress = false;
    resetSaleConfirmation();
    showSaleToast(item, index);
  }

  function init() {
    applyTranslations();
    applyUiIcons();
    loadEnergy();
    createBoard();
    document.getElementById('campusCloseButton').addEventListener(
      'click',
      closeSportsCampus
    );
    document.getElementById('campusHudButton').addEventListener(
      'click',
      () => openSportsCampus(false)
    );
    document.getElementById('campusBackButton').addEventListener('click', () => {
      renderCampusMap();
      showCampusMap();
    });
    document.getElementById('itemInfoButton').addEventListener('click', openItemDetail);
    document.getElementById('storageButton').addEventListener('click', openStorage);
    document.getElementById('productionModeControl').addEventListener(
      'click',
      cycleProductionMode
    );
    document.getElementById('storageCloseButton').addEventListener('click', closeStorage);
    document.getElementById('storageOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'storageOverlay') closeStorage();
    });
    document.getElementById('sellButton').addEventListener('click', handleSellClick);
    document.getElementById('itemDetailClose').addEventListener('click', closeItemDetail);
    document.getElementById('itemDetailOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'itemDetailOverlay') closeItemDetail();
    });
    document.getElementById('producerXpDebug').addEventListener('click', () => {
      if (!TESTING_MODE.enabled) return;
      const result = Progression.addProducerXp(TESTING_MODE.producerXpIncrement);
      const academyResult = Academy.addXp(TESTING_MODE.producerXpIncrement);
      playProducerUpgrade(result.levelUps);
      handleAcademyProgress(academyResult);
      renderEconomy();
      const producerIndex = state.cells.findIndex((item) => item?.type === 'producer');
      if (!result.levelUps.length && producerIndex >= 0) showProducerInfo(producerIndex);
    });
    renderOrders();
    setupOrdersStripInteraction();
    renderEconomy();
    renderStorage();
    renderAcademyWorld();
    renderEnergy();
    clearItemInfo();
    if (Academy.getState().pendingRenovations > 0) {
      window.setTimeout(() => openSportsCampus(false), 320);
    }
    window.setInterval(() => {
      energyTick();
      Progression.tick(Date.now());
      updateProducerReadiness();
    }, 250);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
