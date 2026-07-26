/**
 * board.js
 * 7x9 grid render + hücre state yönetimi.
 * Kurallar (AGENTS.md): bir hücrede bir obje, producer bir hücre kaplar,
 * sadece aynı seviyedeki aynı item'lar merge olur, çapraz merge yok.
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Board = (function () {
  const { columns, rows } = window.ChampionTour.DATA.board;
  const totalCells = columns * rows;

  // cells[i] = null | { kind: 'item', chainId, level } | { kind: 'producer', producerId }
  let cells = new Array(totalCells).fill(null);

  let boardEl = null;
  let cellEls = [];

  // Sürükleme state'i
  let dragState = null;

  function init(rootEl) {
    boardEl = rootEl;
    boardEl.innerHTML = '';
    cellEls = [];

    for (let i = 0; i < totalCells; i++) {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.dataset.index = String(i);
      cellEl.tabIndex = 0;
      cellEl.setAttribute('role', 'gridcell');
      cellEl.setAttribute('aria-label', window.t('board.empty_cell'));
      boardEl.appendChild(cellEl);
      cellEls.push(cellEl);

      cellEl.addEventListener('pointerdown', onPointerDown);
    }
  }

  function indexToRowCol(index) {
    return { row: Math.floor(index / columns), col: index % columns };
  }

  function rowColToIndex(row, col) {
    return row * columns + col;
  }

  function getCell(index) {
    return cells[index];
  }

  function setCell(index, value) {
    cells[index] = value;
    renderCell(index);
  }

  function findFirstEmptyCell() {
    for (let i = 0; i < totalCells; i++) {
      if (cells[i] === null) return i;
    }
    return -1;
  }

  function isFull() {
    return findFirstEmptyCell() === -1;
  }

  function renderCell(index) {
    const cellEl = cellEls[index];
    const data = cells[index];

    cellEl.innerHTML = '';
    cellEl.classList.remove('occupied', 'producer-cell');

    if (!data) {
      cellEl.setAttribute('aria-label', window.t('board.empty_cell'));
      return;
    }

    if (data.kind === 'item') {
      cellEl.classList.add('occupied');
      const chain = window.ChampionTour.DATA.chains[data.chainId];
      const levelDef = chain.levels.find((l) => l.level === data.level);
      const img = document.createElement('img');
      img.className = 'cell-icon';
      img.src = `assets/icons/${levelDef.icon}`;
      img.draggable = false;
      img.alt = window.t(levelDef.nameKey);
      cellEl.appendChild(img);
      cellEl.setAttribute('aria-label', window.t(levelDef.nameKey));
    }

    if (data.kind === 'producer') {
      cellEl.classList.add('producer-cell');
      const def = window.ChampionTour.DATA.producers[data.producerId];
      cellEl.setAttribute('aria-label', window.t(def.nameKey));
      window.ChampionTour.Producer.renderProducerCell(cellEl, data.producerId);
    }
  }

  function renderAll() {
    for (let i = 0; i < totalCells; i++) renderCell(i);
  }

  function playMergePop(index) {
    const cellEl = cellEls[index];
    cellEl.classList.remove('merge-pop');
    // reflow ile animasyonu yeniden tetikle
    void cellEl.offsetWidth;
    cellEl.classList.add('merge-pop');
  }

  // ---------------- DRAG & DROP (Pointer Events: mouse + touch birleşik) ----------------

  function onPointerDown(e) {
    const index = Number(e.currentTarget.dataset.index);
    const data = cells[index];

    // Producer hücresi kendi click mantığını yönetir (üretim tetikleme).
    if (data && data.kind === 'producer') {
      window.ChampionTour.Producer.onProducerTap(index, e);
      return;
    }

    if (!data || data.kind !== 'item') return;

    dragState = {
      fromIndex: index,
      pointerId: e.pointerId,
      ghostEl: null
    };

    const cellEl = e.currentTarget;
    cellEl.setPointerCapture(e.pointerId);

    // Basit görsel geri bildirim: sürüklenen hücreyi hafif küçült.
    cellEl.style.opacity = '0.5';

    cellEl.addEventListener('pointermove', onPointerMove);
    cellEl.addEventListener('pointerup', onPointerUp);
    cellEl.addEventListener('pointercancel', onPointerCancel);
  }

  function elementFromDrag(e) {
    // pointer capture aktifken elementFromPoint doğru hedefi bulmak için kullanılır.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return null;
    return el.closest('.cell, .order-slot');
  }

  let lastHoverEl = null;

  function onPointerMove(e) {
    if (!dragState) return;
    const target = elementFromDrag(e);
    if (lastHoverEl && lastHoverEl !== target) {
      lastHoverEl.classList.remove('drag-over', 'order-drag-over');
    }

    if (!target) {
      lastHoverEl = null;
      return;
    }

    if (target.classList.contains('order-slot')) {
      if (target.dataset.filled === 'true') {
        lastHoverEl = null;
        return;
      }
      target.classList.add('order-drag-over');
      lastHoverEl = target;
      return;
    }

    if (target !== cellEls[dragState.fromIndex]) {
      const targetIndex = Number(target.dataset.index);
      const targetData = cells[targetIndex];
      if (targetData === null || (targetData.kind === 'item')) {
        target.classList.add('drag-over');
        lastHoverEl = target;
      } else {
        lastHoverEl = null;
      }
    } else {
      lastHoverEl = null;
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    const fromIndex = dragState.fromIndex;
    const cellEl = cellEls[fromIndex];
    cellEl.style.opacity = '';

    if (lastHoverEl) lastHoverEl.classList.remove('drag-over', 'order-drag-over');

    const target = elementFromDrag(e);
    cleanupDrag(cellEl);

    if (!target) return;

    if (target.classList.contains('order-slot')) {
      const slotIndex = Number(target.dataset.slotIndex);
      window.ChampionTour.Orders.tryFulfillFromBoard(fromIndex, slotIndex);
      return;
    }

    const toIndex = Number(target.dataset.index);
    if (toIndex === fromIndex) return;

    handleDrop(fromIndex, toIndex);
  }

  function onPointerCancel(e) {
    if (!dragState) return;
    const cellEl = cellEls[dragState.fromIndex];
    cellEl.style.opacity = '';
    if (lastHoverEl) lastHoverEl.classList.remove('drag-over');
    cleanupDrag(cellEl);
  }

  function cleanupDrag(cellEl) {
    cellEl.removeEventListener('pointermove', onPointerMove);
    cellEl.removeEventListener('pointerup', onPointerUp);
    cellEl.removeEventListener('pointercancel', onPointerCancel);
    dragState = null;
    lastHoverEl = null;
  }

  function handleDrop(fromIndex, toIndex) {
    const fromData = cells[fromIndex];
    const toData = cells[toIndex];

    if (!fromData || fromData.kind !== 'item') return;

    // Boş hücreye bırakma: taşı.
    if (toData === null) {
      setCell(toIndex, fromData);
      setCell(fromIndex, null);
      return;
    }

    // Dolu hücreye bırakma: merge dene.
    if (toData.kind === 'item') {
      const merged = window.ChampionTour.Merge.tryMerge(fromData, toData);
      if (merged) {
        setCell(fromIndex, null);
        setCell(toIndex, merged);
        playMergePop(toIndex);
      }
      // Merge olmuyorsa hiçbir şey yapma (item olduğu yerde kalır).
    }
  }

  function getCellEl(index) {
    return cellEls[index];
  }

  return {
    columns,
    rows,
    totalCells,
    init,
    getCell,
    setCell,
    getCellEl,
    findFirstEmptyCell,
    isFull,
    renderAll,
    playMergePop,
    indexToRowCol,
    rowColToIndex
  };
})();
