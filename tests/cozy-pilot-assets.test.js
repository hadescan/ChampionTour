const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {};
context.window = context;
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'js/game-data.js'), 'utf8'),
  context,
  { filename: 'js/game-data.js' }
);

const data = context.ChampionTour.GameData;
const training = data.chains.training;
assert.equal(training.id, 'training');
assert.equal(training.producerId, 'training_cart');
assert.equal(training.assets.length, 13);

for (let level = 1; level <= 6; level += 1) {
  const asset = training.assets[level];
  assert.match(asset, /assets\/CozyAcademy\/Pilot\/Training\/Items\/training_lv[1-6]\.png/);
  assert.equal(fs.existsSync(path.join(root, asset)), true, `missing ${asset}`);
}
for (let level = 7; level <= 12; level += 1) {
  const asset = training.assets[level];
  assert.match(asset, /assets\/CozyAcademy\/Progression\/Items\/training_lv(?:[7-9]|1[0-2])\.png/);
  assert.equal(fs.existsSync(path.join(root, asset)), true, `missing ${asset}`);
}

const producer = data.producers.training_cart;
assert.equal(producer.chainId, 'training');
assert.match(
  producer.artwork,
  /assets\/CozyAcademy\/Pilot\/Training\/Producers\/producer_training_cart\.png/
);
assert.equal(fs.existsSync(path.join(root, producer.artwork)), true);
assert.deepEqual(
  Array.from(data.productionModes.energyOptions),
  [1, 2, 4, 8, 16]
);

console.log('cozy-pilot-assets.test.js: all assertions passed');
