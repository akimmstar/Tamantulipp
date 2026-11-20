const cv = document.getElementById("c"),
  ctx = cv.getContext("2d");
const rnd = (a, b) => a + Math.random() * (b - a),
  clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t * t * (3 - 2 * t),
  easeOut = (t) => 1 - Math.pow(1 - t, 3);
const PAL = [
  ["#ffd1e3", "#f48fb1"],
  ["#ffe2c2", "#ffab91"],
  ["#e6d4ff", "#b79af0"],
  ["#fff1b8", "#ffd36e"],
  ["#ffc7d1", "#ff8fa3"],
  ["#cfe8ff", "#8fbfff"],
  ["#ffd9f0", "#e58ad0"],
];
const NT = 17,
  hf = (i) => 0.28 + 0.16 * (0.5 + 0.5 * Math.sin(i * 2.1 + 1));
const bee = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  state: "free",
  tgt: null,
  cur: null,
  face: 1,
  t: 0,
  prog: 0,
};
let W,
  H,
  DPR,
  GY,
  K,
  VS,
  sky,
  tNow = 0,
  last = 0,
  state = "play",
  rainT = 0,
  flash = 0;
let selectedFlower = null;
const pointerHint = matchMedia("(pointer: coarse)").matches
  ? "Ketuk tulip, atau geser joystick lalu tekan Serap."
  : "Gunakan joystick atau tombol panah untuk menggerakkan lebah";
const calmSky = matchMedia("(prefers-reduced-motion: reduce)");
let tulips = [],
  blades = [],
  motes = [],
  stars = [],
  parts = [],
  rockets = [],
  timers = [];
const dotsEl = document.getElementById("dots");
for (let n = 0; n < NT; n++) {
  const p = PAL[(n * 3) % 7],
    i = document.createElement("i");
  i.style.background = p[0];
  i.style.boxShadow = "0 0 10px " + p[0];
  dotsEl.appendChild(i);
}

function sprite(c) {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const g = s.getContext("2d"),
    r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(" + c + ",1)");
  r.addColorStop(0.3, "rgba(" + c + ",.35)");
  r.addColorStop(1, "rgba(" + c + ",0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return s;
}
const SP = [
  sprite("255,244,214"),
  sprite("255,196,226"),
  sprite("206,255,232"),
];

function layout() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  cv.width = W * DPR;
  cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  GY = H * 0.8;
  K = clamp(Math.min(W / 710, H / 545), 0.67, 1.45);
  VS = clamp((Math.min(W, H) / 800) * 1.3, 0.7, 1.5);
  sky = ctx.createLinearGradient(0, 0, 0, GY);
  [
    [0, "#101a2d"],
    [0.45, "#26374c"],
    [0.75, "#475568"],
    [1, "#8c8186"],
  ].forEach((s) => sky.addColorStop(s[0], s[1]));
  tulips.forEach((t, i) => {
    const margin = Math.min(W * 0.12, 32 * K + H * 0.035);
    t.x = margin + ((W - 2 * margin) * i) / (NT - 1);
    t.h = H * hf(i);
  });
  blades = [
    [[], [], []],
    [[], [], []],
  ];
  const kk = Math.max(0.8, K);
  for (let n = 0; n < W / 4.2; n++)
    blades[0][n % 3].push({
      x: rnd(-10, W + 10),
      y: GY + rnd(-4, 12),
      h: rnd(34, 88) * kk,
      w: rnd(2, 4) * kk,
      p: rnd(0, 6.3),
    });
  for (let n = 0; n < W / 2.8; n++)
    blades[1][n % 3].push({
      x: rnd(-10, W + 10),
      y: GY + rnd(6, H * 0.23),
      h: rnd(52, 112) * kk,
      w: rnd(2.5, 5) * kk,
      p: rnd(0, 6.3),
    });
  for (let layer = 0; layer < blades.length; layer++)
    for (const group of blades[layer])
      for (const blade of group) blade.y = turfEdge(blade.x, layer) + 4;
  stars = Array.from({ length: 70 }, () => ({
    x: rnd(0, W),
    y: rnd(0, GY * 0.6),
    r: rnd(0.6, 1.6),
    p: rnd(0, 6.3),
  }));
  if (!motes.length)
    motes = Array.from({ length: Math.round(clamp(W / 14, 28, 80)) }, () => ({
      x0: rnd(0, W),
      y: rnd(0, H),
      sp: rnd(14, 34),
      amp: rnd(14, 42),
      f: rnd(0.012, 0.026),
      ph: rnd(0, 6.3),
      r: rnd(1.6, 4.6),
      k: Math.floor(rnd(0, 3)),
      a: rnd(0.4, 0.9),
    }));
}
function plant() {
  tulips = Array.from({ length: NT }, (_, i) => ({
    x: 0,
    h: 0,
    col: PAL[(i * 3) % 7],
    p: i * 1.7 + rnd(0, 1),
    b: tNow + 0.4 + i * 0.2,
    sink: 0,
    sinking: false,
    done: false,
    hx: 0,
    hy: 0,
    hr: 30,
    tx: 0,
    ty: 0,
    g: 0,
  }));
  layout();
  selectedFlower = null;
  hint.textContent = pointerHint;
  updateHud();
  bee.x = W * 0.5;
  bee.y = H * 0.42;
  bee.vx = bee.vy = 0;
  bee.state = "free";
  bee.tgt = null;
  bee.cur = null;
  setRing(0);
}
function updateHud() {
  document.getElementById("count").textContent =
    tulips.filter((t) => t.done).length + " / " + NT + " tulip";
  [...dotsEl.children].forEach((d, i) =>
    d.classList.toggle("off", tulips[i].done),
  );
}

let AC, NB;
function audio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
  if (AC && AC.state === "suspended") AC.resume();
  if (AC && !MU.on) startMusic();
  const musicButton = document.getElementById("mus");
  musicButton.setAttribute("aria-pressed", String(MU.on && !MU.muted));
  musicButton.setAttribute(
    "aria-label",
    MU.on && !MU.muted ? "Jeda piano" : "Putar piano",
  );
  if (AC && !NB) {
    NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = NB.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return AC;
}
function noise(a, t, dur, type, f0, f1, vol, q) {
  const s = a.createBufferSource();
  s.buffer = NB;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (q) f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(a.destination);
  s.start(t, rnd(0, 0.5), dur + 0.05);
}
function chime(n) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime,
    o = a.createOscillator(),
    g = a.createGain();
  o.type = "sine";
  o.frequency.value = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66][
    n % 7
  ];
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 1.6);
}
function whoosh() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const s = a.createBufferSource();
  s.buffer = NB;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 2;
  f.frequency.setValueAtTime(300, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.55);
  const g = a.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.13, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  s.connect(f).connect(g).connect(a.destination);
  s.start(t, 0, 0.65);
}
function boom() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator(),
    g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(34, t + 0.6);
  g.gain.setValueAtTime(0.55, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.8);
  noise(a, t, 1.5, "lowpass", 2200, 160, 0.5);
  for (let i = 0; i < 30; i++)
    noise(
      a,
      t + 0.12 + rnd(0, 1.5),
      0.05,
      "highpass",
      3200,
      3300,
      rnd(0.03, 0.14),
    );
  for (let i = 0; i < 8; i++) {
    const o2 = a.createOscillator(),
      g2 = a.createGain(),
      tt = t + 0.1 + rnd(0, 1.2);
    o2.type = "sine";
    o2.frequency.value = rnd(1500, 3600);
    g2.gain.setValueAtTime(0.04, tt);
    g2.gain.exponentialRampToValueAtTime(0.001, tt + 0.18);
    o2.connect(g2).connect(a.destination);
    o2.start(tt);
    o2.stop(tt + 0.2);
  }
}

const MU = { on: false, muted: false, step: 0, chord: 0, bus: null, out: null };
const CH = [
    [48, 55, 60, 64, 67, 71],
    [45, 52, 57, 60, 64, 67],
    [41, 48, 53, 57, 60, 64],
    [43, 50, 55, 59, 62, 64],
  ],
  MEL = [72, 74, 76, 79, 81, 84];
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
function pnote(m, t, v, dur) {
  const a = AC,
    f = mf(m);
  [
    [1, 1],
    [2, 0.35],
    [3, 0.12],
    [4, 0.05],
  ].forEach((p, i) => {
    const o = a.createOscillator(),
      g = a.createGain(),
      pk = v * p[1];
    o.type = "sine";
    o.frequency.value = f * p[0] * (1 + (i ? rnd(-0.001, 0.001) : 0));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(pk, t + 0.012);
    g.gain.exponentialRampToValueAtTime(pk * 0.25 + 0.0001, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - i * 0.15));
    o.connect(g).connect(MU.bus);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
}
function startMusic() {
  const a = AC;
  MU.on = true;
  const out = a.createGain();
  out.gain.value = MU.muted ? 0 : 0.5;
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200;
  const len = a.sampleRate * 3,
    ir = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
  }
  const cvl = a.createConvolver();
  cvl.buffer = ir;
  const wet = a.createGain();
  wet.gain.value = 0.55;
  const bus = a.createGain();
  bus.gain.value = 0.22;
  bus.connect(lp);
  lp.connect(out);
  lp.connect(cvl);
  cvl.connect(wet);
  wet.connect(out);
  out.connect(a.destination);
  MU.bus = bus;
  MU.out = out;
  const arp = [2, 3, 4, 5, 4, 3, 2, 3];
  const tick = () => {
    const t = a.currentTime + 0.05,
      c = CH[MU.chord],
      s = MU.step % 8;
    if (s === 0) {
      pnote(c[0], t, 0.9, 5);
      pnote(c[1], t + 0.02, 0.5, 4.5);
    }
    if (Math.random() < 0.8)
      pnote(c[arp[s]], t + rnd(0, 0.06), 0.45 + rnd(0, 0.15), 3.2);
    if (Math.random() < 0.28)
      pnote(MEL[Math.floor(rnd(0, MEL.length))], t + 0.4, 0.35, 3.6);
    MU.step++;
    if (MU.step % 8 === 0) MU.chord = (MU.chord + 1) % 4;
    setTimeout(tick, 820);
  };
  tick();
}
document.getElementById("mus").addEventListener("click", (e) => {
  const wasPlaying = MU.on && !MU.muted;
  audio();
  MU.muted = wasPlaying;
  e.currentTarget.setAttribute("aria-pressed", String(MU.on && !MU.muted));
  e.currentTarget.setAttribute(
    "aria-label",
    MU.on && !MU.muted ? "Jeda piano" : "Putar piano",
  );
  if (MU.out)
    MU.out.gain.setTargetAtTime(MU.muted ? 0 : 0.5, AC.currentTime, 0.3);
});

const QUOTES = [
  "Tidak apa-apa jika kamu belum sampai. Bunga pun mekar di waktunya sendiri, bukan karena dikejar-kejar.",
  "Yang pergi bukan selalu kehilangan. Kadang itu cara Tuhan mengosongkan tanganmu untuk sesuatu yang lebih baik.",
  "Jangan bandingkan musim semimu dengan musim panen orang lain. Kamu sedang tumbuh dengan caramu sendiri.",
  "Lelah itu manusiawi. Istirahatlah, bukan menyerah. akar yang diam pun sedang bekerja di dalam tanah.",
  "Patah hati bukan akhir cerita, hanya bab yang menyiapkanmu bertemu versi dirimu yang lebih kuat.",
  "Kamu tidak terlambat. Kamu hanya berjalan di jalan yang tidak sama dengan teman-temanmu.",
  "Kegagalan hari ini adalah pupuk bagi mimpi yang belum kamu tahu akan tumbuh.",
  "Jika hari ini terasa berat, ingatlah: kamu sudah melewati semua hari terburukmu sebelum ini.",
  "Tak semua yang hilang harus ditangisi, sebagian hanya sedang diganti dengan yang lebih pantas untukmu.",
  "Kamu tidak perlu tahu seluruh jalannya. Cukup percaya, lalu melangkahlah satu langkah kecil hari ini.",
  "Kamu berharga bukan karena pencapaianmu, tetapi karena kamu ada dan terus berusaha.",
  "Tuhan tidak pernah terlambat. apa yang tertunda sedang dirapikan untuk datang dalam bentuk terbaiknya.",
  "Semakin banyak yang kamu lepaskan, semakin luas ruang yang Tuhan siapkan untuk hal yang lebih indah.",
];
let qi = -1,
  qTimer = 0;
function nextQuote(first) {
  const el = document.getElementById("quote");
  const go = () => {
    let n;
    do {
      n = Math.floor(Math.random() * QUOTES.length);
    } while (n === qi);
    qi = n;
    el.textContent = "“" + QUOTES[n] + "”";
    el.style.opacity = 1;
  };
  if (first) go();
  else {
    el.style.opacity = 0;
    setTimeout(go, 900);
  }
}
function showCard() {
  document.getElementById("card").hidden = false;
  document.getElementById("again").focus();
  nextQuote(true);
  qTimer = setInterval(() => nextQuote(false), 9000);
}

function petal(x, y, vx, vy, s, life, col) {
  parts.push({
    t: 0,
    x,
    y,
    vx,
    vy,
    s,
    life,
    col,
    rot: rnd(0, 6.3),
    vr: rnd(-4, 4),
    fp: rnd(0, 6.3),
    fs: rnd(2, 5),
    ph: rnd(0, 6.3),
  });
}
function spark(x, y, vx, vy, s, life, k) {
  parts.push({ t: 1, x, y, vx, vy, s, life, k, age: 0 });
}
function burst(x, y) {
  const pal = PAL[Math.floor(rnd(0, PAL.length))];
  for (let i = 0; i < 85; i++) {
    const a = rnd(0, 6.283),
      sp = rnd(80, 560) * VS;
    petal(
      x,
      y,
      Math.cos(a) * sp,
      Math.sin(a) * sp,
      rnd(7, 15) * Math.max(0.8, K),
      rnd(4, 7),
      Math.random() < 0.6 ? pal : PAL[Math.floor(rnd(0, 7))],
    );
  }
  for (let i = 0; i < 50; i++) {
    const a = rnd(0, 6.283),
      sp = rnd(60, 520) * VS;
    spark(
      x,
      y,
      Math.cos(a) * sp,
      Math.sin(a) * sp,
      rnd(10, 22),
      rnd(0.8, 1.8),
      Math.floor(rnd(0, 3)),
    );
  }
  flash = 0.3;
}
function finale() {
  state = "finale";
  rainT = 9;
  document.body.classList.add("end");
  [
    [0, 0.5, 0.36],
    [0.5, 0.2, 0.3],
    [0.55, 0.8, 0.3],
    [1.1, 0.35, 0.18],
    [1.15, 0.65, 0.2],
    [1.7, 0.5, 0.5],
    [2.2, 0.12, 0.46],
    [2.3, 0.88, 0.46],
  ].forEach((s) => {
    timers.push(
      setTimeout(() => {
        whoosh();
        rockets.push({
          x: W * s[1] + rnd(-20, 20) * 0,
          tx: W * s[1],
          ty: H * s[2],
          t0: tNow,
          dur: 0.55,
        });
      }, s[0] * 1000),
    );
  });
  timers.push(setTimeout(showCard, 3400));
}
function reset() {
  timers.forEach(clearTimeout);
  timers = [];
  clearInterval(qTimer);
  parts = [];
  rockets = [];
  rainT = 0;
  state = "play";
  document.body.classList.remove("end");
  document.getElementById("card").hidden = true;
  document.activeElement.blur();
  plant();
}
document.getElementById("again").addEventListener("click", reset);

const keys = {},
  pad = document.getElementById("pad"),
  knob = document.getElementById("knob"),
  eat = document.getElementById("eat"),
  ring = document.getElementById("ring"),
  hint = document.getElementById("hint");
let jx = 0,
  jy = 0,
  padId = null;
function setRing(p) {
  ring.style.strokeDashoffset = 289 * (1 - p);
}
function say(m, ms) {
  hint.textContent = m;
  hint.style.opacity = 1;
  clearTimeout(say.t);
  say.t = setTimeout(() => {
    hint.textContent = pointerHint;
  }, ms);
}
function padMove(e) {
  const r = pad.getBoundingClientRect(),
    R = r.width / 2,
    m = R * 0.62;
  let dx = e.clientX - (r.left + R),
    dy = e.clientY - (r.top + R);
  const d = Math.hypot(dx, dy);
  if (d > m) {
    dx *= m / d;
    dy *= m / d;
  }
  jx = dx / m;
  jy = dy / m;
  knob.style.transform = "translate(" + dx + "px," + dy + "px)";
}
pad.addEventListener("pointerdown", (e) => {
  if (padId !== null) return;
  selectedFlower = null;
  padId = e.pointerId;
  pad.setPointerCapture(e.pointerId);
  audio();
  padMove(e);
});
pad.addEventListener("pointermove", (e) => {
  if (e.pointerId === padId) padMove(e);
});
const padEnd = (e) => {
  if (e.pointerId !== padId) return;
  padId = null;
  jx = jy = 0;
  knob.style.transform = "";
};
pad.addEventListener("pointerup", padEnd);
pad.addEventListener("pointercancel", padEnd);
pad.addEventListener("lostpointercapture", padEnd);
function releaseControls() {
  Object.keys(keys).forEach((key) => delete keys[key]);
  padEnd({ pointerId: padId });
  selectedFlower = null;
}
addEventListener("blur", releaseControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseControls();
});
cv.addEventListener("pointerdown", (event) => {
  if (state !== "play" || bee.state !== "free" || event.button !== 0) return;
  let nearest = null,
    distance = Infinity;
  for (const flower of tulips) {
    if (flower.g < 0.6 || flower.sinking) continue;
    const d = Math.hypot(flower.hx - event.clientX, flower.hy - event.clientY);
    if (d < distance && d < flower.hr + 14) {
      nearest = flower;
      distance = d;
    }
  }
  if (nearest) {
    audio();
    selectedFlower = nearest;
  }
});
addEventListener("keydown", (e) => {
  if (state !== "play" || e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "w",
      "a",
      "s",
      "d",
    ].includes(k)
  ) {
    selectedFlower = null;
    keys[k] = true;
    audio();
    e.preventDefault();
  } else if (k === " " || k === "enter") {
    if (e.target.closest?.("button,a") || e.repeat) return;
    e.preventDefault();
    absorb();
  }
});
addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});
eat.addEventListener("click", absorb);
function absorb() {
  audio();
  if (state !== "play" || bee.state === "eat") return;
  const t = bee.tgt;
  if (!t) {
    say("Terbangkan lebah lebih dekat ke tulip", 2200);
    return;
  }
  selectedFlower = null;
  t.sinking = true;
  bee.state = "eat";
  bee.cur = t;
  bee.prog = 0;
  updateHud();
  clearTimeout(say.t);
  hint.textContent = "Mengambil nektar…";
}
function updateBee(dt) {
  bee.t += dt;
  let ix =
      jx +
      (keys.arrowright || keys.d ? 1 : 0) -
      (keys.arrowleft || keys.a ? 1 : 0),
    iy =
      jy +
      (keys.arrowdown || keys.s ? 1 : 0) -
      (keys.arrowup || keys.w ? 1 : 0);
  if (selectedFlower && bee.state === "free") {
    const dx = clamp(selectedFlower.hx, 24, W - 24) - bee.x;
    const dy = clamp(selectedFlower.hy, H * 0.16, GY + 20) - bee.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 17 * VS) {
      bee.tgt = selectedFlower;
      absorb();
    } else {
      ix = dx / distance;
      iy = dy / distance;
    }
  }
  const m = Math.hypot(ix, iy);
  if (m > 1) {
    ix /= m;
    iy /= m;
  }
  if (bee.state === "eat") {
    const t = bee.cur;
    bee.prog = Math.min(1, bee.prog + dt / 3);
    setRing(bee.prog);
    const gx = t.hx + Math.sin(bee.t * 3) * 10,
      gy = t.hy - t.hr * 0.3 + Math.cos(bee.t * 4) * 6,
      k = Math.min(1, dt * 5);
    bee.x += (gx - bee.x) * k;
    bee.y += (gy - bee.y) * k;
    bee.vx = bee.vy = 0;
    if (Math.random() < dt * 24)
      spark(
        t.hx + rnd(-8, 8),
        t.hy + rnd(-8, 8),
        (bee.x - t.hx) * 1.4 + rnd(-20, 20),
        (bee.y - t.hy) * 1.4 + rnd(-20, 20),
        rnd(8, 14),
        0.7,
        Math.floor(rnd(0, 3)),
      );
    if (t.done) {
      bee.state = "free";
      bee.cur = null;
      bee.tgt = null;
      updateHud();
      hint.textContent = pointerHint;
      setRing(0);
      chime(tulips.filter((x) => x.done).length);
      for (let i = 0; i < 10; i++)
        spark(
          bee.x,
          bee.y,
          rnd(-80, 80),
          rnd(-80, 80),
          rnd(8, 16),
          1.2,
          Math.floor(rnd(0, 3)),
        );
    }
  } else {
    const sp = 240 * VS;
    bee.vx += (ix * sp - bee.vx) * Math.min(1, dt * 4);
    bee.vy += (iy * sp - bee.vy) * Math.min(1, dt * 4);
    bee.x = clamp(bee.x + bee.vx * dt, 24, W - 24);
    bee.y = clamp(bee.y + bee.vy * dt, H * 0.16, GY + 20);
    if (Math.abs(bee.vx) > 8) bee.face = bee.vx > 0 ? 1 : -1;
    if (Math.hypot(bee.vx, bee.vy) > 50 && Math.random() < dt * 12)
      spark(
        bee.x - bee.face * 10,
        bee.y,
        rnd(-10, 10),
        rnd(-10, 10),
        rnd(6, 10),
        0.8,
        Math.floor(rnd(0, 3)),
      );
    let best = null,
      bd = 1e9;
    for (const t of tulips) {
      if (t.sinking || t.g < 0.6) continue;
      const d = Math.hypot(bee.x - t.hx, bee.y - t.hy);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    bee.tgt = best && bd < best.hr + 60 * Math.max(0.8, K) ? best : null;
  }
  eat.disabled = !bee.tgt || bee.state !== "free" || state !== "play";
  eat.querySelector("span").textContent =
    bee.state === "eat" ? "Menyerap" : "Serap";
  eat.classList.toggle(
    "ready",
    !!bee.tgt && bee.state === "free" && state === "play",
  );
}
function drawBee() {
  const s = Math.max(0.9, K) * 1.1,
    y = bee.y + Math.sin(bee.t * 6) * 2.5,
    fl = Math.sin(bee.t * 60) * 0.5 + 0.5;
  ctx.save();
  ctx.translate(bee.x, y);
  ctx.scale(bee.face * s, s);
  ctx.globalAlpha = 0.55;
  ctx.drawImage(SP[0], -34, -34, 68, 68);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.strokeStyle = "rgba(200,220,255,.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-3, -10, 5, 11 * (0.55 + 0.45 * fl), -0.5, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(4, -10, 4.5, 10 * (0.55 + 0.45 * fl), 0.4, 0, 6.283);
  ctx.fill();
  ctx.stroke();
  const honey = ctx.createLinearGradient(0, -8, 0, 9);
  honey.addColorStop(0, "#fff3b6");
  honey.addColorStop(0.5, "#f8ce74");
  honey.addColorStop(1, "#c38a4f");
  ctx.fillStyle = honey;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 9, 0, 0, 6.283);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#69505a";
  ctx.fillRect(-6, -10, 4, 20);
  ctx.fillRect(1, -10, 4, 20);
  ctx.restore();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(13, -1, 6.5, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = "#5a4260";
  ctx.beginPath();
  ctx.arc(15, -2.5, 1.6, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = "rgba(255,150,180,.6)";
  ctx.beginPath();
  ctx.arc(15, 2, 1.8, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = "#5a4260";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, -6);
  ctx.lineTo(18, -12);
  ctx.moveTo(11, -6);
  ctx.lineTo(13, -12);
  ctx.stroke();
  ctx.fillStyle = "#5a4260";
  ctx.beginPath();
  ctx.moveTo(-13, -1.5);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-13, 1.5);
  ctx.fill();
  ctx.restore();
}

function update(dt) {
  tulips.forEach((t) => {
    if (t.sinking && t.sink < 1) {
      t.sink = Math.min(1, t.sink + dt / 3);
      if (t.sink >= 1) t.done = true;
    }
  });
  updateBee(dt);
  if (state === "play" && tulips.every((t) => t.done)) finale();
  motes.forEach((m) => {
    m.y -= m.sp * dt;
    if (m.y < -20) {
      m.y = H + 20;
      m.x0 = rnd(0, W);
    }
  });
  rockets = rockets.filter((r) => {
    if (tNow >= r.t0 + r.dur) {
      burst(r.tx, r.ty);
      boom();
      return false;
    }
    return true;
  });
  if (rainT > 0) {
    rainT -= dt;
    if (Math.random() < dt * 14)
      petal(
        rnd(0, W),
        -20,
        rnd(-20, 20),
        rnd(30, 60),
        rnd(7, 13) * Math.max(0.8, K),
        rnd(7, 10),
        PAL[Math.floor(rnd(0, 7))],
      );
  }
  parts = parts.filter((p) => {
    if (p.t === 0) {
      p.age = (p.age || 0) + dt;
      const d = Math.pow(0.3, dt);
      p.vx *= d;
      p.vy = p.vy * d + 95 * dt * (1 - d * 0.5);
      p.x += p.vx * dt + Math.sin(p.age * 2 + p.ph) * 26 * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.fp += p.fs * dt;
      return p.age < p.life && p.y < H + 40;
    }
    p.age += dt;
    const d = Math.pow(0.2, dt);
    p.vx *= d;
    p.vy *= d;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p.age < p.life;
  });
  flash *= Math.exp(-4 * dt);
}

function qp(a, b, c, u) {
  const v = 1 - u;
  return [
    v * v * a[0] + 2 * v * u * b[0] + u * u * c[0],
    v * v * a[1] + 2 * v * u * b[1] + u * u * c[1],
  ];
}
function leaf(px, py, dir, L, sw) {
  const tx = px + dir * L * 0.55 + sw * 0.5,
    ty = py - L * 0.9;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.quadraticCurveTo(px + dir * L * 0.46, py - L * 0.24, tx, ty);
  ctx.quadraticCurveTo(px + dir * L * 0.17, py - L * 0.58, px, py);
  const shade = ctx.createLinearGradient(px, py, tx, ty);
  shade.addColorStop(0, "#274c50");
  shade.addColorStop(0.65, ctx.fillStyle);
  shade.addColorStop(1, "#90ada0");
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.strokeStyle = "#b4cabb65";
  ctx.lineWidth = Math.max(0.55, K * 0.8);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.quadraticCurveTo(px + dir * L * 0.38, py - L * 0.33, tx, ty);
  ctx.stroke();
}
function petalPath(sx, w, hh, s) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    sx * w * 1.25,
    -hh * 0.05,
    sx * w * (0.95 + s),
    -hh * 0.7,
    sx * w * (0.45 + s),
    -hh * 1.08,
  );
  ctx.bezierCurveTo(sx * w * 0.15, -hh * 0.85, sx * w * 0.05, -hh * 0.3, 0, 0);
  ctx.fill();
  ctx.stroke();
}
function drawTulip(t) {
  const g = easeOut(clamp((tNow - t.b) / 2.6, 0, 1));
  t.g = g;
  if (g <= 0 || t.sink >= 1) return;
  const se = ease(t.sink),
    len = t.h * g * (1 - se),
    by = GY + 6 * K,
    x = t.x;
  const sway =
    (Math.sin(tNow * 0.9 + t.p) * 0.06 +
      Math.sin(tNow * 0.37 + t.p * 2) * 0.03) *
    t.h *
    (1 - se) *
    g;
  const A = [x, by],
    B = [x + sway * 0.15, by - len * 0.5],
    C = [x + sway, by - len];
  t.tx = C[0];
  t.ty = C[1];
  ctx.globalAlpha = 1 - se * 0.5;
  ctx.lineCap = "round";
  ctx.lineWidth = 3.4 * K;
  ctx.strokeStyle = "#7b9f92";
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.quadraticCurveTo(B[0], B[1], C[0], C[1]);
  ctx.stroke();
  [
    [0.05, -1, 0.58, "#688d82"],
    [0.05, 1, 0.5, "#456d68"],
    [0.2, 1, 0.36, "#688d82"],
    [0.22, -1, 0.3, "#456d68"],
  ].forEach((l, i) => {
    const p = qp(A, B, C, l[0]),
      L = Math.min(len * l[2], (100 + 14 * i) * K),
      s = Math.sin(tNow * 1.1 + t.p + i * 1.3) * L * 0.1;
    ctx.fillStyle = l[3];
    leaf(p[0], p[1], l[1], L, s);
  });
  const hs = g * (1 - 0.6 * se),
    w = 16 * K,
    hh = 46 * K,
    ang =
      Math.atan2(sway, Math.max(len, 10)) * 0.9 + se * 0.5 * (t.p > 5 ? 1 : -1);
  ctx.save();
  ctx.translate(C[0], C[1]);
  ctx.rotate(ang);
  ctx.scale(hs, hs);
  const gl = ctx.createRadialGradient(
    0,
    -hh * 0.55,
    0,
    0,
    -hh * 0.55,
    hh * 1.2,
  );
  gl.addColorStop(0, t.col[0] + "55");
  gl.addColorStop(1, t.col[0] + "00");
  ctx.fillStyle = gl;
  ctx.fillRect(-hh * 1.3, -hh * 1.8, hh * 2.6, hh * 2.4);
  const sp =
    0.05 +
    0.55 * ease(clamp((g - 0.3) / 0.7, 0, 1)) +
    Math.sin(tNow * 1.2 + t.p) * 0.03;
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 1;
  ctx.fillStyle = t.col[1];
  petalPath(-1, w, hh, sp);
  petalPath(1, w, hh, sp);
  const lg = ctx.createLinearGradient(0, 0, 0, -hh * 1.1);
  lg.addColorStop(0, t.col[1]);
  lg.addColorStop(1, t.col[0]);
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(-w * 0.75, -hh * 0.05);
  ctx.bezierCurveTo(-w * 0.95, -hh * 0.6, -w * 0.4, -hh * 0.95, 0, -hh * 1.12);
  ctx.bezierCurveTo(
    w * 0.4,
    -hh * 0.95,
    w * 0.95,
    -hh * 0.6,
    w * 0.75,
    -hh * 0.05,
  );
  ctx.bezierCurveTo(
    w * 0.4,
    hh * 0.12,
    -w * 0.4,
    hh * 0.12,
    -w * 0.75,
    -hh * 0.05,
  );
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = t.col[0] + "aa";
  ctx.lineWidth = 0.8 * K;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * w * 0.18, -hh * 0.1);
    ctx.quadraticCurveTo(
      side * w * 0.53,
      -hh * 0.53,
      side * w * 0.1,
      -hh * 0.91,
    );
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  t.hx = C[0] + Math.sin(ang) * hh * 0.55 * hs;
  t.hy = C[1] - Math.cos(ang) * hh * 0.55 * hs;
  t.hr = Math.max(w * 1.6 * hs, 28);
  if (t === (selectedFlower || bee.tgt) && bee.state === "free") {
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(tNow * 5);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(t.hx, t.hy, t.hr * 1.05, 0, 6.283);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}
const GC = [
  ["#3f6666", "#547974", "#648379"],
  ["#24484a", "#315754", "#476d63"],
];
function turfEdge(x, layer) {
  return GY + H * (layer ? 0.2 : 0.065) + Math.sin(x * 0.009 + layer) * 6;
}
function grass(layer) {
  const soil = ctx.createLinearGradient(0, turfEdge(0, layer) - 10, 0, H + 10);
  soil.addColorStop(0, GC[layer][0]);
  soil.addColorStop(1, "#152d33");
  ctx.fillStyle = soil;
  ctx.beginPath();
  ctx.moveTo(-1, H);
  for (let x = -1; x < W + 8; x += 7) ctx.lineTo(x, turfEdge(x, layer));
  ctx.lineTo(W, H);
  ctx.fill();
  for (let c = 0; c < 3; c++) {
    ctx.fillStyle = GC[layer][c];
    ctx.beginPath();
    for (const b of blades[layer][c]) {
      const sw =
        Math.sin(tNow * 1.3 + b.x * 0.012 + b.p) * b.h * 0.16 +
        Math.sin(tNow * 0.5 + b.x * 0.004) * b.h * 0.08;
      ctx.moveTo(b.x - b.w, b.y);
      ctx.quadraticCurveTo(
        b.x + sw * 0.3,
        b.y - b.h * 0.6,
        b.x + sw + b.h * 0.17,
        b.y - b.h,
      );
      ctx.quadraticCurveTo(
        b.x + sw * 0.3 + b.w,
        b.y - b.h * 0.55,
        b.x + b.w,
        b.y,
      );
    }
    ctx.fill();
  }
}
function hill(base, amp, col, fx) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, GY + 2);
  for (let x = 0; x <= W + 12; x += 12)
    ctx.lineTo(
      x,
      GY -
        base -
        Math.sin(x * 0.004 + fx) * amp -
        Math.sin(x * 0.011 + fx) * amp * 0.3,
    );
  ctx.lineTo(W, GY + 2);
  ctx.fill();
}
const auroraLight = ["107,194,168", "157,127,196"].map((rgb) => {
  const source = document.createElement("canvas");
  source.width = 2;
  source.height = 160;
  const brush = source.getContext("2d");
  const tint = brush.createLinearGradient(0, 0, 0, 160);
  for (const [position, opacity] of [
    [0, 0],
    [0.55, 0.3],
    [0.86, 1],
    [1, 0],
  ])
    tint.addColorStop(position, `rgba(${rgb},${opacity})`);
  brush.fillStyle = tint;
  brush.fillRect(0, 0, 2, 160);
  return source;
});
function drawAurora() {
  const time = calmSky.matches ? 0 : tNow * 0.13;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let band = 0; band < 2; band++) {
    const height = H * (band ? 0.125 : 0.16);
    function hem(u) {
      return (
        H *
        (0.24 +
          0.057 * Math.sin(u * 7 + time + band * 0.8) +
          0.041 * Math.sin(u * 12 - time * 0.6) +
          0.11 * (1 - u) +
          band * 0.048)
      );
    }
    const step = 4;
    for (let x = 0; x < W; x += step) {
      const u = x / W,
        y = hem(u);
      const light =
        0.17 +
        0.12 * Math.sin(u * 9 + time) ** 2 +
        0.045 * Math.sin(u * 75 - time);
      ctx.globalAlpha = light;
      ctx.drawImage(auroraLight[band], x, y - height, step, height + 0.02 * H);
    }
  }
  ctx.restore();
}
function draw() {
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  stars.forEach((s) => {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(tNow * 1.5 + s.p);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 6.283);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  drawAurora();
  ctx.globalAlpha = 0.7;
  const mr = Math.min(W, H) * 0.07,
    mx = W * 0.78,
    my = Math.max(72, H * 0.18);
  ctx.drawImage(SP[0], mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff6df";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = "#cabca34d";
  for (const [x, y, r] of [
    [-0.32, 0.24, 0.13],
    [0.24, -0.26, 0.18],
    [0.37, 0.13, 0.08],
    [-0.1, -0.47, 0.09],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + x * mr, my + y * mr, mr * r, 0, Math.PI * 2);
    ctx.fill();
  }
  hill(H * 0.17, H * 0.055, "#465061", 0.4);
  hill(H * 0.115, H * 0.047, "#344956", 1.8);
  hill(H * 0.063, H * 0.038, "#2a444b", 3.2);
  hill(26 * K, 22 * K, "#263f44", 3);
  const gg = ctx.createLinearGradient(0, GY, 0, H);
  gg.addColorStop(0, "#304f50");
  gg.addColorStop(1, "#102531");
  ctx.fillStyle = gg;
  ctx.fillRect(0, GY, W, H - GY);
  grass(0);
  tulips.forEach(drawTulip);
  grass(1);
  ctx.save();
  ctx.lineWidth = 1;
  for (let i = 0; i < Math.ceil(W / 23); i++) {
    const x = (i + 0.5 + Math.sin(i * 12) * 0.35) * 23,
      y = turfEdge(x, 1);
    const length = (30 + 14 * Math.cos(i * 2.3)) * Math.max(0.8, K);
    const tip = x + 9 + 6 * Math.sin(tNow * 0.8 + i),
      top = y - length;
    ctx.strokeStyle = "#819784";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 1, y - length * 0.55, tip, top);
    ctx.stroke();
    ctx.fillStyle = "#a5ad8f";
    for (let j = 0; j < 4; j++) {
      const offset = j * 3;
      ctx.beginPath();
      ctx.ellipse(
        tip - offset * 0.23 + (j % 2 ? 1 : -1),
        top + offset,
        1.4,
        3,
        j % 2 ? 0.65 : -0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
  motes.forEach((m) => {
    const v = m.y * m.f + m.ph,
      z = Math.sin(v) - Math.sin(3 * v) / 9,
      x = m.x0 + z * m.amp * 1.1;
    ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(tNow * 1.3 + m.ph));
    const r = m.r * 1.8;
    ctx.drawImage(SP[m.k], x - r, m.y - r, r * 2, r * 2);
  });
  drawBee();
  rockets.forEach((r) => {
    for (let k = 0; k < 6; k++) {
      const u = clamp((tNow - r.t0) / r.dur - k * 0.035, 0, 1),
        e = easeOut(u);
      ctx.globalAlpha = (1 - k / 6) * 0.9;
      const s = 26 - k * 3,
        px = r.x + (r.tx - r.x) * e,
        py = H + (r.ty - H) * e;
      ctx.drawImage(SP[0], px - s / 2, py - s / 2, s, s);
    }
  });
  parts.forEach((p) => {
    if (p.t === 1) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.drawImage(SP[p.k], p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      return;
    }
    const a = clamp((p.life - p.age) / 1.2, 0, 1);
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(Math.max(0.12, Math.abs(Math.cos(p.fp))) * 0.62, 1);
    const s = p.s,
      lg = ctx.createLinearGradient(0, s, 0, -s);
    lg.addColorStop(0, p.col[1]);
    lg.addColorStop(1, p.col[0]);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.bezierCurveTo(s * 0.95, s * 0.5, s * 0.8, -s * 0.7, 0, -s * 1.1);
    ctx.bezierCurveTo(-s * 0.8, -s * 0.7, -s * 0.95, s * 0.5, 0, s);
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  if (flash > 0.01) {
    ctx.fillStyle = "rgba(255,240,250," + flash + ")";
    ctx.fillRect(0, 0, W, H);
  }
}
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  tNow += dt;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
addEventListener("resize", layout);
plant();
requestAnimationFrame(frame);
