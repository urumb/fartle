// Copies the static game into www/ for Capacitor.
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of ['index.html','style.css','words.js','game.js','manifest.webmanifest','sw.js'])
  fs.copyFileSync(path.join(__dirname, '..', f), path.join(out, f));
fs.cpSync(path.join(__dirname, '..', 'icons'), path.join(out, 'icons'), { recursive: true });
