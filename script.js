(function () {
  'use strict';

  const BOARD_COLUMNS = 7;
  const BOARD_ROWS = 9;
  const CELL_COUNT = BOARD_COLUMNS * BOARD_ROWS;
  const DATA = window.ChampionTour.GameData;
  const Progression = window.ChampionTour.Progression;
  const Academy = window.ChampionTour.AcademyProgression;
  const GameAudio = window.ChampionTour.Audio;
  const TESTING_MODE = DATA.testing;
  const PRODUCER_STARTS = Object.freeze([
    Object.freeze({ index: 24, producerId: 'ball_basket' }),
    Object.freeze({ index: 25, producerId: 'equipment_locker' }),
    Object.freeze({ index: 31, producerId: 'training_cart' }),
    Object.freeze({ index: 32, producerId: 'trophy_cabinet' })
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
  const ORDER_DELIVERY_MS = 180;
  const ORDER_CARD_RESOLVE_MS = 310;
  const ORDER_REWARD_START_MS = 105;
  const ORDER_REWARD_FLIGHT_MS = 470;
  const ORDER_COUNTER_PULSE_MS = 240;

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
  let orderReadinessScheduled = false;
  const counterAnimations = new Map();

  function itemSource(chainId, level) {
    if (chainId === 'footballs') return DATA.items[level].sprite;
    const palettes = {
      equipment: ['#3b8eaa', '#9bd8df', '#fff0c6'],
      training: ['#dc713d', '#f6b45f', '#fff0bd'],
      trophies: ['#b77b25', '#edc151', '#fff4b3']
    };
    const [dark, primary, light] = palettes[chainId] || ['#397d68', '#69b98a', '#e8f5d0'];
    const equipmentShapes = [
      '',
      '<path d="M39 18h45v48q0 8 9 10l17 5q8 3 5 12-4 14-23 14H61q-22 0-22-21z" fill="url(#g)"/><path d="M40 34h43M50 86q16 8 32 0" class="line"/>',
      '<path d="M27 71q18 3 30-30l22 10-5 17 28 8q8 15-10 22H38q-20-3-11-27z" fill="url(#g)"/><path d="M44 72h28M50 62l9 7" class="line"/>',
      '<path d="M39 27q25-12 50 0l-5 64q-20 18-40 0z" fill="url(#g)"/><path d="M50 42h28M45 58h38" class="line"/>',
      '<path d="M33 36l20-15 11 12 11-12 20 15-12 18v50H45V54z" fill="url(#g)"/><path d="M54 36q10 10 20 0" class="line"/>',
      '<path d="M37 76V39q0-14 11-14 8 0 8 13V22q0-10 9-10t9 10v15q0-11 9-11t9 11v34q0 28-27 34-23-4-28-29z" fill="url(#g)"/><path d="M48 66h34" class="line"/>',
      '<path d="M25 48q39-28 78 0v50H25z" fill="url(#g)"/><path d="M44 48q0-24 20-24t20 24M35 65h58M64 66v32" class="line"/>'
    ];
    const trainingShapes = [
      '',
      '<path d="M52 21h24l23 79H29z" fill="url(#g)"/><path d="M40 72h48M46 51h36" class="line"/>',
      '<path d="M27 37h12v59H27zm62 0h12v59H89zM35 49h58v13H35z" fill="url(#g)"/><path d="M31 80h66" class="line"/>',
      '<path d="M29 23h70v81H29z" fill="none" stroke="url(#g)" stroke-width="9"/><path d="M29 44h70M29 64h70M29 84h70M46 23v81M64 23v81M82 23v81" class="line"/>',
      '<path d="M24 34h80v68H24z" fill="none" stroke="url(#g)" stroke-width="9"/><path d="M28 97l72-58M100 97L28 39" class="line"/>',
      '<circle cx="64" cy="63" r="44" fill="url(#g)"/><circle cx="64" cy="63" r="29" fill="none" class="line"/><circle cx="64" cy="63" r="12" fill="#fff2bd"/>',
      '<path d="M18 38h92v66H18z" fill="none" stroke="url(#g)" stroke-width="9"/><circle cx="64" cy="68" r="22" fill="#fff2bd" opacity=".72"/><path d="M28 45l72 52M100 45L28 97" class="line"/>'
    ];
    const trophyShapes = [
      '',
      '<circle cx="64" cy="51" r="27" fill="url(#g)"/><path d="M48 72l-8 35 24-13 24 13-8-35" fill="url(#g)"/><path d="M64 38v26" class="line"/>',
      '<path d="M39 24h50v32q0 29-25 34-25-5-25-34z" fill="url(#g)"/><path d="M39 37H24q0 27 22 28M89 37h15q0 27-22 28M64 89v15M45 106h38" class="line"/>',
      '<path d="M35 20h58v38q0 31-29 36-29-5-29-36z" fill="url(#g)"/><path d="M35 34H19q0 31 24 33M93 34h16q0 31-24 33M64 93v13M42 108h44" class="line"/>',
      '<path d="M31 18h66v42q0 34-33 39-33-5-33-39z" fill="url(#g)"/><path d="M31 32H15q0 35 26 38M97 32h16q0 35-26 38M64 98v10M39 110h50" class="line"/>',
      '<path d="M25 18h78v45q0 35-39 42-39-7-39-42z" fill="url(#g)"/><path d="M25 33H10q0 36 25 42M103 33h15q0 36-25 42M64 104v7M35 113h58" class="line"/><path d="M64 33l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#fff1a6"/>',
      '<path d="M22 29l14-18 14 18 14-18 14 18 14-18 14 18-9 74H31z" fill="url(#g)"/><path d="M43 50h42M64 43v42M38 108h52" class="line"/>'
    ];
    const shape = {
      equipment: equipmentShapes,
      training: trainingShapes,
      trophies: trophyShapes
    }[chainId]?.[level] || '';
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop stop-color="${light}"/><stop offset=".55" stop-color="${primary}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
      `<style>.line{fill:none;stroke:#fff7d4;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}</style></defs>` +
      `<ellipse cx="64" cy="111" rx="40" ry="8" fill="#31594b" opacity=".17"/>${shape}` +
      `</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function producerSource(producerId = 'ball_basket') {
    const shapes = {
      ball_basket:
        '<path d="M19 39h90l-8 70H27z" fill="url(#g)"/><path d="M28 45l72 57M100 45l-72 57M42 40l-9 67M62 40l2 69M84 40l10 67" class="line"/><circle cx="45" cy="43" r="19" fill="#fff5da" stroke="#4d8c7a" stroke-width="4"/><circle cx="78" cy="38" r="20" fill="#f6efe0" stroke="#4d8c7a" stroke-width="4"/><path d="M45 30l8 6-3 10H40l-3-10zM78 24l9 7-3 11H72l-4-11z" fill="#375e65"/>',
      equipment_locker:
        '<rect x="29" y="14" width="70" height="99" rx="12" fill="url(#g)"/><path d="M64 17v93M48 45h11M70 45h11" class="line"/><path d="M41 60l12-8 11 10 11-10 12 8-8 14v25H49V74z" fill="#f7e5b5"/>',
      training_cart:
        '<path d="M18 51h92l-9 45H28z" fill="url(#g)"/><path d="M31 50l11-30h14l9 30M67 50l9-37h13l7 37" class="line"/><circle cx="40" cy="105" r="10" fill="#365d62"/><circle cx="91" cy="105" r="10" fill="#365d62"/><path d="M38 40h55" class="line"/>',
      trophy_cabinet:
        '<rect x="22" y="12" width="84" height="104" rx="13" fill="url(#g)"/><rect x="31" y="22" width="66" height="73" rx="7" fill="#cce9e2" opacity=".72"/><path d="M64 23v72M31 59h66" class="line"/><path d="M40 34h17v13q0 10-9 13-9-3-9-13zM72 67h18v14q0 10-9 13-9-3-9-13z" fill="#f5cc58"/><path d="M34 101h60" class="line"/>'
    };
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f2d496"/><stop offset=".55" stop-color="#6db3a0"/><stop offset="1" stop-color="#387967"/></linearGradient><style>.line{fill:none;stroke:#fff1c0;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}</style></defs>` +
      `<ellipse cx="64" cy="108" rx="44" ry="10" fill="#274f46" opacity=".2"/>` +
      `${shapes[producerId] || ''}` +
      `</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
    const timerRow = document.getElementById('energyTimerRow');
    const fill = document.getElementById('energyFill');

    value.textContent = String(state.energy);
    fill.style.width = `${(state.energy / MAX_ENERGY) * 100}%`;

    if (state.energy >= MAX_ENERGY) {
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

  function itemName(chainId, level) {
    return DATA.chains[chainId]?.itemNames[level] || window.t(`item.football.lv${level}`);
  }

  function itemDescription(chainId, level) {
    if (chainId === 'footballs') return window.t(`item.football.lv${level}.description`);
    return `${DATA.chains[chainId].name} • ${level}. seviye futbol akademisi ekipmanı.`;
  }

  function selectCell(index) {
    if (selectedCellIndex >= 0) {
      cellElements[selectedCellIndex]?.classList.remove('item-selected');
    }
    selectedCellIndex = index;
    cellElements[index]?.classList.add('item-selected');
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
    if (index >= 0) selectCell(index);

    clearTimeout(itemInfoTimer);
    if (
      selectedItemLevel === level &&
      selectedCellIndex === index &&
      panel.classList.contains('is-visible')
    ) return;

    function reveal() {
      selectedItemLevel = level;
      name.textContent = itemName(chainId, level);
      description.textContent = itemDescription(chainId, level);
      icon.src = itemSource(chainId, level);
      icon.alt = itemName(chainId, level);
      levelElement.textContent = window.t('item.info.level').replace('{level}', String(level));
      producerElement.textContent = window.t('item.info.from').replace(
        '{producer}',
        DATA.producers[DATA.chains[chainId].producerId].name
      );
      rarityElement.textContent = window.t(definition.rarityKey);
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
  }

  function showProducerInfo(index) {
    const panel = document.getElementById('itemInfoPanel');
    const producerId = state.cells[index]?.producerId || 'ball_basket';
    const producerState = Progression.getProducerState(producerId);
    const debugButton = document.getElementById('producerXpDebug');
    clearTimeout(itemInfoTimer);
    selectedItemLevel = null;
    selectCell(index);
    document.getElementById('itemInfoIcon').src = producerSource(producerId);
    document.getElementById('itemInfoIcon').alt = producerState.name;
    document.getElementById('itemInfoName').textContent = producerState.name;
    document.getElementById('itemInfoLevel').textContent =
      window.t('producer.progress.level').replace('{level}', String(producerState.level));
    document.getElementById('itemInfoDescription').textContent = producerState.isMaxLevel
      ? window.t('producer.progress.max')
      : window.t('producer.progress.xp')
        .replace('{current}', String(producerState.xp))
        .replace('{required}', String(producerState.xpToNext));
    document.getElementById('itemInfoProducer').textContent =
      window.t('producer.produces').replace('{item}', itemName(producerState.chainId, 1));
    document.getElementById('itemInfoRarity').textContent = '';
    document.getElementById('itemInfoNext').textContent = window.t('producer.ready');
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

  function saveBoardState() {
    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify({
        version: 2,
        cells: state.cells
      }));
    } catch (error) {
      console.warn('Board kaydı yazılamadı.', error);
    }
  }

  function loadBoardState() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(BOARD_STORAGE_KEY));
    } catch (error) {
      console.warn('Board kaydı okunamadı; güvenli başlangıç kullanılacak.', error);
    }
    if (Array.isArray(saved?.cells) && saved.cells.length === CELL_COUNT) {
      state.cells = saved.cells.map((item) => {
        if (item?.type === 'producer' && DATA.producers[item.producerId]) {
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
      });
    }

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
      const producerName = document.createElement('span');
      producerName.className = 'producer-name-tag';
      producerName.textContent = producerState.name;
      cell.appendChild(producerName);

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

  function analyzeOrderReadiness(order) {
    const requirements = orderRequirements(order).map((requirement) => ({
      ...requirement,
      available: boardItemCount(requirement.chainId, requirement.level)
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

    document.querySelectorAll('.order-card').forEach((card) => {
      const orderIndex = Number(card.dataset.orderIndex);
      const order = orders[orderIndex];
      const presenting = card.classList.contains('order-presenting');
      const readiness = order && !presenting
        ? analyzeOrderReadiness(order)
        : { requirements: [], partial: false, full: false };
      card.classList.toggle('order-partial', readiness.partial && !readiness.full);
      card.classList.toggle('order-ready', readiness.full);
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

  function renderOrders() {
    const root = document.getElementById('ordersStrip');
    root.innerHTML = '';
    Progression.getOrders().forEach((order, index) => {
      root.appendChild(createOrderCard(order, index));
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
    scheduleOrderReadinessUpdate();
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

  function playOrderDelivery(ghost, card, chainId, itemLevel) {
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
    ghost.classList.add('order-delivery');
    window.setTimeout(() => ghost.remove(), ORDER_DELIVERY_MS);
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
    deliveries.forEach((delivery) => {
      playOrderDelivery(delivery.ghost, card, delivery.chainId, delivery.level);
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

  function createProducerLaunch(targetIndex, producerIndex, chainId, onComplete) {
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
      image.alt = itemName(chainId, 1);
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
          state.cells[targetIndex] = { type: 'ball', chainId, level: 1 };
          saveBoardState();
          renderCell(targetIndex);
          adoptLandingVisual();
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
    image.src = itemSource(chainId, 1);
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
      const { targetIndex, producerIndex, chainId } = spawn;
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
          createProducerLaunch(targetIndex, producerIndex, chainId, finishVisual);
        } catch (error) {
          pendingSpawnTargets.delete(targetIndex);
          cellElements[targetIndex]?.classList.remove('spawn-reserved');
          if (state.cells[targetIndex] === null) {
            state.cells[targetIndex] = { type: 'ball', chainId, level: 1 };
            saveBoardState();
            renderCell(targetIndex);
          }
          finishVisual();
        }
      }, delay);
    }
  }

  function enqueueSpawnVisual(targetIndex, producerIndex, chainId) {
    spawnVisualQueue.push({ targetIndex, producerIndex, chainId });
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

    if (!spendEnergy(PRODUCTION_COST)) {
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
    enqueueSpawnVisual(emptyIndex, producerIndex, chainId);
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
      ghost = document.createElement('img');
      ghost.classList.add('producer-ghost');
      ghost.src = producerSource(item.producerId);
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
    const shouldProduce = !pointer.moved;
    const target = pointer.moved
      ? cellFromPoint(event.clientX, event.clientY)
      : null;
    const targetIndex = target ? Number(target.dataset.index) : pointer.producerIndex;
    const producerIndex = pointer.producerIndex;
    finishProducerPointer();
    if (shouldProduce) {
      activateProducer(producerIndex);
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
      (!target && !orderCard) ||
      (orderCard && !orderMatches) ||
      (target && toIndex === fromIndex) ||
      (target && !isValidTarget(fromIndex, toIndex))
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

  function init() {
    applyTranslations();
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
    renderEconomy();
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
