// ── Interactive demos for project pages ──
// Project fragments are fetched into their tab as plain HTML, so inline
// <script> tags never run. script.js calls projectInits[tabId](el) once a
// fragment lands; each init wires up the demo inside that element.
window.projectInits = window.projectInits || {};

const PALETTE = ['#7798AB', '#C3DBC5', '#FF8484', '#114B5F', '#574B60'];
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ═══════════════════════════════════════════════════════════════════════
// TrieSpeller — a JS port of the Python Trie / TrieSpeller on the page
// ═══════════════════════════════════════════════════════════════════════
window.projectInits['project-trie'] = function initTrie(root) {
  const input = root.querySelector('#trie-input');
  const addInput = root.querySelector('#trie-add');
  const svg = root.querySelector('#trie-svg');
  const wrap = root.querySelector('.trie-canvas-wrap');
  const completions = root.querySelector('#trie-completions');
  const stat = id => root.querySelector('#' + id);
  if (!input || !svg) return;

  class Trie {
    constructor(letter) { this.root = letter; this.children = {}; this.final = false; }
    add(word) {
      let node = this;
      for (const ch of word) {
        if (!node.children[ch]) node.children[ch] = new Trie(ch);
        node = node.children[ch];
      }
      node.final = true;
    }
    walk(prefix) {
      let node = this;
      for (const ch of prefix) {
        node = node.children[ch];
        if (!node) return null;
      }
      return node;
    }
    words(acc, out) {
      if (this.final) out.push(acc);
      for (const ch of Object.keys(this.children).sort()) this.children[ch].words(acc + ch, out);
      return out;
    }
  }

  // one trie per starting letter, like the Python TrieSpeller
  const tries = {};
  for (const ch of 'abcdefghijklmnopqrstuvwxyz') tries[ch] = new Trie(ch);
  const speller = {
    add(word) {
      word = word.trim().toLowerCase();
      if (!/^[a-z]+$/.test(word)) return false;
      tries[word[0]].add(word.slice(1));
      return true;
    },
    node(prefix) { return prefix ? tries[prefix[0]].walk(prefix.slice(1)) : null; },
    isWord(w) { const n = this.node(w); return !!(n && n.final); },
    complete(prefix) { const n = this.node(prefix); return n ? n.words(prefix, []) : []; },
    numNext(prefix) { const n = this.node(prefix); return n ? Object.keys(n.children).length : 0; },
    numWords() { return Object.values(tries).reduce((s, t) => s + t.words('', []).length, 0); },
  };

  // a small dictionary with plenty of shared prefixes so the tree has shape
  const WORDS = `
    a able about above act action active actor add admit adult after again age agent ago agree
    air all allow almost alone along already also always among amount and animal another answer
    any appear apple apply area argue arm army around arrive art article artist as ask at attack
    attention away baby back bad bag ball bank bar base be bear beat beautiful because become bed
    before begin behind believe benefit best better between beyond big bill bit black blood blue
    board body book born both box boy break bring brother budget build building business but buy
    by call camera campaign can cancer candidate capital car card care career carry case catch cause
    cell center central century certain chair challenge chance change character charge check child
    choice choose church citizen city civil claim class clear clearly close coach cold collection
    college color come commercial common community company compare computer concern condition
    conference consider consumer contain continue control cost could country couple course court
    cover create crime cultural culture cup current customer cut dark data daughter day dead deal
    death debate decade decide decision deep defense degree democratic describe design despite
    detail determine develop development die difference different difficult dinner direction
    director discover discuss discussion disease do doctor dog door down draw dream drive drop
    drug during each early east easy eat economic economy edge education effect effort eight
    either election else employee end energy enjoy enough enter entire environment especially
    establish even evening event ever every everybody everyone everything evidence exactly example
    executive exist expect experience expert explain eye face fact factor fail fall family far fast
    father fear federal feel feeling few field fight figure fill film final finally financial find
    fine finger finish fire firm first fish five floor fly focus follow food foot for force foreign
    forget form former forward four free friend from front full fund future game garden gas general
    generation get girl give glass go goal good government great green ground group grow growth
    guess gun guy hair half hand hang happen happy hard have he head health hear heart heat heavy
    help her here herself high him himself his history hit hold home hope hospital hot hotel hour
    house how however huge human hundred husband idea identify if image imagine impact important
    improve in include including increase indeed indicate individual industry information inside
    instead institution interest interesting international interview into investment involve issue
    it item its itself job join just keep key kid kill kind kitchen know knowledge land language
    large last late later laugh law lawyer lay lead leader learn least leave left leg legal less
    let letter level lie life light like likely line list listen little live local long look lose
    loss lot love low machine magazine main maintain major majority make man manage management
    manager many market marriage material matter may maybe me mean measure media medical meet
    meeting member memory mention message method middle might military million mind minute miss
    mission model modern moment money month more morning most mother mouth move movement movie
    much music must my myself name nation national natural nature near nearly necessary need
    network never new news newspaper next nice night no none nor north not note nothing notice now
    number occur of off offer office officer official often oh oil ok old on once one only onto
    open operation opportunity option or order organization other others our out outside over own
    owner page pain painting paper parent part participant particular particularly partner party
    pass past patient pattern pay peace people per perform performance perhaps period person
    personal phone physical pick picture piece place plan plant play player point police policy
    political politics poor popular population position positive possible power practice prepare
    present president pressure pretty prevent price private probably problem process produce
    product production professional professor program project property protect prove provide
    public pull purpose push put quality question quickly quite race radio raise range rate rather
    reach read ready real reality realize really reason receive recent recently recognize record
    red reduce reflect region relate relationship religious remain remember remove report represent
    republican require research resource respond response responsibility rest result return
    reveal rich right rise risk road rock role room rule run safe same save say scene school science
    scientist score sea season seat second section security see seek seem sell send senior sense
    series serious serve service set seven several sex sexual shake share she shoot short shot
    should shoulder show side sign significant similar simple simply since sing single sister sit
    site situation six size skill skin small smile so social society soldier some somebody someone
    something sometimes son song soon sort sound source south southern space speak special specific
    speech spend sport spring staff stage stand standard star start state statement station stay
    step still stock stop store story strategy street strong structure student study stuff style
    subject success successful such suddenly suffer suggest summer support sure surface system
    table take talk task tax teach teacher team technology television tell ten tend term test than
    thank that the their them themselves then theory there these they thing think third this those
    though thought thousand threat three through throughout throw thus time to today together
    tonight too top total tough toward town trade traditional training travel treat treatment tree
    trial tribe trick tricky tried trie tries trip triple trivial trouble true truth try turn tv
    two type under understand unit until up upon us use usual usually value various very victim view
    violence visit voice vote wait walk wall want war watch water way we weapon wear week weight
    well west western what whatever when where whether which while white who whole whom whose why
    wide wife will win wind window wish with within without woman wonder word work worker world
    worry would write writer wrong yard yeah year yes yet you young your yourself
  `.split(/\s+/).filter(Boolean);
  WORDS.forEach(w => speller.add(w));

  // ── layout: a top-down tree of the subtree under the prefix ──
  const NODE_R = 13, X_GAP = 32, Y_GAP = 46, BUDGET = 70;

  // prune to a depth that keeps the drawing to BUDGET nodes
  function countTo(node, depth) {
    if (depth === 0) return 1;
    let n = 1;
    for (const c of Object.values(node.children)) n += countTo(c, depth - 1);
    return n;
  }
  function subtreeWords(node) { return node.words('', []).length; }

  function render(prefix) {
    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    };

    // the matched path: letters typed so far, each its own node on the spine
    let node = null, matched = '';
    const spine = [];
    if (prefix) {
      node = tries[prefix[0]];
      matched = prefix[0];
      spine.push({ letter: prefix[0], node, ok: true });
      for (const ch of prefix.slice(1)) {
        const next = node && node.children[ch];
        if (!next) { spine.push({ letter: ch, node: null, ok: false }); node = null; break; }
        node = next; matched += ch;
        spine.push({ letter: ch, node, ok: true });
      }
    }
    const broken = spine.some(s => !s.ok);

    // roots to lay out: the subtree under the prefix, or every starting letter
    let depth = 6;
    const subtreeRoots = node ? Object.keys(node.children).sort().map(k => node.children[k])
                       : (!prefix ? Object.keys(tries).sort().map(k => tries[k]).filter(t => subtreeWords(t) > 0) : []);
    const budgetFor = d => subtreeRoots.reduce((s, r) => s + countTo(r, d), 0);
    while (depth > 0 && budgetFor(depth) > BUDGET) depth--;

    // assign x by DFS leaf order; parents sit over the middle of their children
    const placed = [];   // {x, y, letter, final, node, hidden}
    let cursor = 0;
    function place(n, d, dLeft) {
      const kids = Object.keys(n.children).sort().map(k => n.children[k]);
      const me = { letter: n.root, final: n.final, y: d, node: n, hidden: 0, kids: [] };
      if (dLeft === 0 && kids.length) {
        me.hidden = subtreeWords(n) - (n.final ? 1 : 0);
        me.x = cursor++;
      } else if (!kids.length) {
        me.x = cursor++;
      } else {
        kids.forEach(k => me.kids.push(place(k, d + 1, dLeft - 1)));
        me.x = (me.kids[0].x + me.kids[me.kids.length - 1].x) / 2;
      }
      placed.push(me);
      return me;
    }
    const topLevel = subtreeRoots.map(r => place(r, spine.length, depth - 1));

    // size the drawing
    const width = Math.max(wrap.clientWidth - 2, (cursor || 1) * X_GAP + 40);
    const levels = spine.length + (topLevel.length ? depth : 0) + (prefix ? 0 : 0);
    const maxY = placed.reduce((m, p) => Math.max(m, p.y), spine.length - 1);
    const height = (maxY + 1) * Y_GAP + 24;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const leafSpan = Math.max(cursor - 1, 0) * X_GAP;
    const offsetX = Math.max(20 + NODE_R, (width - leafSpan) / 2);
    const px = x => offsetX + x * X_GAP;
    const py = y => 20 + y * Y_GAP;

    // the spine sits above the subtree, centred on it
    const spineX = topLevel.length
      ? px((topLevel[0].x + topLevel[topLevel.length - 1].x) / 2)
      : width / 2;

    const ink = cssVar('--text') || '#4a4a52';
    const faint = cssVar('--faint') || '#9ca3af';
    const line = cssVar('--border-soft') || '#d1d5db';
    const bg = cssVar('--bg') || '#fff';

    const edges = el('g', { stroke: line, 'stroke-width': 1.2, fill: 'none' });
    const nodes = el('g');
    svg.appendChild(edges); svg.appendChild(nodes);

    function drawNode(x, y, letter, opts) {
      const g = el('g', { class: 'trie-node' + (opts.cls ? ' ' + opts.cls : '') });
      g.appendChild(el('circle', { cx: x, cy: y, r: NODE_R,
        fill: opts.fill || bg, stroke: opts.stroke || line, 'stroke-width': opts.strokeWidth || 1.2 }));
      g.appendChild(el('text', { x, y: y + 4.5, 'text-anchor': 'middle',
        fill: opts.ink || ink, 'font-size': 13 }, letter));
      if (opts.final) g.appendChild(el('circle', { cx: x + NODE_R - 3, cy: y - NODE_R + 3, r: 3.2, fill: '#FF8484' }));
      if (opts.hidden) g.appendChild(el('text', { x, y: y + NODE_R + 13, 'text-anchor': 'middle',
        fill: faint, 'font-size': 10 }, `+${opts.hidden}`));
      if (opts.title) g.appendChild(el('title', {}, opts.title));
      if (opts.onClick) { g.style.cursor = 'pointer'; g.addEventListener('click', opts.onClick); }
      nodes.appendChild(g);
    }

    // spine
    spine.forEach((s, i) => {
      if (i > 0) edges.appendChild(el('line', { x1: spineX, y1: py(i - 1) + NODE_R, x2: spineX, y2: py(i) - NODE_R,
        stroke: s.ok ? PALETTE[0] : '#FF8484', 'stroke-width': 2 }));
      drawNode(spineX, py(i), s.letter, {
        fill: s.ok ? PALETTE[0] : '#FF8484', stroke: s.ok ? PALETTE[0] : '#FF8484', ink: '#FAF9F5',
        final: s.ok && s.node.final, strokeWidth: 2,
        onClick: () => { input.value = prefix.slice(0, i + 1); update(); },
      });
    });

    // subtree
    function drawTree(p, parentX, parentY) {
      const x = px(p.x), y = py(p.y);
      if (parentX != null) edges.appendChild(el('path', {
        d: `M${parentX},${parentY + NODE_R} C${parentX},${(parentY + y) / 2} ${x},${(parentY + y) / 2} ${x},${y - NODE_R}` }));
      const word = matched + pathTo(p);
      drawNode(x, y, p.letter, { final: p.final, hidden: p.hidden, title: word,
        onClick: () => { input.value = word; update(); } });
      p.kids.forEach(k => drawTree(k, x, y));
    }
    // rebuild the string for a placed node by walking parents (cheap: tree is tiny)
    const parentOf = new Map();
    placed.forEach(p => p.kids.forEach(k => parentOf.set(k, p)));
    function pathTo(p) {
      let s = '';
      for (let q = p; q; q = parentOf.get(q)) s = q.letter + s;
      return s;
    }
    const spineBottomY = spine.length ? py(spine.length - 1) : null;
    topLevel.forEach(t => drawTree(t, broken ? null : (spine.length ? spineX : null), spineBottomY));

    if (broken) {
      svg.appendChild(el('text', { x: spineX, y: py(spine.length) , 'text-anchor': 'middle', fill: faint, 'font-size': 12 },
        `no words start with “${prefix}”`));
      svg.setAttribute('height', py(spine.length) + 20);
    }
  }

  function update() {
    const raw = input.value.toLowerCase().replace(/[^a-z]/g, '');
    if (raw !== input.value) input.value = raw;
    const prefix = raw;

    const words = prefix ? speller.complete(prefix) : [];
    stat('trie-is-word').textContent = prefix ? (speller.isWord(prefix) ? 'True' : 'False') : '–';
    stat('trie-is-word').className = prefix ? (speller.isWord(prefix) ? 'ok' : 'no') : '';
    stat('trie-num-starting').textContent = words.length;
    stat('trie-num-next').textContent = prefix ? speller.numNext(prefix) : 0;
    stat('trie-num-words').textContent = speller.numWords();

    render(prefix);

    completions.innerHTML = '';
    const show = words.slice(0, 48);
    show.forEach(w => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'trie-chip';
      b.innerHTML = `<span class="trie-chip-prefix">${prefix}</span>${w.slice(prefix.length)}`;
      b.addEventListener('click', () => { input.value = w; update(); input.focus(); });
      completions.appendChild(b);
    });
    if (words.length > show.length) {
      const more = document.createElement('span');
      more.className = 'trie-more';
      more.textContent = `+${words.length - show.length} more`;
      completions.appendChild(more);
    }
  }

  input.addEventListener('input', update);
  addInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const w = addInput.value.trim().toLowerCase();
    if (speller.add(w)) {
      addInput.value = '';
      input.value = w;
      update();
      input.focus();
    } else {
      addInput.classList.add('shake');
      setTimeout(() => addInput.classList.remove('shake'), 400);
    }
  });
  new ResizeObserver(() => { if (wrap.clientWidth) update(); }).observe(wrap);
  document.getElementById('theme-toggle')?.addEventListener('click', () => setTimeout(update, 0));

  input.value = 'tri';
  update();
};

// ═══════════════════════════════════════════════════════════════════════
// Handwriting — draw a digit, watch a tiny CNN read it
// ═══════════════════════════════════════════════════════════════════════
window.projectInits['project-handwriting'] = function initHandwriting(root) {
  const pad = root.querySelector('#hw-pad');
  const inputView = root.querySelector('#hw-input');
  const maps1 = root.querySelector('#hw-maps1');
  const maps2 = root.querySelector('#hw-maps2');
  const bars = root.querySelector('#hw-bars');
  const verdict = root.querySelector('#hw-verdict');
  const clearBtn = root.querySelector('#hw-clear');
  const status = root.querySelector('#hw-status');
  if (!pad || !inputView) return;

  // ── drawing pad: ink is kept as an alpha mask so it re-tints with the theme
  const SIZE = 280;
  pad.width = SIZE; pad.height = SIZE;
  const mask = document.createElement('canvas');
  mask.width = SIZE; mask.height = SIZE;
  const mctx = mask.getContext('2d');
  const pctx = pad.getContext('2d');
  let drawing = false, last = null, dirty = false;

  function paintPad() {
    pctx.clearRect(0, 0, SIZE, SIZE);
    pctx.globalCompositeOperation = 'source-over';
    pctx.drawImage(mask, 0, 0);
    pctx.globalCompositeOperation = 'source-in';
    pctx.fillStyle = cssVar('--text') || '#4a4a52';
    pctx.fillRect(0, 0, SIZE, SIZE);
    pctx.globalCompositeOperation = 'source-over';
  }
  function pos(e) {
    const r = pad.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * SIZE / r.width, y: (t.clientY - r.top) * SIZE / r.height };
  }
  function stroke(a, b) {
    mctx.strokeStyle = '#000';
    mctx.lineWidth = 22;
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
    mctx.beginPath();
    mctx.moveTo(a.x, a.y);
    mctx.lineTo(b.x, b.y);
    mctx.stroke();
  }
  function start(e) { drawing = true; last = pos(e); stroke(last, last); paintPad(); e.preventDefault(); }
  function move(e) {
    if (!drawing) return;
    const p = pos(e); stroke(last, p); last = p; paintPad(); dirty = true; e.preventDefault();
    schedule();
  }
  function end() { if (drawing) { drawing = false; schedule(); } }
  pad.addEventListener('mousedown', start);
  pad.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  pad.addEventListener('touchstart', start, { passive: false });
  pad.addEventListener('touchmove', move, { passive: false });
  pad.addEventListener('touchend', end);
  clearBtn?.addEventListener('click', () => {
    mctx.clearRect(0, 0, SIZE, SIZE);
    paintPad();
    showEmpty();
  });
  document.getElementById('theme-toggle')?.addEventListener('click', () => setTimeout(() => { paintPad(); schedule(); }, 0));

  // ── preprocessing: the same centring MNIST used, so the net sees familiar input
  // crop to the ink's bounding box, scale the long side to 20px, drop it into a
  // 28×28 frame with its centre of mass at the middle
  function toMnist() {
    const img = mctx.getImageData(0, 0, SIZE, SIZE).data;
    let minX = SIZE, minY = SIZE, maxX = -1, maxY = -1;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (img[(y * SIZE + x) * 4 + 3] > 20) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;
    const w = maxX - minX + 1, h = maxY - minY + 1;
    const scale = 20 / Math.max(w, h);
    const tw = Math.max(1, Math.round(w * scale)), th = Math.max(1, Math.round(h * scale));
    const small = document.createElement('canvas');
    small.width = 28; small.height = 28;
    const sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    // first pass: centre the bounding box
    sctx.drawImage(mask, minX, minY, w, h, Math.floor((28 - tw) / 2), Math.floor((28 - th) / 2), tw, th);
    let d = sctx.getImageData(0, 0, 28, 28).data;
    let sum = 0, sx = 0, sy = 0;
    const px = new Float32Array(784);
    for (let i = 0; i < 784; i++) {
      const v = d[i * 4 + 3] / 255;
      px[i] = v; sum += v; sx += v * (i % 28); sy += v * Math.floor(i / 28);
    }
    if (sum > 0) {
      // second pass: shift so the centre of mass sits at (13.5, 13.5)
      const dx = Math.round(13.5 - sx / sum), dy = Math.round(13.5 - sy / sum);
      if (dx || dy) {
        sctx.clearRect(0, 0, 28, 28);
        sctx.drawImage(mask, minX, minY, w, h, Math.floor((28 - tw) / 2) + dx, Math.floor((28 - th) / 2) + dy, tw, th);
        d = sctx.getImageData(0, 0, 28, 28).data;
        for (let i = 0; i < 784; i++) px[i] = d[i * 4 + 3] / 255;
      }
    }
    return px;
  }

  // ── the network: conv(1→8) relu pool, conv(8→16) relu pool, linear(784→10)
  let W = null, loading = null;
  function loadWeights() {
    if (W || loading) return loading;
    status.textContent = 'loading model…';
    loading = fetch('projects/mnist-weights.json')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(j => {
        W = { c1w: j['c1.weight'], c1b: j['c1.bias'], c2w: j['c2.weight'], c2b: j['c2.bias'], fcw: j['fc.weight'], fcb: j['fc.bias'] };
        status.textContent = '';
        schedule();
      })
      .catch(err => { status.textContent = 'model failed to load'; console.error(err); });
    return loading;
  }

  // x: [cin][n*n] flat as Float32Array(cin*n*n); 3×3 kernels, padding 1
  function conv(x, n, cin, cout, w, b) {
    const out = new Float32Array(cout * n * n);
    for (let o = 0; o < cout; o++) {
      const ob = o * n * n;
      for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
        let s = b[o];
        for (let i = 0; i < cin; i++) {
          const ib = i * n * n, wb = (o * cin + i) * 9;
          for (let ky = -1; ky <= 1; ky++) {
            const yy = y + ky; if (yy < 0 || yy >= n) continue;
            for (let kx = -1; kx <= 1; kx++) {
              const xk = xx + kx; if (xk < 0 || xk >= n) continue;
              s += x[ib + yy * n + xk] * w[wb + (ky + 1) * 3 + (kx + 1)];
            }
          }
        }
        out[ob + y * n + xx] = s > 0 ? s : 0;   // relu
      }
    }
    return out;
  }
  function pool(x, n, c) {
    const m = n / 2, out = new Float32Array(c * m * m);
    for (let i = 0; i < c; i++) for (let y = 0; y < m; y++) for (let xx = 0; xx < m; xx++) {
      const b = i * n * n + 2 * y * n + 2 * xx;
      out[i * m * m + y * m + xx] = Math.max(x[b], x[b + 1], x[b + n], x[b + n + 1]);
    }
    return out;
  }
  function forward(px) {
    const a1 = pool(conv(px, 28, 1, 8, W.c1w, W.c1b), 28, 8);     // 8×14×14
    const a2 = pool(conv(a1, 14, 8, 16, W.c2w, W.c2b), 14, 16);   // 16×7×7
    const logits = new Float32Array(10);
    for (let o = 0; o < 10; o++) {
      let s = W.fcb[o];
      for (let i = 0; i < 784; i++) s += W.fcw[o * 784 + i] * a2[i];
      logits[o] = s;
    }
    const mx = Math.max(...logits);
    const ex = logits.map(v => Math.exp(v - mx));
    const z = ex.reduce((a, b) => a + b, 0);
    return { probs: ex.map(v => v / z), a1, a2 };
  }

  // ── views
  function drawGrid(canvas, data, n, scale, color) {
    canvas.width = n * scale; canvas.height = n * scale;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    let mx = 0;
    for (let i = 0; i < n * n; i++) if (data[i] > mx) mx = data[i];
    if (mx === 0) return;
    c.fillStyle = color;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = data[y * n + x] / mx;
      if (v <= 0.02) continue;
      c.globalAlpha = v;
      c.fillRect(x * scale, y * scale, scale, scale);
    }
    c.globalAlpha = 1;
  }
  function drawMaps(container, data, n, count, scale) {
    if (container.children.length !== count) {
      container.innerHTML = '';
      for (let i = 0; i < count; i++) container.appendChild(document.createElement('canvas'));
    }
    for (let i = 0; i < count; i++) {
      drawGrid(container.children[i], data.subarray(i * n * n, (i + 1) * n * n), n, scale, PALETTE[i % PALETTE.length]);
    }
  }
  function drawBars(probs) {
    if (bars.children.length !== 10) {
      bars.innerHTML = '';
      for (let d = 0; d < 10; d++) {
        const col = document.createElement('div');
        col.className = 'hw-bar';
        col.innerHTML = `<div class="hw-bar-track"><div class="hw-bar-fill"></div></div><span>${d}</span>`;
        bars.appendChild(col);
      }
    }
    let best = -1;
    if (probs) probs.forEach((p, i) => { if (best < 0 || p > probs[best]) best = i; });
    for (let d = 0; d < 10; d++) {
      const col = bars.children[d];
      col.querySelector('.hw-bar-fill').style.height = probs ? `${Math.round(probs[d] * 100)}%` : '0%';
      col.classList.toggle('best', d === best);
    }
    return best;
  }
  function showEmpty() {
    drawGrid(inputView, new Float32Array(784), 28, 4, '#000');
    maps1.innerHTML = ''; maps2.innerHTML = '';
    drawBars(null);
    verdict.textContent = '';
    verdict.className = 'hw-verdict';
  }

  // ── run after each stroke, throttled to the next frame
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; run(); });
  }
  function run() {
    const px = toMnist();
    if (!px) { showEmpty(); return; }
    drawGrid(inputView, px, 28, 4, cssVar('--text') || '#4a4a52');
    if (!W) { loadWeights(); return; }
    const { probs, a1, a2 } = forward(px);
    drawMaps(maps1, a1, 14, 8, 3);
    drawMaps(maps2, a2, 7, 16, 4);
    const best = drawBars(probs);
    const conf = probs[best];
    verdict.textContent = `${best}`;
    verdict.className = 'hw-verdict ' + (conf > 0.8 ? 'sure' : conf > 0.5 ? 'hmm' : 'unsure');
    verdict.title = `${Math.round(conf * 100)}% confident`;
    status.textContent = `${Math.round(conf * 100)}% confident`;
  }

  showEmpty();
  loadWeights();
};
