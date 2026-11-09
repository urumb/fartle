(() => {
  "use strict";
  const TARGET = "fart";
  const EPOCH = Date.UTC(2026, 10, 9); // FARTLE #1 = 9 Nov 2026
  const WORDS = window.WORDS;
  const VALID = new Set(WORDS);

  // ---------- word graph ----------
  const ALPHA = "abcdefghijklmnopqrstuvwxyz";
  function neighbours(w) {
    const out = [];
    for (let i = 0; i < 4; i++)
      for (const c of ALPHA) {
        if (c === w[i]) continue;
        const x = w.slice(0, i) + c + w.slice(i + 1);
        if (VALID.has(x)) out.push(x);
      }
    return out;
  }
  const dist = new Map([[TARGET, 0]]);
  (() => {
    const q = [TARGET];
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const v of neighbours(u)) if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); q.push(v); }
    }
  })();

  // ---------- daily word ----------
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const starts = WORDS.slice(0, window.COMMON_COUNT).filter(w => { const d = dist.get(w); return d >= 3 && d <= 6; });
  const order = starts.map((_, i) => i);
  { const r = mulberry32(20261109);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
  function dayNumber(d = new Date()) {
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1;
  }
  const DAY = Math.max(1, dayNumber());
  const START = starts[order[(DAY - 1) % order.length]];
  const PAR = dist.get(START);

  // ---------- storage ----------
  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  let save = store.get("fartle-save", null);
  if (!save || save.day !== DAY) save = { day: DAY, path: [], won: false };
  let stats = store.get("fartle-stats", { played: 0, wins: 0, streak: 0, max: 0, lastWin: 0, perfect: 0 });
  let muted = store.get("fartle-muted", false);
  let cur = "";

  const SVG = inner => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const ICON_ON = SVG('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
  const ICON_OFF = SVG('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>');

  // ---------- dom ----------
  const $ = id => document.getElementById(id);
  const board = $("board"), toastEl = $("toast");

  function tile(ch, cls = "") {
    const t = document.createElement("div");
    t.className = "tile " + cls;
    t.textContent = ch || "";
    return t;
  }
  function row(word, prev, extra = "") {
    const r = document.createElement("div");
    r.className = "row " + extra;
    for (let i = 0; i < 4; i++) {
      // yellow = this letter is already in the right spot for FART
      let cls = word[i] === TARGET[i] ? "changed" : "";
      if (!prev && !cls) cls = "start";
      if (extra.includes("win")) cls = "win";
      r.appendChild(tile(word[i], cls));
    }
    return r;
  }

  function render() {
    board.innerHTML = "";
    const words = [START, ...save.path];
    words.forEach((w, i) => {
      const last = i === words.length - 1;
      board.appendChild(row(w, i ? words[i - 1] : null, save.won && last ? "win" : ""));
    });
    if (!save.won) {
      const r = document.createElement("div");
      r.className = "row";
      for (let i = 0; i < 4; i++) r.appendChild(tile(cur[i], cur[i] ? "typing" : "empty"));
      r.id = "typing";
      board.appendChild(r);
    }
    $("steps").textContent = "Steps: " + save.path.length;
    $("btn-undo").disabled = save.won || !save.path.length;
    $("btn-undo").style.opacity = $("btn-undo").disabled ? .4 : 1;
    $("btn-sound").innerHTML = muted ? ICON_OFF : ICON_ON;
    board.scrollTop = board.scrollHeight;
  }

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }
  function shake() {
    const r = $("typing"); if (!r) return;
    r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake");
  }

  // ---------- game ----------
  function last() { return save.path.length ? save.path[save.path.length - 1] : START; }
  function diffCount(a, b) { let n = 0; for (let i = 0; i < 4; i++) if (a[i] !== b[i]) n++; return n; }

  function submit() {
    if (save.won) return;
    if (cur.length < 4) { toast("Not enough letters"); shake(); return; }
    if (!VALID.has(cur)) { toast("Not in the word list"); shake(); return; }
    const d = diffCount(cur, last());
    if (d === 0) { toast("Change one letter!"); shake(); return; }
    if (d > 1) { toast("Only ONE letter can change"); shake(); return; }
    save.path.push(cur); cur = "";
    if (save.path[save.path.length - 1] === TARGET) win();
    store.set("fartle-save", save);
    render();
    if (save.won) setTimeout(() => showResult(), 1100);
  }

  function win() {
    save.won = true;
    const steps = save.path.length;
    stats.played++; stats.wins++;
    stats.streak = stats.lastWin === DAY - 1 ? stats.streak + 1 : 1;
    stats.max = Math.max(stats.max, stats.streak);
    stats.lastWin = DAY;
    if (steps <= PAR) stats.perfect++;
    store.set("fartle-stats", stats);
    fartSound();
  }

  function press(k) {
    if (save.won) return;
    if (k === "enter") return submit();
    if (k === "back") { cur = cur.slice(0, -1); return render(); }
    if (/^[a-z]$/.test(k) && cur.length < 4) { cur += k; render(); }
  }

  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$("modal").classList.contains("hidden")) { if (e.key === "Escape") closeModal(); return; }
    if (e.key === "Enter") press("enter");
    else if (e.key === "Backspace") press("back");
    else if (e.key.length === 1) press(e.key.toLowerCase());
  });

  // on-screen keyboard
  [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["enter","z","x","c","v","b","n","m","back"]]
    .forEach(keys => {
      const r = document.createElement("div"); r.className = "krow";
      keys.forEach(k => {
        const b = document.createElement("button");
        b.className = "key" + (k.length > 1 ? " wide" : "");
        b.textContent = k === "back" ? "⌫" : k;
        b.addEventListener("click", () => press(k));
        r.appendChild(b);
      });
      $("keyboard").appendChild(r);
    });

  $("btn-undo").addEventListener("click", () => {
    if (save.won || !save.path.length) return;
    save.path.pop(); cur = ""; store.set("fartle-save", save); render();
  });

  // ---------- fart sound ----------
  let ac;
  function fartSound() {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, dur = 0.9;
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(48, t + dur);
      lfo.frequency.setValueAtTime(38, t); lfo.frequency.linearRampToValueAtTime(18, t + dur);
      lg.gain.value = 40;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.04);
      g.gain.setValueAtTime(0.5, t + dur - 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
    } catch {}
  }
  $("btn-sound").addEventListener("click", () => {
    muted = !muted; store.set("fartle-muted", muted); render(); if (!muted) fartSound();
  });

  // ---------- modals ----------
  function openModal(html) { $("modal-body").innerHTML = html; $("modal").classList.remove("hidden"); }
  function closeModal() { $("modal").classList.add("hidden"); store.set("fartle-seen", true); }
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", e => { if (e.target === $("modal")) closeModal(); });
  document.addEventListener("click", e => { if (e.target.id === "play-btn") closeModal(); if (e.target.id === "share-btn") share(); });

  function demoRow(w, diffAt) {
    return `<div class="row">${[...w].map((c, i) => `<div class="tile ${i === diffAt ? "diff" : ""}">${c}</div>`).join("")}</div>`;
  }
  function showHelp() {
    openModal(`<h2>How to play FARTLE</h2>
      <p class="muted">Clear the room in as few moves as you can.</p>
      <p class="lead">Get to “FART” in as few steps as possible</p>
      <p>Each word must be exactly one letter different from the last:</p>
      <div class="demo">${demoRow("tart", 0)}${demoRow("part", 0)}</div>
      <p>Letters that are already in the right spot for FART turn yellow.</p>
      <p>A new starting word is chosen daily. Can you find the shortest path?</p>
      <button id="play-btn" class="link">Click here to play!</button>`);
  }
  function statsHtml() {
    return `<div class="stats"><div><b>${stats.played}</b><span>Played</span></div><div><b>${stats.streak}</b><span>Streak</span></div>
      <div><b>${stats.max}</b><span>Max streak</span></div><div><b>${stats.perfect}</b><span>Perfect</span></div></div>`;
  }
  function showStats() { openModal(`<h2>Stats</h2>${statsHtml()}<p id="next-modal" style="text-align:center;color:var(--muted)"></p>`); }
  function shareText() {
    const steps = save.path.length;
    return `FARTLE #${DAY}\n${steps} step${steps === 1 ? "" : "s"} (best possible: ${PAR})\n${[START, ...save.path].join(" > ").toUpperCase()}`;
  }
  function showResult() {
    const steps = save.path.length;
    const verdict = steps <= PAR ? "Perfect! You found the shortest path." : steps <= PAR + 2 ? "Nice work!" : "You got there… eventually.";
    openModal(`<div class="result"><h2>You reached FART!</h2>
      <p class="big">${steps} step${steps === 1 ? "" : "s"} <span style="color:var(--muted)">· best possible ${PAR}</span></p>
      <p>${verdict}</p>${statsHtml()}
      <button id="share-btn" class="primary">Share</button></div>`);
  }
  function share() {
    const t = shareText();
    const done = () => toast("Copied to clipboard!");
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => prompt("Copy your result:", t));
    else prompt("Copy your result:", t);
  }
  $("btn-help").addEventListener("click", showHelp);
  $("btn-stats").addEventListener("click", () => save.won ? showResult() : showStats());

  // ---------- countdown ----------
  function tick() {
    const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    let s = Math.floor((m - n) / 1000);
    const f = n => String(n).padStart(2, "0");
    const txt = `Next FARTLE in ${Math.floor(s / 3600)}:${f(Math.floor(s / 60) % 60)}:${f(s % 60)}`;
    $("next").textContent = `FARTLE #${DAY} · ${txt}`;
    if (dayNumber() !== DAY && s > 86300) location.reload();
  }
  setInterval(tick, 1000); tick();

  // ---------- go ----------
  render();
  if (save.won) setTimeout(showResult, 400);
  else if (!store.get("fartle-seen", false)) showHelp();

  // debugging helpers (harmless)
  window.fartle = { START, PAR, DAY, dist, starts };
})();
