(function () {
  'use strict';

  const BOARD_COLUMNS = 7;
  const BOARD_ROWS = 9;
  const CELL_COUNT = BOARD_COLUMNS * BOARD_ROWS;
  const MAX_LEVEL = 6;
  const MAX_ENERGY = 100;
  const PRODUCTION_COST = 1;
  const REGEN_INTERVAL_MS = 2 * 60 * 1000;
  const TEST_MODE_UNLIMITED_ENERGY = true;
  const STORAGE_KEY = 'championTour.prototype.energy.v1';
  const BALL_PATH = 'assets/Football/Ball/';
  const PRODUCER_SOURCE = 'assets/Football/Producer/producer_lv1.png';
  const SHADOW_SOURCE = 'assets/Football/shadow.png';
  const DRAG_THRESHOLD = 7;
  const PRODUCER_PRESS_MS = 280;
  const MERGE_DEPARTURE_MS = 180;
  const DRAG_FOLLOW_OFFSET = 4;
  const DRAG_MAX_TILT = 3;
  const DROP_SETTLE_MS = 100;
  const INVALID_DROP_MS = 150;
  const SPAWN_FLIGHT_MS = 362;
  const MERGE_SPARK_MS = 250;

  const TEXT = {
    emptyCell: 'Boş hücre',
    producer: 'Futbol Antrenman Tesisi',
    ballLevel: (level) => `Seviye ${level} futbol topu`,
    boardFull: 'Tahta dolu',
    noEnergy: 'Enerjin bitti',
    maxReached: 'Maksimum seviyeye ulaşıldı',
    sameLevel: 'Yalnızca aynı seviyedeki toplar birleşir',
    full: 'Dolu'
  };

  const state = {
    cells: new Array(CELL_COUNT).fill(null),
    drag: null,
    energy: MAX_ENERGY,
    nextEnergyAt: null
  };

  let boardElement;
  let cellElements = [];
  let toastTimer;

  function ballSource(level) {
    return `${BALL_PATH}ball_lv${level}.png`;
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
    if (TEST_MODE_UNLIMITED_ENERGY) {
      state.energy = MAX_ENERGY;
      state.nextEnergyAt = null;
      saveEnergy();
      return;
    }

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
    if (TEST_MODE_UNLIMITED_ENERGY) {
      state.energy = MAX_ENERGY;
      state.nextEnergyAt = null;
      return false;
    }

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
    if (TEST_MODE_UNLIMITED_ENERGY) {
      state.energy = MAX_ENERGY;
      state.nextEnergyAt = null;
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

    state.cells[0] = { type: 'producer' };
    renderCell(0);
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
      producerImage.src = PRODUCER_SOURCE;
      producerImage.alt = '';
      producerImage.draggable = false;
      producerImage.setAttribute('aria-hidden', 'true');
      producerWrapper.appendChild(producerImage);
      cell.appendChild(producerWrapper);
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
    cell.setAttribute('aria-label', TEXT.ballLevel(item.level));
  }

  function updateProducerReadiness() {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    if (!producerCell) return;
    producerCell.classList.toggle('ready', state.energy >= PRODUCTION_COST);
  }

  function randomEmptyCell() {
    const emptyIndexes = [];
    state.cells.forEach((item, index) => {
      if (!item) emptyIndexes.push(index);
    });

    if (emptyIndexes.length === 0) return -1;
    return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
  }

  function createSpawnFlight(targetIndex) {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    const targetCell = cellElements[targetIndex];
    const producerRect = producerCell.getBoundingClientRect();
    const targetRect = targetCell.getBoundingClientRect();
    const itemGroundOffset =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--item-ground-offset')
      ) || 0;

    const flight = document.createElement('div');
    flight.className = 'spawn-flight';
    flight.style.left = `${producerRect.left + producerRect.width / 2}px`;
    flight.style.top = `${producerRect.top + producerRect.height / 2}px`;
    flight.style.width = `${targetRect.width * .92}px`;
    flight.style.height = `${targetRect.height * .92}px`;
    const travelX =
      targetRect.left + targetRect.width / 2 -
      (producerRect.left + producerRect.width / 2);
    const travelY =
      targetRect.top + targetRect.height / 2 + itemGroundOffset -
      (producerRect.top + producerRect.height / 2);

    flight.style.setProperty('--spawn-travel-x', `${travelX}px`);
    flight.style.setProperty('--spawn-travel-y', `${travelY}px`);
    flight.style.setProperty('--spawn-exit-x', `${travelX * .12}px`);
    flight.style.setProperty('--spawn-exit-y', `${travelY * .12}px`);

    const shadow = createItemShadow();
    shadow.classList.add('spawn-flight-shadow');
    flight.appendChild(shadow);

    const image = document.createElement('img');
    image.className = 'spawn-flight-ball';
    image.src = ballSource(1);
    image.alt = '';
    image.draggable = false;
    image.setAttribute('aria-hidden', 'true');
    flight.appendChild(image);

    document.body.appendChild(flight);
    boardElement.classList.add('spawn-resolving');

    window.setTimeout(() => {
      flight.remove();
      renderCell(targetIndex);
      boardElement.classList.remove('spawn-resolving');
    }, SPAWN_FLIGHT_MS);
  }

  function createMergeSparks(cell) {
    const particles = document.createElement('div');
    particles.className = 'merge-sparks';
    particles.setAttribute('aria-hidden', 'true');

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
      particles.appendChild(spark);
    });

    cell.appendChild(particles);
    window.setTimeout(() => particles.remove(), MERGE_SPARK_MS);
  }

  function activateProducer() {
    const producerCell = cellElements.find((cell, index) => state.cells[index]?.type === 'producer');
    if (producerCell) {
      producerCell.classList.remove('producer-pressed');
      void producerCell.offsetWidth;
      producerCell.classList.add('producer-pressed');
      window.setTimeout(() => producerCell.classList.remove('producer-pressed'), PRODUCER_PRESS_MS);
    }

    const emptyIndex = randomEmptyCell();
    if (emptyIndex === -1) {
      showToast(TEXT.boardFull);
      return;
    }

    if (!spendEnergy(PRODUCTION_COST)) {
      showToast(TEXT.noEnergy);
      return;
    }

    state.cells[emptyIndex] = { type: 'ball', level: 1 };
    createSpawnFlight(emptyIndex);
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
      ghost.src = PRODUCER_SOURCE;
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

  function beginPointer(event) {
    const source = event.currentTarget;
    const fromIndex = Number(source.dataset.index);
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

  function clearTarget() {
    if (!state.drag?.target) return;
    state.drag.target.classList.remove('drag-target', 'invalid-target');
    state.drag.target = null;
  }

  function isValidTarget(fromIndex, toIndex) {
    if (fromIndex === toIndex) return false;
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
    const target = cellFromPoint(event.clientX, event.clientY);
    if (!target || Number(target.dataset.index) === state.drag.fromIndex) return;

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
    const target = wasMoved ? cellFromPoint(event.clientX, event.clientY) : null;
    const toIndex = target ? Number(target.dataset.index) : fromIndex;
    const invalidDrop = wasMoved && (
      !target ||
      toIndex === fromIndex ||
      !isValidTarget(fromIndex, toIndex)
    );
    finishPointer(invalidDrop);

    if (!wasMoved) {
      if (item.type === 'producer') activateProducer();
      return;
    }

    if (toIndex !== fromIndex) dropItem(fromIndex, toIndex);
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

      cellElements[fromIndex].classList.add('merge-away');
      boardElement.classList.add('merge-resolving');

      state.cells[fromIndex] = null;
      state.cells[toIndex] = { type: 'ball', level: nextLevel };
      renderCell(toIndex, 'merge-pop');
      createMergeSparks(cellElements[toIndex]);
      cellElements[toIndex].appendChild(targetEcho);

      window.setTimeout(() => {
        targetEcho.remove();
        renderCell(fromIndex);
        boardElement.classList.remove('merge-resolving');
      }, MERGE_DEPARTURE_MS);
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
    loadEnergy();
    createBoard();
    renderEnergy();
    window.setInterval(energyTick, 250);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
