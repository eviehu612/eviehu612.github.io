// ── Redaction grades: shared by the About decipher and hover pixelation ──
const rxGrades = ['Redaction 100', 'Redaction 70', 'Redaction 50',
                  'Redaction 35', 'Redaction 20', 'Redaction 10'];
const rxReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let rxFontsReady = null;
const loadRxGrades = () =>
  rxFontsReady = rxFontsReady || Promise.all(rxGrades.map(g => document.fonts.load(`16px '${g}'`)));

// ── Decipher: step an element down through the degraded grades on reveal ──
function decipherEl(el, setFont, clearFont) {
  if (rxReduced) return;
  const stepMs = 170;
  const id = (el._rxDecipher = (el._rxDecipher || 0) + 1);
  // wait for the grade fonts so every step renders, not the fallback
  loadRxGrades().then(() => {
    if (id !== el._rxDecipher) return;
    rxGrades.forEach((g, i) => {
      setTimeout(() => {
        if (id === el._rxDecipher) setFont(`'${g}', Georgia, serif`);
      }, i * stepMs);
    });
    setTimeout(() => {
      if (id === el._rxDecipher) clearFont();
    }, rxGrades.length * stepMs);
  });
}

// the About text deciphers as one block via its shared font variable
const decipherAbout = () => {
  const text = document.querySelector('.about-text');
  if (!text) return;
  decipherEl(text,
    v => text.style.setProperty('--about-font', v),
    () => text.style.removeProperty('--about-font'));
};

// every hover-pixelated title deciphers when its tab appears
const decipherHeaders = el =>
  el.querySelectorAll('h1, .likes-heading').forEach(h =>
    decipherEl(h, v => { h.style.fontFamily = v; }, () => { h.style.fontFamily = ''; }));

// ── Hover pixelation: words snap to the roughest grade, then re-resolve ──
// wrap each word in a span so it can carry its own font
function wrapWords(el) {
  if (el.dataset.rxWrapped) return;
  el.dataset.rxWrapped = 'true';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!node.nodeValue.trim()) return;
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/\s/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'rx-word';
        span.textContent = part;
        frag.appendChild(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}

(function initPixelHover() {
  // static targets: the whole About text plus the landing and section titles
  document.querySelectorAll(
    '.about-text h1, .about-text h2, .about-text p:not(.about-updated), .home-content h1, #blog > h1, #projects > h1'
  ).forEach(wrapWords);

  const back = rxGrades.slice(1);
  document.addEventListener('mouseover', e => {
    const word = e.target.closest('.rx-word');
    if (!word) return;
    loadRxGrades();
    (word._rx || []).forEach(clearTimeout);
    word.style.fontFamily = "'Redaction 100', Georgia, serif";
  });
  document.addEventListener('mouseout', e => {
    const word = e.target.closest('.rx-word');
    if (!word) return;
    if (rxReduced) { word.style.fontFamily = ''; return; }
    word._rx = back.map((g, i) =>
      setTimeout(() => { word.style.fontFamily = `'${g}', Georgia, serif`; }, (i + 1) * 110));
    word._rx.push(setTimeout(() => { word.style.fontFamily = ''; }, (back.length + 1) * 110));
  });
})();

// Fisher–Yates over an element's children, so the "cool people" links
// land in a fresh random order on every page load
function shuffleChildren(el) {
  const kids = [...el.children];
  for (let i = kids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kids[i], kids[j]] = [kids[j], kids[i]];
  }
  kids.forEach(k => el.appendChild(k));
}

// old anchors that still circulate in links
const tabAliases = { 'things-i-like': 'miscellany' };

function showTab(name) {
  name = tabAliases[name] || name;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(name);
  if (!el) return;
  el.classList.add('active');
  if (name === 'about') decipherAbout();
  else if (el.innerHTML.trim() !== '' || !el.getAttribute('data-src')) decipherHeaders(el);

  // highlight the nav tab for the current section (posts → Blog, projects → Projects)
  const section = name.startsWith('post-') ? 'blog'
                : name.startsWith('project-') ? 'projects'
                : name;
  document.querySelectorAll('nav a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + section));
  const src = el.getAttribute('data-src');
  if (src && el.innerHTML.trim() === '') {
    fetch(src)
      .then(r => r.text())
      .then(html => {
        el.innerHTML = html;
        el.querySelectorAll('.likes-people-list').forEach(shuffleChildren);
        // page titles get the hover pixelation once the fragment lands
        el.querySelectorAll('h1, .likes-heading').forEach(wrapWords);
        decipherHeaders(el);
        if (window.Prism) el.querySelectorAll('pre code').forEach(c => Prism.highlightElement(c));
        // interactive project demos live in projects.js
        if (window.projectInits && window.projectInits[name]) window.projectInits[name](el);
      })
      .catch(err => console.error('Error loading content:', err));
  }
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const name = a.getAttribute('href').slice(1);
  if (!name) return;
  e.preventDefault();
  history.pushState(null, '', '#' + name);
  showTab(name);
});

window.addEventListener('popstate', () => {
  showTab(location.hash.slice(1) || 'home');
});

// ── Dark mode toggle (initial theme is applied inline in <head>) ──
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

showTab(location.hash.slice(1) || 'home');

// ── About page decorative grid ──
(function initAboutDeco() {
  const panel = document.getElementById('about-deco');
  const text = document.querySelector('.about-text');
  if (!panel || !text) return;

  const cols = 9, cellSize = 22, baseRows = 16;
  const colors = [
    '#7798AB', '#C3DBC5', '#FF8484',
    '#114B5F', '#574B60', '#7798AB',
    '#C3DBC5', '#FF8484', '#114B5F'
  ];

  // bar heights per column (out of `baseRows`, scaled to the actual row count)
  const baseHeights = [7, 11, 5, 14, 9, 6, 13, 8, 10];

  let rows = 0;

  function build() {
    let html = '';
    for (let c = 0; c < cols; c++) {
      const barHeight = Math.max(1, Math.round(baseHeights[c] * rows / baseRows));
      html += '<div class="deco-col">';
      for (let r = 0; r < rows; r++) {
        const filled = r >= rows - barHeight;
        const style = filled ? `background:${colors[c % colors.length]}` : '';
        html += `<div class="deco-cell" style="${style}"></div>`;
      }
      html += '</div>';
    }
    panel.innerHTML = html;
  }

  // on the first reveal, fill the bars arcade-style: discrete chunky ticks
  // with no easing — every bar rises in lockstep like a retro loading
  // screen, then locks in with a quick top-cell blink swept left to right
  let entered = false;
  function entrance() {
    if (entered) return;
    entered = true;
    if (rxReduced) return;
    const TICKS = 12, TICK_MS = 80;
    // per-column filled cells, bottom-up
    const bars = [...panel.children].map(colEl =>
      [...colEl.children].filter(cell => cell.style.backgroundColor).reverse());
    bars.flat().forEach(cell => {
      cell._final = cell.style.backgroundColor;
      cell.style.transition = 'background-color 0ms';
      cell.style.backgroundColor = '';
    });
    for (let t = 1; t <= TICKS; t++) {
      setTimeout(() => {
        bars.forEach(bar => {
          bar.slice(0, Math.round(bar.length * t / TICKS)).forEach(cell => {
            cell.style.backgroundColor = cell._final;
          });
        });
      }, 150 + t * TICK_MS);
    }
    bars.forEach((bar, c) => {
      const top = bar[bar.length - 1];
      if (!top) return;
      const at = 150 + (TICKS + 1) * TICK_MS + c * 60;
      setTimeout(() => { top.style.backgroundColor = ''; }, at);
      setTimeout(() => { top.style.backgroundColor = top._final; }, at + 90);
    });
  }

  // match the grid height to the text column; the tab is display:none at
  // load, so the observer builds it once the tab first becomes visible
  function sync() {
    const target = Math.round(text.offsetHeight / cellSize);
    if (target > 0 && target !== rows) {
      rows = target;
      build();
      entrance();
    }
  }

  new ResizeObserver(sync).observe(text);
  sync();

  // the build() pattern color for a given cell
  function patternColor(col, row) {
    const barHeight = Math.max(1, Math.round(baseHeights[col] * rows / baseRows));
    return row >= rows - barHeight ? colors[col % colors.length] : '';
  }

  // while the mouse is actively moving over the grid, hold off any drift-back
  let lastMove = 0;
  panel.addEventListener('mousemove', () => { lastMove = Date.now(); });

  function scheduleDrift(cell, col, row, delay) {
    clearTimeout(cell._drift);
    cell._drift = setTimeout(() => {
      if (Date.now() - lastMove < 500) {
        scheduleDrift(cell, col, row, 400 + Math.random() * 900);
        return;
      }
      cell.style.transition = 'background-color 2400ms ease';
      cell.style.backgroundColor = patternColor(col, row);
    }, delay);
  }

  panel.addEventListener('mouseover', e => {
    const cell = e.target.closest('.deco-cell');
    if (!cell) return;
    clearTimeout(cell._drift);
    cell.style.transition = 'background-color 0ms';
    cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  });
  panel.addEventListener('mouseout', e => {
    const cell = e.target.closest('.deco-cell');
    if (!cell) return;
    const col = [...cell.parentElement.parentElement.children].indexOf(cell.parentElement);
    const row = [...cell.parentElement.children].indexOf(cell);
    // reveal the starting pattern flipped over the x axis and then the y axis
    // (a 180° rotation): bars hang from the top, column order mirrored
    cell.style.transition = 'background-color 600ms ease';
    cell.style.backgroundColor = patternColor(cols - 1 - col, rows - 1 - row);
    // after a while, drift back to the original pattern
    scheduleDrift(cell, col, row, 3500 + Math.random() * 3000);
  });
})();

// ── Writing page: a very slow Brian's Brain drifts behind the post list ──
// Three states per cell: off, on, dying. An off cell switches on when exactly
// two of its eight neighbours are on; on cells always become dying; dying
// cells always switch off. The grid wraps at the edges.
(function initBlogDeco() {
  const tab = document.getElementById('blog');
  const canvas = document.getElementById('blog-deco');
  const toggle = document.getElementById('blog-deco-toggle');
  if (!tab || !canvas || !toggle) return;

  const ctx = canvas.getContext('2d');
  const colors = ['#7798AB', '#C3DBC5', '#FF8484', '#114B5F', '#574B60'];
  const CELL = 16;        // px per cell
  const GEN_MS = 1400;    // one generation every 1.4s — glacial on purpose
  const OFF = 0, ON = 1, DYING = 2;

  let cols = 0, rows = 0;
  let state = new Uint8Array(0), next = new Uint8Array(0);
  let hue = new Uint8Array(0), nextHue = new Uint8Array(0);
  let timer = null;

  // remember the visitor's choice; reduced-motion users start paused
  let running;
  try { running = localStorage.getItem('brain') !== 'paused' && !rxReduced; }
  catch (e) { running = !rxReduced; }

  function seed(cx, cy, radius, density) {
    for (let r = cy - radius; r <= cy + radius; r++) {
      for (let c = cx - radius; c <= cx + radius; c++) {
        if (Math.random() > density) continue;
        const i = ((r + rows) % rows) * cols + ((c + cols) % cols);
        state[i] = ON;
        hue[i] = Math.floor(Math.random() * colors.length);
      }
    }
  }

  function step() {
    for (let r = 0; r < rows; r++) {
      const up = ((r - 1 + rows) % rows) * cols;
      const mid = r * cols;
      const dn = ((r + 1) % rows) * cols;
      for (let c = 0; c < cols; c++) {
        const i = mid + c;
        const s = state[i];
        if (s === ON) { next[i] = DYING; nextHue[i] = hue[i]; continue; }
        if (s === DYING) { next[i] = OFF; nextHue[i] = hue[i]; continue; }
        const l = (c - 1 + cols) % cols, rt = (c + 1) % cols;
        let n = 0, mix = -1;
        const look = j => { if (state[j] === ON) { n++; mix = hue[j]; } };
        look(up + l); look(up + c); look(up + rt);
        look(mid + l); look(mid + rt);
        look(dn + l); look(dn + c); look(dn + rt);
        if (n === 2) {
          next[i] = ON;
          // mostly inherit a parent's colour, occasionally mutate
          nextHue[i] = Math.random() < 0.9 ? mix : Math.floor(Math.random() * colors.length);
        } else {
          next[i] = OFF; nextHue[i] = hue[i];
        }
      }
    }
    [state, next] = [next, state];
    [hue, nextHue] = [nextHue, hue];
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (state[i] === OFF) continue;
        ctx.globalAlpha = state[i] === ON ? 1 : 0.35;
        ctx.fillStyle = colors[hue[i]];
        ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick() {
    // the tab is display:none when not selected; don't burn cycles offscreen
    if (document.hidden || canvas.offsetWidth === 0) return;
    step();
    draw();
  }

  function setRunning(on) {
    running = on;
    toggle.textContent = on ? 'pause' : 'play';
    toggle.setAttribute('aria-pressed', String(!on));
    clearInterval(timer);
    timer = on ? setInterval(tick, GEN_MS) : null;
    try { localStorage.setItem('brain', on ? 'running' : 'paused'); } catch (e) {}
  }

  // size the canvas to the tab; it is display:none at load, so the observer
  // builds the grid once the tab first becomes visible
  let seeded = false;
  function sync() {
    const c = Math.ceil(canvas.offsetWidth / CELL);
    const r = Math.ceil(canvas.offsetHeight / CELL);
    if (c <= 0 || r <= 0 || (c === cols && r === rows)) return;
    const old = { state, hue, cols, rows };
    cols = c; rows = r;
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
    state = new Uint8Array(cols * rows); next = new Uint8Array(cols * rows);
    hue = new Uint8Array(cols * rows); nextHue = new Uint8Array(cols * rows);
    // carry what fits across a resize instead of restarting
    for (let rr = 0; rr < Math.min(rows, old.rows); rr++) {
      for (let cc = 0; cc < Math.min(cols, old.cols); cc++) {
        state[rr * cols + cc] = old.state[rr * old.cols + cc];
        hue[rr * cols + cc] = old.hue[rr * old.cols + cc];
      }
    }
    if (!seeded) {
      seeded = true;
      seed(Math.floor(cols * 0.65), Math.floor(rows * 0.4), 4, 0.5);
      seed(Math.floor(cols * 0.85), Math.floor(rows * 0.75), 3, 0.5);
      seed(Math.floor(cols * 0.3), Math.floor(rows * 0.8), 3, 0.5);
    }
    draw();
  }
  new ResizeObserver(sync).observe(canvas);
  sync();

  toggle.addEventListener('click', () => setRunning(!running));
  setRunning(running);

  // click anywhere to drop a fresh cluster of live cells
  tab.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const rect = canvas.getBoundingClientRect();
    seed(Math.floor((e.clientX - rect.left) / CELL),
         Math.floor((e.clientY - rect.top) / CELL), 3, 0.5);
    draw();
  });
})();

// ── Background boxes for home tab ──
(function initBoxes() {
  const grid = document.getElementById('boxes-grid');
  if (!grid) return;

  const rows = 150, cols = 100;
  const colors = [
    '#7798AB', '#C3DBC5', '#FF8484',
    '#114B5F', '#574B60', '#7798AB',
    '#C3DBC5', '#FF8484', '#114B5F'
  ];

  let html = '';
  for (let i = 0; i < rows; i++) {
    html += '<div class="box-row">';
    for (let j = 0; j < cols; j++) {
      html += '<div class="box-cell"></div>';
    }
    html += '</div>';
  }
  grid.innerHTML = html;

  // light a cell instantly, then let it fade once the cursor has moved on;
  // re-touching a lit cell extends its life without strobing a new color
  function light(cell) {
    if (!cell.style.backgroundColor) {
      cell.style.transition = 'background-color 0ms';
      cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    }
    clearTimeout(cell._fade);
    cell._fade = setTimeout(() => {
      cell.style.transition = 'background-color 600ms ease';
      cell.style.backgroundColor = '';
    }, 150);
  }

  // sample along the pointer's path so fast flicks light every cell they
  // cross, not just the few positions the browser happens to report
  let last = null;
  grid.addEventListener('mousemove', e => {
    const pts = [[e.clientX, e.clientY]];
    if (last) {
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      const steps = Math.min(60, Math.floor(Math.hypot(dx, dy) / 10));
      for (let i = 1; i < steps; i++) {
        pts.push([last.x + dx * i / steps, last.y + dy * i / steps]);
      }
    }
    last = { x: e.clientX, y: e.clientY };
    pts.forEach(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      const cell = el && el.closest('.box-cell');
      if (cell) light(cell);
    });
  });
  grid.addEventListener('mouseleave', () => { last = null; });
})();
