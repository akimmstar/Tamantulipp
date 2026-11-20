"use strict";
const byId = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const sky = document.querySelector(".sky");
for (let i = 0; i < 110; i++) {
  const dot = document.createElement("i");
  dot.className = i % 15 === 0 ? "star glint" : "star";
  dot.style.left = Math.random() * 100 + "%";
  dot.style.top = Math.random() * 100 + "%";
  dot.style.setProperty("--period", 3 + Math.random() * 5 + "s");
  dot.style.animationDelay = -Math.random() * 8 + "s";
  sky.append(dot);
}

function paint(ctx, outline, fill, stroke, width = 1) {
  const path = new Path2D(outline);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke(path);
  }
}
function leaf(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  paint(ctx, "M0 0 Q-23 -21 -7 -68 Q16 -40 0 0Z", color);
  paint(ctx, "M0 -3 Q-6 -32 -7 -61", null, "#b0cbab70");
  ctx.restore();
}
const rose = ["#b96683", "#d7879b", "#eda5af", "#fac3bd", "#ffdbce"];
const lilac = ["#9276ae", "#bb98cb", "#d8b6df", "#ead4ea", "#f7e4ee"];
const peach = ["#c98179", "#e69f90", "#f4b9a4", "#ffd4bb", "#ffe2c8"];
function blossom(ctx, type, palette, open) {
  ctx.save();
  ctx.scale(0.36 + 0.64 * open, 0.87 + 0.13 * open);
  if (type === "rose") {
    for (let ring = 0; ring < 3; ring++) {
      const count = 6 - ring;
      const radius = (28 - ring * 9) * (0.55 + 0.45 * open);
      for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.rotate(
          (i * Math.PI * 2) / count +
            ring * 0.78 +
            (1 - open) * (0.62 - ring * 0.1),
        );
        ctx.translate(0, -radius);
        ctx.scale((1 - ring * 0.24) * (0.68 + 0.32 * open), 1 - ring * 0.24);
        const tint = ctx.createLinearGradient(0, 13, 0, -26);
        tint.addColorStop(0, palette[ring]);
        tint.addColorStop(0.65, palette[ring + 1]);
        tint.addColorStop(1, palette[Math.min(4, ring + 2)]);
        paint(
          ctx,
          "M-27 2 C-32 -10 -22 -22 -10 -22 Q0 -29 12 -22 C31 -23 35 -5 22 7 Q2 28 -27 2Z",
          tint,
          palette[ring],
          1,
        );
        ctx.restore();
      }
    }
    paint(ctx, "M-7 1 Q-3 -10 7 -5 Q12 2 3 5 Q-2 6 -2 1", null, palette[0], 2);
  } else {
    paint(
      ctx,
      "M0 20 C-32 15 -38 -14 -32 -57 Q-15 -47 0 -34 Q10 -54 18 -62 Q38 -29 30 -3 Q26 18 0 20Z",
      palette[1],
      palette[0],
    );
    ctx.save();
    ctx.rotate(0.23 - 0.53 * open);
    const tint = ctx.createLinearGradient(0, 16, -24, -49);
    tint.addColorStop(0, palette[1]);
    tint.addColorStop(1, palette[3]);
    paint(
      ctx,
      "M4 20 Q-39 22 -39 -44 Q-12 -39 4 -13 Q15 5 4 20Z",
      tint,
      palette[1],
    );
    ctx.restore();
    ctx.save();
    ctx.rotate(-0.24 + 0.56 * open);
    paint(
      ctx,
      "M-9 18 Q-10 -24 34 -54 Q44 10 8 20 Q0 23 -9 18Z",
      palette[3],
      palette[1],
    );
    ctx.restore();
  }
  ctx.restore();
}
function sprig(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  paint(ctx, "M0 0 Q-5 -82 4 -155", null, "#8da999", 2.4);
  for (let i = 0; i < 7; i++)
    leaf(
      ctx,
      0,
      -18 - i * 18,
      i % 2 ? 0.8 : -0.85,
      0.42 - i * 0.026,
      i % 2 ? "#84a49b" : "#648c83",
    );
  ctx.restore();
}
function drawFlowers(open) {
  const ctx = byId("flowers").getContext("2d");
  ctx.clearRect(0, 0, 760, 640);
  ctx.save();
  ctx.translate(380, 318);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 287, 0, Math.PI * 2);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, -287, 0, 287);
  wash.addColorStop(0, "#27364780");
  wash.addColorStop(1, "#1a393deb");
  ctx.fillStyle = wash;
  ctx.fillRect(-287, -287, 574, 574);
  ctx.scale(0.85, 0.85);
  sprig(ctx, -12, 330, -0.67, 1.72);
  sprig(ctx, 18, 332, 0.67, 1.75);
  const rows = [
    [-225, -89, -0.29, 0.82, "tulip", peach],
    [-140, -162, -0.17, 0.92, "rose", rose],
    [-48, -166, -0.08, 0.85, "tulip", lilac],
    [47, -179, 0.07, 0.85, "rose", peach],
    [148, -151, 0.16, 0.98, "tulip", rose],
    [230, -86, 0.35, 0.82, "rose", rose],
    [-270, 33, -0.43, 0.85, "rose", peach],
    [-157, -3, -0.28, 1.04, "tulip", rose],
    [-59, -51, -0.16, 1.15, "rose", rose],
    [49, -58, 0.18, 1.12, "tulip", lilac],
    [143, -10, 0.21, 1.03, "rose", peach],
    [246, 40, 0.38, 0.93, "tulip", lilac],
  ];
  for (const [x, y] of rows) {
    const base = x * 0.57;
    paint(ctx, `M${base} 370 Q${x} 125 ${x} ${y}`, null, "#83a18d", 4);
    leaf(ctx, base * 0.27 + x * 0.73, 136, Math.sign(x) * 0.65, 1, "#739688");
  }
  drawHeads(ctx, rows, open);
  ctx.restore();
  for (const [radius, color, width] of [
    [287, "#d0bb9999", 3],
    [295, "#d0bb9966", 1],
  ]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}
function drawHeads(ctx, heads, progress) {
  heads.forEach(([x, y, angle, size, type, colors], index) => {
    const phase = Math.max(
      0,
      Math.min(1, progress * 1.45 - (index * 0.45) / (heads.length - 1)),
    );
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size, size);
    blossom(ctx, type, colors, phase * phase * (3 - 2 * phase));
    ctx.restore();
  });
}
function drawBouquet(progress) {
  const ctx = byId("bouquet").getContext("2d");
  ctx.clearRect(0, 0, 640, 680);
  ctx.save();
  ctx.translate(320, 373);
  ctx.scale(1.22, 1.22);
  const tissue = new Path2D(
    "M-195 -52 Q-224 -132 -193 -159 Q-185 -177 -163 -168 Q-154 -212 -123 -203 Q-107 -245 -74 -228 Q-44 -266 -10 -243 Q21 -268 52 -241 Q83 -250 105 -220 Q141 -232 153 -193 Q184 -200 188 -161 Q218 -152 199 -95 Q183 -45 155 -5 L25 197 L-27 197Z",
  );
  ctx.fillStyle = "#eac4ce";
  ctx.fill(tissue);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffe1df";
  ctx.stroke(tissue);
  ctx.save();
  ctx.clip(tissue);
  ctx.scale(0.89, 0.89);
  sprig(ctx, -4, 98, -0.62, 1.64);
  sprig(ctx, 8, 90, 0.68, 1.72);
  const heads = [
    [-140, -133, -0.42, 0.74, "tulip", lilac],
    [-80, -179, -0.24, 0.78, "rose", peach],
    [-16, -195, -0.08, 0.8, "tulip", rose],
    [55, -186, 0.13, 0.8, "rose", rose],
    [122, -150, 0.38, 0.85, "tulip", peach],
    [-160, -71, -0.48, 0.76, "rose", rose],
    [-91, -100, -0.35, 0.86, "tulip", rose],
    [-28, -127, -0.11, 0.84, "rose", lilac],
    [42, -113, 0.1, 0.88, "tulip", lilac],
    [114, -89, 0.25, 0.88, "rose", peach],
    [165, -58, 0.42, 0.65, "tulip", lilac],
    [-90, -40, -0.31, 0.85, "rose", peach],
    [-26, -47, -0.12, 0.83, "tulip", peach],
    [45, -46, 0.17, 0.88, "rose", rose],
  ];
  for (const [x, y] of heads) {
    paint(ctx, `M0 127 Q${x} 0 ${x} ${y}`, null, "#70947a", 4);
  }
  drawHeads(ctx, heads, progress);
  ctx.restore();
  const paper = ctx.createLinearGradient(-166, -58, 110, 148);
  paper.addColorStop(0, "#fff0db");
  paper.addColorStop(0.58, "#efd0bc");
  paper.addColorStop(1, "#d7a6ac");
  paint(
    ctx,
    "M-194 -69 Q-179 -86 -151 -67 Q-53 -38 70 75 L47 167 Q56 190 65 206 Q22 224 -37 211 Q-55 207 -72 195 L-47 153 Q-99 76 -194 -69Z",
    paper,
    "#dcafa9",
    1.5,
  );
  paint(
    ctx,
    "M195 -78 Q178 -91 152 -71 Q48 -32 -51 78 Q-47 119 -42 150 L-67 199 Q-10 223 62 204 L40 157 Q96 70 195 -78Z",
    "#fce6dc",
    "#d6a9a6",
    1.5,
  );
  ctx.save();
  ctx.setLineDash([2, 5]);
  ctx.lineCap = "round";
  paint(
    ctx,
    "M180 -72 Q75 -40 -41 81 Q-38 119 -34 150 M-50 196 Q-2 210 49 200",
    null,
    "#c78f99",
    1.8,
  );
  ctx.restore();
  paint(ctx, "M-46 139 Q1 149 47 135 L42 151 Q0 165 -42 154Z", "#d790a6");
  paint(
    ctx,
    "M0 149 Q-28 166 -46 183 L-44 168 L-60 170 Q-36 147 -5 143 M3 148 Q24 164 49 174 L38 178 L42 188 Q13 176 0 151Z",
    "#d58ba3",
  );
  paint(
    ctx,
    "M0 148 C-19 114 -72 106 -63 134 Q-58 155 -3 151 C51 160 70 139 61 123 Q47 107 3 143Z",
    "#e7a7b7",
    "#bf8093",
    2,
  );
  paint(
    ctx,
    "M-7 144 Q-13 132 -4 132 Q1 132 2 137 Q10 127 15 136 Q18 144 2 154Z",
    "#ffe0d8",
    "#c88f9a",
    1,
  );
  ctx.restore();
}
const visible = new Set();
let bloomStart = null;
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target.id);
    else visible.delete(entry.target.id);
    if (
      entry.target.id === "flowers" &&
      entry.isIntersecting &&
      bloomStart === null
    )
      bloomStart = performance.now();
  }
});
for (const id of ["hills", "meadow", "flowers"]) observer.observe(byId(id));
function landscape(canvas, time, isFooter) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * ratio) ||
    canvas.height !== Math.round(h * ratio)
  ) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ["#435657", "#30484b", "#213d40", "#142c32"].forEach((color, i) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 5; x += 5) {
      const t = x / w;
      const y =
        h *
        (0.37 +
          i * 0.145 +
          0.14 * Math.sin(t * 7 + i * 1.6) +
          0.055 * Math.cos(t * 15 + i));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });
  for (let x = 0; x < w + 4; x += 4) {
    const length = 10 + 24 * (1 + Math.sin(x * 5.17)) + (isFooter ? 18 : 6);
    const bend = length * (0.18 + 0.18 * Math.sin(time + x * 0.024));
    ctx.fillStyle = x % 12 ? "#142c32" : "#29474a";
    ctx.beginPath();
    ctx.moveTo(x - 2, h);
    ctx.quadraticCurveTo(x + 2, h - length * 0.6, x + bend, h - length);
    ctx.quadraticCurveTo(x + 6, h - length * 0.45, x + 3, h);
    ctx.fill();
  }
  if (isFooter) {
    ctx.save();
    ctx.translate(
      w * (0.5 + 0.31 * Math.sin(time * 0.45)),
      h * (0.36 + 0.1 * Math.sin(time * 1.7)),
    );
    ctx.rotate(0.14 * Math.cos(time));
    const oval = (x, y, a, b, rot, color) => {
      ctx.beginPath();
      ctx.ellipse(x, y, a, b, rot, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };
    oval(-4, -7, 4, 8, -0.6, "#dae7e0bf");
    oval(3, -7, 4, 7, 0.45, "#e6f3eed9");
    oval(0, 0, 10, 6, 0, "#edc377");
    oval(-2, 0, 2, 6, 0, "#544344");
    oval(7, 0, 4, 5, 0, "#544344");
    ctx.restore();
  }
}
let bouquetStart = null;
let previous = 0,
  lastBloom = -1;
function frame(now) {
  if (now - previous >= 32) {
    const t = reduceMotion.matches ? 0 : now / 1000;
    for (const id of ["hills", "meadow"])
      if (visible.has(id)) landscape(byId(id), t, id === "meadow");
    if (visible.has("flowers")) {
      const p = reduceMotion.matches
        ? 1
        : Math.max(0, Math.min(1, (now - bloomStart) / 4600));
      if (p !== lastBloom) {
        drawFlowers(p);
        lastBloom = p;
      }
    }
    if (dialog.open && bouquetStart !== null) {
      const progress = reduceMotion.matches
        ? 1
        : Math.min(1, Math.max(0, (now - bouquetStart) / 3000));
      drawBouquet(progress);
      if (progress === 1) bouquetStart = null;
    }
    previous = now;
  }
  requestAnimationFrame(frame);
}
drawFlowers(0);
requestAnimationFrame(frame);
const dialog = byId("giftDialog"),
  nameField = byId("name");
nameField.addEventListener("input", () => nameField.setCustomValidity(""));
byId("giftForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameField.value.trim();
  if (!name) {
    nameField.setCustomValidity("Masukkan namamu dulu, ya.");
    nameField.reportValidity();
    return;
  }
  byId("dedication").textContent = "Untuk " + name;
  bouquetStart = performance.now();
  drawBouquet(reduceMotion.matches ? 1 : 0);
  dialog.showModal();
});
byId("close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    dialog.close();
});

const piano = byId("piano");
const audioStatus = byId("audioStatus");
piano.volume = 0.85;

function mulaiPiano() {
  if (document.hidden || !piano.paused) return;
  piano.play().catch((error) => {
    if (error.name === "AbortError") return;
    if (error.name === "NotAllowedError") {
      audioStatus.textContent = "Ketuk halaman untuk memulai piano.";
      return;
    }
    audioStatus.textContent = "Piano gagal diputar (" + error.name + ").";
    console.error("Gagal memutar piano:", piano.currentSrc, error);
  });
}

piano.addEventListener("playing", () => {
  audioStatus.textContent = "";
});
const sumberAudio = piano.querySelectorAll("source");
sumberAudio[sumberAudio.length - 1].addEventListener("error", () => {
  audioStatus.textContent = "File piano gagal dimuat. Coba buka beranda di browser.";
});

document.addEventListener("click", mulaiPiano, true);
document.addEventListener("keydown", mulaiPiano, true);
document.addEventListener("visibilitychange", mulaiPiano);
window.addEventListener("pageshow", mulaiPiano);
mulaiPiano();
