const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(root, 'js', 'game-data.js'), 'utf8'),
  context
);

const data = context.window.ChampionTour.GameData;
const fullRoot = 'assets/CozyAcademy/Full/';

Object.values(data.uiIcons).forEach((asset) => {
  assert.ok(asset.startsWith(fullRoot), `UI icon is outside Cozy Academy: ${asset}`);
  assert.ok(fs.existsSync(path.join(root, asset)), `Missing UI icon: ${asset}`);
});

Object.values(data.customers).forEach((asset) => {
  assert.ok(asset.startsWith(fullRoot), `Customer is outside Cozy Academy: ${asset}`);
  assert.ok(fs.existsSync(path.join(root, asset)), `Missing customer: ${asset}`);
});

for (const chain of Object.values(data.chains)) {
  chain.assets.slice(1).forEach((asset) => {
    assert.ok(
      asset.includes('/CozyAcademy/'),
      `Active item is outside Cozy Academy: ${asset}`
    );
    assert.ok(fs.existsSync(path.join(root, asset)), `Missing item: ${asset}`);
  });
}

for (const producer of Object.values(data.producers)) {
  assert.ok(
    producer.artwork.includes('/CozyAcademy/'),
    `Active producer is outside Cozy Academy: ${producer.artwork}`
  );
  assert.ok(
    fs.existsSync(path.join(root, producer.artwork)),
    `Missing producer: ${producer.artwork}`
  );
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /cozy-academy-production\.css/);
assert.doesNotMatch(html, /modern-pixel-art\.css/);
assert.doesNotMatch(html, /cozy-academy-pilot\.css/);
assert.doesNotMatch(html, /cozy-academy-full\.css/);
assert.match(html, /data-ui-icon="menu"/);
assert.equal(Object.keys(data.customers).length, 6);

console.log('cozy-full-theme.test.js: all assertions passed');
