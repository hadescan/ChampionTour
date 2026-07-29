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
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  }
};
context.window = context;
vm.createContext(context);

for (const file of [
  'js/game-data.js',
  'js/producer-progression.js',
  'js/production-rules.js',
  'js/progression.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const rules = context.ChampionTour.ProductionRules;
assert.equal(context.ChampionTour.GameData.testing.infiniteEnergyInTest, true);
assert.deepEqual(
  Array.from(context.ChampionTour.GameData.productionModes.energyOptions),
  [1, 2, 4, 8, 16]
);
assert.deepEqual([1, 2, 4, 8, 16].map(rules.levelForEnergy), [1, 2, 3, 4, 5]);
assert.equal(rules.maxLevelForChain('footballs'), 12);
assert.deepEqual(
  Array.from(rules.supportedEnergyOptions('footballs')),
  [1, 2, 4, 8, 16]
);
assert.equal(rules.resultForEnergy(4, () => 0).level, 3);
assert.equal(rules.resultForEnergy(16, () => 0).level, 5);
assert.equal(rules.resultForEnergy(1, () => 0.9).level, 2);
assert.equal(rules.resultForEnergy(1, () => 0.9).rare, true);
assert.equal(rules.resultForEnergy(1, () => 0.1).level, 1);
assert.equal(rules.resultForEnergy(1, () => 0.1).rare, false);

const producerProgression = context.ChampionTour.ProducerProgression;
assert.equal('charges' in producerProgression.getProducerState('ball_basket'), false);
assert.equal(typeof producerProgression.consumeCharge, 'undefined');
const upgrade = producerProgression.addReputation(100);
assert.equal(upgrade.upgrades[0].producerId, 'ball_basket');
assert.equal(producerProgression.getProducerState('ball_basket').level, 2);

producerProgression.evaluateMastery({ footballs: 3 });
assert.equal(producerProgression.getMasteryOrders().length, 1);
assert.equal(producerProgression.getMasteryOrders()[0].level, 12);
assert.equal(producerProgression.getMasteryOrders()[0].quantity, 3);

const progression = context.ChampionTour.Progression;
assert.equal(progression.getOrders().length, 6);
assert.equal(typeof progression.queueMaxItemSpecialOrder, 'undefined');
assert.equal(typeof progression.addProducerXp, 'undefined');
assert.equal(typeof progression.consumeCharge, 'undefined');
assert.equal(progression.getOrders().length, 6);
assert.equal(progression.getOrders().some((order) => order.items.length === 1), true);
assert.equal(progression.getOrders().some((order) => order.items.length === 2), true);

const first = progression.getOrders()[0];
const delivered = first.items.flatMap((item) =>
  Array.from({ length: item.quantity }, () => ({ chainId: item.chainId, level: item.level }))
);
assert.ok(progression.fulfillOrder(0, delivered));
const active = progression.getOrders();
assert.equal(active.length, 6);
assert.equal(active[0].special, false);
assert.equal(
  Array.from(active, (order) => order.difficulty).join(','),
  'easy,easy,medium,medium,hard,variable'
);
assert.equal(producerProgression.getMasteryOrders().length, 1);

console.log('production-rules.test.js: all assertions passed');
