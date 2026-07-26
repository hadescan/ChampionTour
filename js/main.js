(function () {
  'use strict';

  const BOARD_SIZE = 8;
  const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
  const MAX_LEVEL = 6;
  const BALL_PATH = 'assets/Football/Ball/';

  const state = {
    cells: new Array(CELL_COUNT).fill(null),
    drag: null
  };

  let boardEl;
  let cellEls = [];
  let toastTimer;

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = window.t(element.dataset.i18n);
    });

    document.getElementById('stadiumButton').setAttribute(
      'aria-label',
      window.t('prototype.stadium_aria')
    );
    document.querySelector('.level-key').setAttribute(
      'aria-label',
      window.t('prototype.max_aria')
    );
  }

  function ballSrc(level) {
    return `${BALL_PATH}ball_lv${level}.png`;
  }

  function showToast(messageKey) {
    const toast = document.getElementById('toast');
    toast.textContent = window.t(messageKey);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function createBoard() {
    boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    cellEls = [];

    for (let index = 0; index < CELL_COUNT; index += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = String(index);
      cell.tabIndex = 0;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', window.t('board.empty_cell'));
      cell.addEventListener('pointerdown', startDrag);
      boardEl.appendChild(cell);
      cellEls.push(cell);
    }
  }

  function renderCell(index, animationClass) {
    const cell = cellEls[index];
    const level = state.cells[index];

    cell.className = 'cell';
    cell.innerHTML = '';

    if (level === null) {
      cell.setAttribute('aria-label', window.t('board.empty_cell'));
      return;
    }

    cell.classList.add('occupied');
    if (animationClass) {
      void cell.offsetWidth;
      cell.classList.add(animationClass);
    }

    const image = document.createElement('img');
    image.className = 'ball';
    image.src = ballSrc(level);
    image.alt = window.t('prototype.ball_level').replace('{level}', String(level));
    image.draggable = false;
    cell.appendChild(image);

    const chip = document.createElement('span');
    chip.className = 'level-chip';
    chip.textContent = String(level);
    chip.setAttribute('aria-hidden', 'true');
    cell.appendChild(chip);

    cell.setAttribute(
      'aria-label',
      window.t('prototype.ball_level').replace('{level}', String(level))
    );
  }

  function findEmptyCell() {
    return state.cells.findIndex((value) => value === null);
  }

  function spawnBall() {
    const index = findEmptyCell();
    if (index === -1) {
      showToast('prototype.board_full');
      return;
    }

    state.cells[index] = 1;
    renderCell(index, 'spawn-pop');
  }

  function createDragGhost(level, x, y) {
    const ghost = document.createElement('img');
    ghost.className = 'drag-ghost';
    ghost.src = ballSrc(level);
    ghost.alt = '';
    ghost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ghost);
    moveGhost(ghost, x, y);
    return ghost;
  }

  function moveGhost(ghost, x, y) {
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
  }

  function startDrag(event) {
    const source = event.currentTarget;
    const fromIndex = Number(source.dataset.index);
    const level = state.cells[fromIndex];
    if (level === null || state.drag) return;

    event.preventDefault();
    source.classList.add('drag-source');

    state.drag = {
      fromIndex,
      pointerId: event.pointerId,
      ghost: createDragGhost(level, event.clientX, event.clientY),
      target: null
    };

    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', cancelDrag);
  }

  function cellFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    return element ? element.closest('.cell') : null;
  }

  function clearTarget() {
    if (!state.drag || !state.drag.target) return;
    state.drag.target.classList.remove('drag-target', 'invalid-target');
    state.drag.target = null;
  }

  function moveDrag(event) {
    if (!state.drag) return;
    moveGhost(state.drag.ghost, event.clientX, event.clientY);
    clearTarget();

    const target = cellFromPoint(event.clientX, event.clientY);
    if (!target || Number(target.dataset.index) === state.drag.fromIndex) return;

    const targetIndex = Number(target.dataset.index);
    const fromLevel = state.cells[state.drag.fromIndex];
    const targetLevel = state.cells[targetIndex];
    const valid = targetLevel === null ||
      (targetLevel === fromLevel && fromLevel < MAX_LEVEL);

    target.classList.add(valid ? 'drag-target' : 'invalid-target');
    state.drag.target = target;
  }

  function endDrag(event) {
    if (!state.drag) return;
    const target = cellFromPoint(event.clientX, event.clientY);
    const fromIndex = state.drag.fromIndex;
    const toIndex = target ? Number(target.dataset.index) : fromIndex;
    finishDrag();

    if (toIndex === fromIndex) return;
    dropBall(fromIndex, toIndex);
  }

  function cancelDrag() {
    finishDrag();
  }

  function finishDrag() {
    if (!state.drag) return;

    const source = cellEls[state.drag.fromIndex];
    source.classList.remove('drag-source');
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', cancelDrag);
    clearTarget();
    state.drag.ghost.remove();
    state.drag = null;
  }

  function dropBall(fromIndex, toIndex) {
    const fromLevel = state.cells[fromIndex];
    const toLevel = state.cells[toIndex];
    if (fromLevel === null) return;

    if (toLevel === null) {
      state.cells[toIndex] = fromLevel;
      state.cells[fromIndex] = null;
      renderCell(fromIndex);
      renderCell(toIndex);
      return;
    }

    if (fromLevel === toLevel && fromLevel < MAX_LEVEL) {
      state.cells[fromIndex] = null;
      state.cells[toIndex] = fromLevel + 1;
      renderCell(fromIndex);
      renderCell(toIndex, 'merge-pop');
      return;
    }

    showToast(fromLevel === MAX_LEVEL && toLevel === MAX_LEVEL
      ? 'prototype.max_reached'
      : 'prototype.same_level');
  }

  function init() {
    applyTranslations();
    createBoard();
    document.getElementById('stadiumButton').addEventListener('click', spawnBall);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
