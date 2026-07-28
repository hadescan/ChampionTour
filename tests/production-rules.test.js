const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();
const context = {
  console,
  Math,
  Date,
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  }
};
context.window = context;
vm.createContext(context);

for (const file of ['js/game-data.js', 'js/production-rules.js', 'js/progression.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const rules = context.ChampionTour.ProductionRules;
assert.equal(context.ChampionTour.GameData.testing.infiniteEnergyInTest, true);
assert.deepEqual(
  Array.from(context.ChampionTour.GameData.productionModes.energyOptions),
  [1, 2, 4, 8, 16]
);
assert.deepEqual([1, 2, 4, 8, 16].map(rules.levelForEnergy), [1, 2, 3, 4, 5]);
assert.equal(rules.maxLevelForChain('footballs'), 6);
assert.deepEqual(
  Array.from(rules.supportedEnergyOptions('footballs')),
  [1, 2, 4, 8, 16]
);
assert.equal(rules.resultForEnergy(4, () => 0).level, 3);
assert.equal(rules.resultForEnergy(16, () => 0).level, 5);
assert.equal(rules.resultForEnergy(1, () => 0.001).level, 4);
assert.equal(rules.resultForEnergy(1, () => 0.001).rare, true);
assert.equal(rules.resultForEnergy(1, () => 0.01).level, 3);
assert.equal(rules.resultForEnergy(1, () => 0.9).level, 1);
assert.equal(rules.resultForEnergy(1, () => 0.9).rare, false);

const progression = context.ChampionTour.Progression;
assert.equal(progression.getOrders().length, 6);
assert.equal(progression.queueMaxItemSpecialOrder('footballs'), true);
assert.equal(progression.queueMaxItemSpecialOrder('footballs'), false);
assert.equal(progression.getOrders().length, 6);

const first = progression.getOrders()[0];
const delivered = first.items.flatMap((item) =>
  Array.from({ length: item.quantity }, () => ({ chainId: item.chainId, level: item.level }))
);
assert.ok(progression.fulfillOrder(0, delivered));
const active = progression.getOrders();
assert.equal(active.length, 6);
assert.equal(active[0].special, true);
assert.equal(active[0].items.length, 1);
assert.equal(active[0].items[0].quantity, 3);
assert.equal(active[0].specialMaxLevel, 6);
assert.equal(active[0].specialRequiredCount, 3);
assert.equal(active[0].rewards.gems, 1);

console.log('production-rules.test.js: all assertions passed');
