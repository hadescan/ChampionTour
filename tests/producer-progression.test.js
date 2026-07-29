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
for (const file of ['js/game-data.js', 'js/producer-progression.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const progression = context.ChampionTour.ProducerProgression;
for (const producerId of Object.keys(context.ChampionTour.GameData.producers)) {
  const producer = progression.getProducerState(producerId);
  assert.equal(producer.level, 1);
  assert.equal('charges' in producer, false);
  assert.equal('refillRemainingMs' in producer, false);
  assert.equal(producer.normalOrderMaxLevel, 6);
}

progression.addReputation(1520);
for (const producerId of Object.keys(context.ChampionTour.GameData.producers)) {
  const producer = progression.getProducerState(producerId);
  assert.equal(producer.level, 3);
  assert.equal(producer.normalOrderMaxLevel, 10);
}

progression.recordDiscovery('footballs', 7);
progression.evaluateMastery({ footballs: 3 });
const mastery = progression.getMasteryOrders()[0];
assert.equal(mastery.level, 7);
assert.deepEqual(
  [mastery.quantity, mastery.rewards.coins, mastery.rewards.gems, mastery.rewards.reputation],
  [3, 900, 1, 100]
);
progression.completeMastery('footballs');
assert.equal(progression.getMasteryOrders().length, 0);
assert.equal(progression.getState().completedMasteries.footballs, true);
assert.equal(progression.retirementStatus('ball_basket').eligible, false);
progression.addReputation(580);
assert.equal(progression.retirementStatus('ball_basket').eligible, true);
assert.equal(progression.retire('ball_basket'), true);
assert.equal(progression.getProducerState('ball_basket').replacementPendingContent, true);

console.log('producer-progression.test.js: all assertions passed');
