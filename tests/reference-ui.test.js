const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const theme = fs.readFileSync(
  path.join(root, 'cozy-academy-production.css'),
  'utf8'
);

assert.match(html, /cozy-academy-production\.css/);
assert.doesNotMatch(html, /modern-pixel-art\.css/);
assert.match(theme, /grid-template-columns:\s*repeat\(7/);
assert.match(theme, /--ct-board-gap:\s*2px/);
assert.match(theme, /\.producer-wrap::after/);
assert.match(theme, /\.production-mode-control[\s\S]*border-radius:\s*50%/);
assert.match(theme, /\.order-card[\s\S]*background:\s*transparent/);
assert.match(script, /type:\s*'order-item'/);
assert.match(script, /closestMergeProgress/);
assert.match(script, /Producer’ı Göster/);

console.log('reference-ui.test.js: all assertions passed');
