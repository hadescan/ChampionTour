(function () {
  'use strict';

  const BOARD_COLUMNS = 7;
  const BOARD_ROWS = 9;
  const CELL_COUNT = BOARD_COLUMNS * BOARD_ROWS;
  const DATA = window.ChampionTour.GameData;
  const Progression = window.ChampionTour.Progression;
  const GameAudio = window.ChampionTour.Audio;
  const TESTING_MODE = DATA.testing;
  const INITIAL_PRODUCER_INDEX =
    Math.floor(BOARD_ROWS / 2) * BOARD_COLUMNS +
    Math.floor(BOARD_COLUMNS / 2);
  const MAX_LEVEL = DATA.maxItemLevel;
  const MAX_ENERGY = 100;
  const PRODUCTION_COST = DATA.producer.energyCost;
  const REGEN_INTERVAL_MS = 2 * 60 * 1000;
  const STORAGE_KEY = 'championTour.prototype.energy.v1';
  const SHADOW_SOURCE = 'assets/Football/shadow.png';
  const DRAG_THRESHOLD = 7;
  const PRODUCER_PRESS_MS = 120;
  const PRODUCER_EXIT_HOLD_MS = 50;
  const PRODUCER_FLIGHT_MS = 210;
  const PRODUCER_LANDING_MS = 110;
  const PRODUCER_SPAWN_FALLBACK_MS = 120;
  const SPAWN_VISUAL_STAGGER_MS = 65;
  const MAX_ACTIVE_SPAWN_VISUALS = 3;
  const MERGE_DEPARTURE_MS = 180;
  const DRAG_FOLLOW_OFFSET = 4;
  const DRAG_MAX_TILT = 3;
  const DROP_SETTLE_MS = 100;
  const INVALID_DROP_MS = 150;
  const MERGE_ANTICIPATION_MS = 90;

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
    energy: MAX_ENERGY,
    nextEnergyAt: null
  };

  let boardElement;
  let cellElements = [];
  let toastTimer;
  let mergeSparksElement;
  let selectedItemLevel = null;
  let selectedCellIndex = -1;
  let itemInfoTimer;
  let lastItemTapIndex = -1;
  let lastItemTapAt = 0;
  const pendingSpawnTargets = new Set();
  const spawnVisualQueue = [];
  let activeSpawnVisuals = 0;
  let nextSpawnVisualStartAt = 0;

  function ballSource(level) {
    return DATA.items[level].sprite;
  }

  function producerSource() {
    return Progression.getProducerState().artwork;
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
    if (TESTING_MODE.enabled && TESTING_MODE.bypassEnergy) {
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
    const fill = document.getElementById('energyFill');

    value.textContent = `${state.energy} / ${MAX_ENERGY}`;
    fill.style.width = `${(state.energy / MAX_ENERGY) * 100}%`;

    if (state.energy >= MAX_ENERGY) {
      timer.textContent = TEXT.full;
    } else {
      timer.textContent = formatCountdown(state.nextEnergyAt - Date.now());
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

  function itemName(level) {
    return window.t(`item.football.lv${level}`);
  }

  function itemDescription(level) {
    return window.t(`item.football.lv${level}.description`);
  }

  function selectCell(index) {
    if (selectedCellIndex >= 0) {
      cellElements[selectedCellIndex]?.classList.remove('item-selected');
    }
    selectedCellIndex = index;
    cellElements[index]?.classList.add('item-selected');
  }

  function showItemInfo(level, index = selectedCellIndex) {
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
    if (index >= 0) selectCell(index);

    clearTimeout(itemInfoTimer);
    if (
      selectedItemLevel === level &&
      selectedCellIndex === index &&
      panel.classList.contains('is-visible')
    ) return;

    function reveal() {
      selectedItemLevel = level;
      name.textContent = itemName(level);
      description.textContent = itemDescription(level);
      icon.src = ballSource(level);
      icon.alt = itemName(level);
      levelElement.textContent = window.t('item.info.level').replace('{level}', String(level));
      producerElement.textContent = window.t('item.info.from').replace(
        '{producer}',
        window.t(`producer.${definition.producerId}.name`)
      );
      rarityElement.textContent = window.t(definition.rarityKey);
      nextElement.textContent = definition.nextLevel
        ? window.t('item.info.next').replace('{item}', itemName(definition.nextLevel))
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
  }

  function showProducerInfo(index) {
    const panel = document.getElementById('itemInfoPanel');
    const producerState = Progression.getProducerState();
    const debugButton = document.getElementById('producerXpDebug');
    clearTimeout(itemInfoTimer);
    selectedItemLevel = null;
    selectCell(index);
    document.getElementById('itemInfoIcon').src = producerState.artwork;
    document.getElementById('itemInfoIcon').alt = window.t('producer.football_academy.name');
    document.getElementById('itemInfoName').textContent = window.t('producer.football_academy.name');
    document.getElementById('itemInfoLevel').textContent =
      window.t('producer.progress.level').replace('{level}', String(producerState.level));
    document.getElementById('itemInfoDescription').textContent = producerState.isMaxLevel
      ? window.t('producer.progress.max')
      : window.t('producer.progress.xp')
        .replace('{current}', String(producerState.xp))
        .replace('{required}', String(producerState.xpToNext));
    document.getElementById('itemInfoProducer').textContent =
      window.t('producer.produces').replace('{item}', itemName(1));
    document.getElementById('itemInfoRarity').textContent = '';
    document.getElementById('itemInfoNext').textContent = producerState.cooldownRemainingMs > 0
      ? `${window.t('producer.cooldown')} ${formatCountdown(producerState.cooldownRemainingMs)}`
      : window.t('producer.ready');
    debugButton.hidden = !TESTING_MODE.enabled || producerState.isMaxLevel;
    debugButton.textContent = window.t('producer.progress.debug_xp').replace(
      '{amount}',
      String(TESTING_MODE.producerXpIncrement)
    );
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.remove('is-empty');
    panel.classList.add('is-visible');
  }

  function clearItemInfo() {
    clearTimeout(itemInfoTimer);
    selectedItemLevel = null;
    if (selectedCellIndex >= 0) {
      cellElements[selectedCellIndex]?.classList.remove('item-selected');
      selectedCellIndex = -1;
    }
    const panel = document.getElementById('itemInfoPanel');
    document.getElementById('itemInfoIcon').src = 'assets/icons/sports_bag.svg';
    document.getElementById('itemInfoIcon').alt = '';
    document.getElementById('itemInfoName').textContent = window.t('item.info.default_title');
    document.getElementById('itemInfoLevel').textContent = '';
    document.getElementById('itemInfoDescription').textContent =
      window.t('item.info.default_description');
    document.getElementById('itemInfoProducer').textContent = '';
    document.getElementById('itemInfoRarity').textContent = '';
    document.getElementById('itemInfoNext').textContent = '';
    document.getElementById('producerXpDebug').hidden = true;
    panel.classList.remove('is-empty', 'content-change');
    panel.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
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
    state.cells[INITIAL_PRODUCER_INDEX] = { type: 'producer' };
    renderCell(INITIAL_PRODUCER_INDEX);
  }

  function renderCell(index, animationClass) {
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
      cell.setAttribute('aria-label', TEXT.producer);
      const producerWrapper = document.createElement('div');
      producerWrapper.className = 'producer-wrap';
      producerWrapper.appendChild(createItemShadow());

      const producerImage = document.createElement('img');
      producerImage.className = 'producer-image';
      producerImage.src = producerSource();
      producerImage.alt = '';
      producerImage.draggable = false;
      producerImage.setAttribute('aria-hidden', 'true');
      producerImage.addEventListener('pointerdown', beginProducerPointer);
      producerWrapper.appendChild(producerImage);
      cell.appendChild(producerWrapper);

      const infoButton = document.createElement('button');
      infoButton.className = 'producer-info-button';
      infoButton.type = 'button';
      infoButton.textContent = window.t('producer.info.symbol');
      infoButton.setAttribute('aria-label', window.t('producer.info.open'));
      infoButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      infoButton.addEventListener('pointerup', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showProducerInfo(index);
      });
      infoButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.detail === 0) showProducerInfo(index);
      });
      cell.appendChild(infoButton);

      const chargeBadge = document.createElement('span');
      chargeBadge.className = 'producer-charge-badge';
      cell.appendChild(chargeBadge);

      const cooldown = document.createElement('span');
      cooldown.className = 'producer-cooldown';
      cell.appendChild(cooldown);
      if (index === selectedCellIndex) cell.classList.add('item-selected');
      updateProducerReadiness();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'ball-wrap';
    wrapper.style.background = 'transparent';
    wrapper.appendChild(createItemShadow());

    const image = document.createElement('img');
    image.className = 'ball';
    image.src = ballSource(item.level);
    image.alt = TEXT.ballLevel(item.level);
    image.draggable = false;
    image.style.background = 'transparent';
    image.style.objectFit = 'contain';
    wrapper.appendChild(image);
    cell.appendChild(wrapper);
    if (index === selectedCellIndex) cell.classList.add('item-selected');
    cell.setAttribute('aria-label', TEXT.ballLevel(item.level));
  }

  function updateProducerReadiness() {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    if (!producerCell) return;
    const producerState = Progression.getProducerState();
    const energyReady =
      TESTING_MODE.enabled && TESTING_MODE.bypassEnergy ||
      state.energy >= PRODUCTION_COST;
    const producerReady =
      TESTING_MODE.enabled && TESTING_MODE.bypassProducerCooldown ||
      producerState.charges > 0;
    const ready = energyReady && producerReady;
    producerCell.classList.toggle('ready', ready);
    producerCell.classList.toggle(
      'cooling-down',
      producerState.charges === 0 &&
      !(TESTING_MODE.enabled && TESTING_MODE.bypassProducerCooldown)
    );

    const badge = producerCell.querySelector('.producer-charge-badge');
    const cooldown = producerCell.querySelector('.producer-cooldown');
    if (badge) {
      badge.textContent = `${window.t('producer.charges')} ${producerState.charges}/${producerState.maxCharges}`;
      badge.hidden = TESTING_MODE.enabled;
    }
    if (cooldown) {
      const cooldownProgress = producerState.cooldownRemainingMs > 0
        ? 1 - producerState.cooldownRemainingMs / DATA.producer.cooldownMs
        : 1;
      cooldown.style.setProperty(
        '--cooldown-progress',
        `${Math.max(0, Math.min(1, cooldownProgress)) * 360}deg`
      );
      cooldown.textContent = producerState.cooldownRemainingMs > 0
        ? String(Math.ceil(producerState.cooldownRemainingMs / 1000))
        : '';
      cooldown.setAttribute(
        'aria-label',
        producerState.cooldownRemainingMs > 0
          ? `${window.t('producer.cooldown')} ${formatCountdown(producerState.cooldownRemainingMs)}`
          : window.t('producer.ready')
      );
    }
  }

  function renderEconomy() {
    const economy = Progression.getEconomy();
    document.getElementById('coinValue').textContent = String(economy.coins);
    document.getElementById('xpValue').textContent = String(economy.xp);
    document.getElementById('gemValue').textContent = String(economy.gems);
    document.getElementById('eventValue').textContent = String(economy.eventPoints);
  }

  function renderOrders() {
    const root = document.getElementById('ordersStrip');
    const orders = Progression.getOrders();
    root.innerHTML = '';

    orders.forEach((order, index) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      card.dataset.orderIndex = String(index);

      const image = document.createElement('img');
      image.src = ballSource(order.level);
      image.alt = itemName(order.level);
      card.appendChild(image);

      const quantity = document.createElement('strong');
      quantity.className = 'order-quantity';
      quantity.textContent = `×${order.quantity}`;
      card.appendChild(quantity);

      const rewards = document.createElement('span');
      rewards.className = 'order-rewards';
      rewards.textContent = `● ${order.rewards.coins}  ★ ${order.rewards.xp}`;
      card.appendChild(rewards);

      card.setAttribute(
        'aria-label',
        `${itemName(order.level)}, ${window.t('orders.quantity')} ${order.quantity}`
      );
      root.appendChild(card);
    });
  }

  function playRewardFlights(orderCard, rewards) {
    const sourceRect = orderCard.getBoundingClientRect();
    const targets = [
      ['coins', 'coinValue', '●'],
      ['xp', 'xpValue', '★'],
      ['gems', 'gemValue', '◆'],
      ['eventPoints', 'eventValue', '⚑']
    ];

    targets.forEach(([rewardKey, targetId, symbol], index) => {
      if (!rewards[rewardKey]) return;
      const targetRect = document.getElementById(targetId).getBoundingClientRect();
      const flight = document.createElement('span');
      flight.className = 'reward-flight';
      flight.textContent = symbol;
      flight.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
      flight.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
      flight.style.setProperty('--reward-x', `${targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)}px`);
      flight.style.setProperty('--reward-y', `${targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)}px`);
      flight.style.setProperty('--reward-delay', `${index * 35}ms`);
      document.body.appendChild(flight);
      window.setTimeout(() => flight.remove(), 620);
    });
  }

  function playProducerUpgrade(levelUps) {
    if (!levelUps.length) return;
    const producerIndex = state.cells.findIndex((item) => item?.type === 'producer');
    const totalDiamonds = levelUps.reduce(
      (total, levelUp) => total + levelUp.diamondReward,
      0
    );

    renderCell(producerIndex, 'producer-upgrade');
    if (selectedCellIndex === producerIndex) showProducerInfo(producerIndex);

    const producerCell = cellElements[producerIndex];
    window.setTimeout(
      () => producerCell?.classList.remove('producer-upgrade'),
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
      window.setTimeout(() => flight.remove(), 900);
    }

    const finalLevel = levelUps[levelUps.length - 1].level;
    const message = window.t('producer.progress.upgraded')
      .replace('{level}', String(finalLevel));
    const rewardMessage = totalDiamonds > 0
      ? ` ${window.t('producer.progress.diamonds').replace('{amount}', String(totalDiamonds))}`
      : '';
    showToast(`${message}${rewardMessage}`);
  }

  function tryFulfillOrder(fromIndex, orderIndex) {
    const item = state.cells[fromIndex];
    const card = document.querySelector(`.order-card[data-order-index="${orderIndex}"]`);
    const completed = Progression.fulfillOrder(orderIndex, item?.level);
    if (!completed) {
      showToast(window.t('orders.wrong_item'));
      return false;
    }

    state.cells[fromIndex] = null;
    if (selectedCellIndex === fromIndex) clearItemInfo();
    renderCell(fromIndex);
    playRewardFlights(card, completed.rewards);
    playProducerUpgrade(completed.producerProgress);
    GameAudio.play('reward');
    card.classList.add('order-complete');
    window.setTimeout(() => {
      renderOrders();
      renderEconomy();
    }, 260);
    return true;
  }

  function nearestEmptyCell() {
    const producerIndex = state.cells.findIndex((item) => item?.type === 'producer');
    const producerRow = Math.floor(producerIndex / BOARD_COLUMNS);
    const producerColumn = producerIndex % BOARD_COLUMNS;
    let bestIndex = -1;
    let bestDistance = Infinity;

    state.cells.forEach((item, index) => {
      if (item !== null || pendingSpawnTargets.has(index)) return;
      const row = Math.floor(index / BOARD_COLUMNS);
      const column = index % BOARD_COLUMNS;
      const distance =
        (row - producerRow) ** 2 +
        (column - producerColumn) ** 2;
      if (distance < bestDistance || (distance === bestDistance && index < bestIndex)) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
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
    mergeSparksElement.remove();
    mergeSparksElement.classList.remove('is-active');
    cell.appendChild(mergeSparksElement);
    void mergeSparksElement.offsetWidth;
    mergeSparksElement.classList.add('is-active');
  }

  function createProducerLaunch(targetIndex, onComplete) {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    const targetCell = cellElements[targetIndex];
    let launch;
    let fallbackTimer;
    let finished = false;

    function finishLaunch() {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallbackTimer);

      try {
        pendingSpawnTargets.delete(targetIndex);
        targetCell?.classList.remove('spawn-reserved');

        if (targetCell && state.cells[targetIndex] === null) {
          state.cells[targetIndex] = { type: 'ball', level: 1 };
          renderCell(targetIndex);
          targetCell.classList.add('spawn-landed');
          launch?.remove();
          window.setTimeout(
            () => targetCell.classList.remove('spawn-landed'),
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
    const motionDuration = PRODUCER_EXIT_HOLD_MS + PRODUCER_FLIGHT_MS;
    const connectionOffset = PRODUCER_EXIT_HOLD_MS / motionDuration;
    launch = document.createElement('div');
    const content = document.createElement('div');

    launch.className = 'producer-launch';
    content.className = 'producer-launch-content';
    launch.style.left = `${producerRect.left + producerRect.width / 2}px`;
    launch.style.top = `${producerRect.top + producerRect.height / 2}px`;
    launch.style.width = `${targetRect.width * .92}px`;
    launch.style.height = `${targetRect.height * .92}px`;
    const shadow = createItemShadow();
    content.appendChild(shadow);
    const image = document.createElement('img');
    image.className = 'producer-launch-ball';
    image.src = ballSource(1);
    image.alt = '';
    image.draggable = false;
    image.setAttribute('aria-hidden', 'true');
    content.appendChild(image);
    launch.appendChild(content);

    document.body.appendChild(launch);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveDuration = reducedMotion ? 1 : motionDuration;
    const motionAnimation = launch.animate(
      [
        {
          offset: 0,
          transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
          easing: 'linear'
        },
        {
          offset: connectionOffset,
          transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
          easing: 'cubic-bezier(.16, .82, .24, 1)'
        },
        {
          offset: .45,
          transform:
            `translate(-50%, -50%) translate3d(` +
            `${travelX * .72 + perpendicularX * arcHeight}px, ` +
            `${travelY * .72 + perpendicularY * arcHeight}px, 0)`,
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
    content.animate(
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
        { offset: 1, transform: 'scale(1)' }
      ],
      {
        duration: effectiveDuration,
        easing: 'linear',
        fill: 'forwards'
      }
    );
    shadow.animate(
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
          easing: 'cubic-bezier(.16, .82, .24, 1)'
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
      const targetIndex = spawnVisualQueue.shift();
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
          createProducerLaunch(targetIndex, finishVisual);
        } catch (error) {
          pendingSpawnTargets.delete(targetIndex);
          cellElements[targetIndex]?.classList.remove('spawn-reserved');
          if (state.cells[targetIndex] === null) {
            state.cells[targetIndex] = { type: 'ball', level: 1 };
            renderCell(targetIndex);
          }
          finishVisual();
        }
      }, delay);
    }
  }

  function enqueueSpawnVisual(targetIndex) {
    spawnVisualQueue.push(targetIndex);
    scheduleSpawnVisuals();
  }

  function activateProducer() {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    const emptyIndex = nearestEmptyCell();
    if (emptyIndex === -1) {
      showToast(TEXT.boardFull);
      return false;
    }

    if (
      !(TESTING_MODE.enabled && TESTING_MODE.bypassProducerCooldown) &&
      !Progression.canProduce()
    ) {
      const producerState = Progression.getProducerState();
      showToast(`${window.t('producer.cooldown')} ${formatCountdown(producerState.cooldownRemainingMs)}`);
      return false;
    }

    if (!spendEnergy(PRODUCTION_COST)) {
      showToast(TEXT.noEnergy);
      return false;
    }

    if (!(TESTING_MODE.enabled && TESTING_MODE.bypassProducerCooldown)) {
      Progression.consumeCharge();
    }
    producerCell.classList.remove('producer-pressed');
    void producerCell.offsetWidth;
    producerCell.classList.add('producer-pressed');
    window.setTimeout(
      () => producerCell.classList.remove('producer-pressed'),
      PRODUCER_PRESS_MS
    );
    if (selectedCellIndex === Number(producerCell.dataset.index)) {
      showProducerInfo(Number(producerCell.dataset.index));
    }
    GameAudio.play('producer');
    pendingSpawnTargets.add(emptyIndex);
    cellElements[emptyIndex].classList.add('spawn-reserved');
    enqueueSpawnVisual(emptyIndex);
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
      image.src = ballSource(item.level);
      image.alt = '';
      image.draggable = false;
      content.appendChild(image);
      ghost.appendChild(content);
    } else {
      ghost = document.createElement('img');
      ghost.classList.add('producer-ghost');
      ghost.src = producerSource();
      ghost.alt = '';
      ghost.draggable = false;
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
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
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
      pointer.moved = true;
    }
  }

  function finishProducerPointer() {
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
    const shouldProduce = !pointer.moved;
    finishProducerPointer();
    if (shouldProduce) activateProducer();
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
    return element ? element.closest('.cell, .order-card') : null;
  }

  function clearTarget() {
    if (!state.drag?.target) return;
    state.drag.target.classList.remove('drag-target', 'invalid-target', 'order-target');
    state.drag.target = null;
  }

  function isValidTarget(fromIndex, toIndex) {
    if (fromIndex === toIndex) return false;
    if (pendingSpawnTargets.has(toIndex)) return false;
    const from = state.cells[fromIndex];
    const to = state.cells[toIndex];
    if (!to) return true;
    return from.type === 'ball' &&
      to.type === 'ball' &&
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
      target.classList.add(order?.level === state.drag.item.level
        ? 'order-target'
        : 'invalid-target');
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
    const target = interactionTarget?.classList.contains('cell')
      ? interactionTarget
      : null;
    const toIndex = target ? Number(target.dataset.index) : fromIndex;
    const orderIndex = orderCard ? Number(orderCard.dataset.orderIndex) : -1;
    const orderMatches = orderCard
      ? Progression.getOrders()[orderIndex]?.level === item.level
      : false;
    const invalidDrop = wasMoved && (
      (!target && !orderCard) ||
      (orderCard && !orderMatches) ||
      (target && toIndex === fromIndex) ||
      (target && !isValidTarget(fromIndex, toIndex))
    );
    finishPointer(invalidDrop);

    if (!wasMoved) {
      if (item.type === 'ball') handleItemTap(fromIndex, item);
      return;
    }

    if (orderCard) {
      if (orderMatches) tryFulfillOrder(fromIndex, orderIndex);
      else showToast(window.t('orders.wrong_item'));
      return;
    }

    if (toIndex !== fromIndex) dropItem(fromIndex, toIndex);
  }

  function handleItemTap(index, item) {
    const now = Date.now();
    const isDoubleTap = lastItemTapIndex === index && now - lastItemTapAt <= 320;
    lastItemTapIndex = index;
    lastItemTapAt = now;
    showItemInfo(item.level, index);

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
        candidate?.type !== 'ball' ||
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

  function finishPointer(invalidDrop = false) {
    if (!state.drag) return;
    const dragState = state.drag;
    const sourceCell = cellElements[dragState.fromIndex];
    sourceCell.classList.remove('drag-source');
    clearTarget();

    if (dragState.ghost && dragState.item.type === 'ball') {
      if (invalidDrop) {
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
  }

  function dropItem(fromIndex, toIndex) {
    const from = state.cells[fromIndex];
    const to = state.cells[toIndex];
    if (!from) return;

    if (!to) {
      if (selectedCellIndex === fromIndex) selectedCellIndex = toIndex;
      state.cells[toIndex] = from;
      state.cells[fromIndex] = null;
      renderCell(fromIndex);
      renderCell(toIndex);
      return;
    }

    if (
      from.type === 'ball' &&
      to.type === 'ball' &&
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
      const shiftX = deltaX / distance * 5;
      const shiftY = deltaY / distance * 5;
      const targetEcho = toCell.querySelector('.ball-wrap').cloneNode(true);

      fromCell.style.setProperty('--merge-shift-x', `${shiftX}px`);
      fromCell.style.setProperty('--merge-shift-y', `${shiftY}px`);
      targetEcho.style.setProperty('--merge-shift-x', `${-shiftX}px`);
      targetEcho.style.setProperty('--merge-shift-y', `${-shiftY}px`);
      targetEcho.classList.add('merge-echo', 'merge-away');

      boardElement.classList.add('merge-resolving');
      fromCell.classList.add('merge-anticipation');
      toCell.classList.add('merge-anticipation');
      window.setTimeout(() => {
        fromCell.classList.remove('merge-anticipation');
        toCell.classList.remove('merge-anticipation');
        fromCell.classList.add('merge-away');

        state.cells[fromIndex] = null;
        state.cells[toIndex] = { type: 'ball', level: nextLevel };
        if (selectedCellIndex === fromIndex || selectedCellIndex === toIndex) {
          selectedCellIndex = toIndex;
        }
        renderCell(toIndex, 'merge-pop');
        playMergeSparks(cellElements[toIndex]);
        GameAudio.play('merge');
        if (selectedItemLevel === from.level) showItemInfo(nextLevel, toIndex);
        cellElements[toIndex].appendChild(targetEcho);

        window.setTimeout(() => {
          targetEcho.remove();
          renderCell(fromIndex);
          boardElement.classList.remove('merge-resolving');
        }, MERGE_DEPARTURE_MS);
      }, MERGE_ANTICIPATION_MS);
      return;
    }

    if (
      from.type === 'ball' &&
      to.type === 'ball' &&
      from.level === MAX_LEVEL &&
      to.level === MAX_LEVEL
    ) {
      showToast(TEXT.maxReached);
    } else if (from.type === 'ball' && to.type === 'ball') {
      showToast(TEXT.sameLevel);
    }
  }

  function init() {
    applyTranslations();
    loadEnergy();
    createBoard();
    document.getElementById('producerXpDebug').addEventListener('click', () => {
      if (!TESTING_MODE.enabled) return;
      const result = Progression.addProducerXp(TESTING_MODE.producerXpIncrement);
      playProducerUpgrade(result.levelUps);
      renderEconomy();
      const producerIndex = state.cells.findIndex((item) => item?.type === 'producer');
      if (!result.levelUps.length && producerIndex >= 0) showProducerInfo(producerIndex);
    });
    renderOrders();
    renderEconomy();
    renderEnergy();
    clearItemInfo();
    window.setInterval(() => {
      energyTick();
      Progression.tick(Date.now());
      updateProducerReadiness();
    }, 250);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
