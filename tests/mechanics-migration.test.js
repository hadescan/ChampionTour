const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();
storage.set('championTour.prototype.producerProgression.v2', JSON.stringify({
  reputation: 220,
  producers: {
    ball_basket: {
      producerId: 'ball_basket',
      level: 2,
      charges: 0,
      refillAnchor: 1,
      masteryPoints: 0
    }
  }
}));
storage.set('championTour.prototype.progression.v1', JSON.stringify({
  producer: { level: 6, xp: 0, rewardedLevels: [2, 3, 4, 5, 6] },
  economy: { coins: 10, gems: 2, eventPoints: 0 },
  orders: [{
    special: true,
    specialChainId: 'footballs',
    items: [{ chainId: 'footballs', level: 12, quantity: 3 }]
  }],
  pendingSpecialOrders: [{
    special: true,
    specialChainId: 'training',
    items: [{ chainId: 'training', level: 12, quantity: 3 }]
  }]
}));

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

const producer = context.ChampionTour.ProducerProgression.getProducerState('ball_basket');
assert.equal(producer.level, 2);
assert.equal('charges' in producer, false);
assert.equal(context.ChampionTour.Progression.canProduce('ball_basket'), true);

const orders = context.ChampionTour.Progression.getOrders();
assert.equal(orders.length, 6);
assert.equal(orders.every((order) => !order.special), true);
assert.equal(orders.some((order) => order.items.length === 1), true);
assert.equal(orders.some((order) => order.items.length === 2), true);

const savedProgression = JSON.parse(
  storage.get('championTour.prototype.progression.v1')
);
assert.equal('pendingSpecialOrders' in savedProgression, false);

console.log('mechanics-migration.test.js: all assertions passed');
