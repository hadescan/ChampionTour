/**
 * orders.js
 * Sipariş sistemi (GDD -> ORDERS bölümü):
 * - Sporcular belirli seviyede item talep eder.
 * - Board'dan sürüklenen item, siparişteki chainId+level ile eşleşirse
 *   item tüketilir ve coin ödülü verilir.
 * - Aynı anda SLOT_COUNT kadar sipariş aktif olabilir.
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.Orders = (function () {
  const SLOT_COUNT = 3;

  // slots[i] = null | { chainId, level, coinReward }
  let slots = new Array(SLOT_COUNT).fill(null);
  let slotEls = [];
  let containerEl = null;

  /**
   * Seviyeye göre coin ödülü.
   * Basit bir yer tutucu formül: üst seviyeler orantısız değil, üstel artan
   * şekilde daha değerli. İleride Economy dengeleme geçişinde revize edilecek.
   */
  function calculateReward(level) {
    return Math.round(10 * Math.pow(1.6, level - 1));
  }

  /**
   * Şu an açık olan sporlardan/zincirlerden ağırlıklı rastgele bir sipariş üretir.
   * Düşük seviyeler daha sık istenir (erken oyunda ulaşılabilir olsun diye).
   */
  function generateOrder() {
    // MVP'de tek sport/chain var (football_chain). İleride birden fazla
    // unlocked chain olduğunda burada rastgele chain seçimi de yapılacak.
    const chain = window.ChampionTour.DATA.chains.football_chain;
    const weights = { 1: 0.38, 2: 0.24, 3: 0.16, 4: 0.12, 5: 0.07, 6: 0.03 };

    const roll = Math.random();
    let cumulative = 0;
    let chosenLevel = 1;
    const levels = chain.levels.map((l) => l.level);

    for (const level of levels) {
      cumulative += weights[level] || 0;
      if (roll <= cumulative) {
        chosenLevel = level;
        break;
      }
    }

    return {
      chainId: chain.id,
      level: chosenLevel,
      coinReward: calculateReward(chosenLevel)
    };
  }

  function init(rootEl) {
    containerEl = rootEl;
    containerEl.innerHTML = '';
    slotEls = [];

    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'order-slot';
      slotEl.dataset.slotIndex = String(i);
      containerEl.appendChild(slotEl);
      slotEls.push(slotEl);

      slots[i] = generateOrder();
      renderSlot(i);
    }
  }

  function renderSlot(index) {
    const slotEl = slotEls[index];
    const order = slots[index];
    slotEl.innerHTML = '';

    if (!order) {
      slotEl.dataset.filled = 'false';
      return;
    }

    slotEl.dataset.filled = 'false';

    const chain = window.ChampionTour.DATA.chains[order.chainId];
    const levelDef = chain.levels.find((l) => l.level === order.level);

    const img = document.createElement('img');
    img.className = 'order-icon';
    img.src = `assets/icons/${levelDef.icon}`;
    img.draggable = false;
    img.alt = window.t(levelDef.nameKey);
    slotEl.appendChild(img);

    const rewardEl = document.createElement('div');
    rewardEl.className = 'order-reward';
    rewardEl.innerHTML = `<span class="order-reward-icon">🪙</span>${order.coinReward}`;
    slotEl.appendChild(rewardEl);

    slotEl.setAttribute(
      'aria-label',
      `${window.t(levelDef.nameKey)} — ${order.coinReward} coin`
    );
  }

  /**
   * Board'dan sürüklenen bir item'ı belirli bir sipariş slotuna teslim etmeyi dener.
   * Eşleşme yoksa hiçbir şey değişmez (item board'da kalır).
   */
  function tryFulfillFromBoard(fromIndex, slotIndex) {
    const order = slots[slotIndex];
    if (!order) return false;

    const item = window.ChampionTour.Board.getCell(fromIndex);
    if (!item || item.kind !== 'item') return false;

    if (item.chainId !== order.chainId || item.level !== order.level) {
      window.ChampionTour.UI.showToast(window.t('orders.wrong_item'));
      return false;
    }

    // Eşleşme başarılı: item'ı board'dan kaldır, coin ver, yeni sipariş üret.
    window.ChampionTour.Board.setCell(fromIndex, null);

    window.ChampionTour.GameState.coins += order.coinReward;
    updateCoinDisplay();

    window.ChampionTour.UI.showToast(`+${order.coinReward} 🪙`);

    slots[slotIndex] = generateOrder();
    renderSlot(slotIndex);
    playFulfillPop(slotIndex);

    return true;
  }

  function playFulfillPop(slotIndex) {
    const slotEl = slotEls[slotIndex];
    slotEl.classList.remove('order-fulfilled-pop');
    void slotEl.offsetWidth;
    slotEl.classList.add('order-fulfilled-pop');
  }

  return {
    init,
    tryFulfillFromBoard,
    SLOT_COUNT
  };
})();
