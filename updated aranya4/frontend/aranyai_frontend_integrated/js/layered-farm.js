/* ============================================================
   AranyaAI — Layered mixed-plantation & intercropping layout
   ------------------------------------------------------------
   Draws an isometric farm (same idea as the "Layered Profit Model"
   reference image) from the numbers the plantation calculator returns:

     * every selected species gets its own contiguous row-band (mixed plantation)
     * intercrop strips are drawn between the tree rows
     * host plants (Sandalwood) and climbers (black pepper) are drawn
       next to / on the trees they belong with
     * optional boundary belt, access path and drip-irrigation channel
     * legend of the four profit layers + a photo-based intercropping plan

   Intercrop suggestions are taken from this project's own species
   guidance (js/species-knowledge.js "intercrops" / "supporting_tree").
   The drawing is a schematic: it is not to scale and shows at most
   14 trees per row and 12 rows even when the real plot is larger.
   ============================================================ */
(function () {
  'use strict';

  var uid = 0;
  var f = function (n) { return (Math.round(n * 10) / 10).toString(); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var rng = function (a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- Layers (mirrors the reference picture) ---------- */
  var LAYERS = {
    timber:    { order: 0, icon: '🌳', label: 'Timber layer',    sub: 'Outer boundary & windbreak · long-term timber',  grass: ['#6fae55', '#5a9a45'] },
    core:      { order: 1, icon: '🌱', label: 'Core layer',      sub: 'High-value trees, with host plants where needed', grass: ['#86bc5c', '#74ac50'] },
    secondary: { order: 2, icon: '🎋', label: 'Secondary layer', sub: 'Palms, orchard & bamboo · earlier returns',       grass: ['#7db856', '#6aa74a'] },
    ground:    { order: 3, icon: '🌾', label: 'Ground layer',    sub: 'Short-duration crops & intercrops',               grass: ['#93c85f', '#82b954'] }
  };
  var LAYER_KEYS = ['timber', 'core', 'secondary', 'ground'];
  var LAYER_EXAMPLES = { timber: 'e.g. Teak, Mahogany', core: 'e.g. Sandalwood', secondary: 'e.g. Bamboo, Coconut, Mango', ground: 'e.g. Turmeric, Ginger' };

  /* ---------- How each species is drawn ---------- */
  var G = function (l, m, d) { return [l, m, d]; };
  var VIS = {
    'Teak':        { shape: 'tree', c: G('#7dbb62', '#3f8c3d', '#1f5a2b'), s: 1.05, layer: 'timber' },
    'Mahogany':    { shape: 'tree', c: G('#6aa95a', '#2f7a3a', '#174d27'), s: 1.0,  layer: 'timber' },
    'Rosewood':    { shape: 'tree', c: G('#70b062', '#3b8a47', '#1e5c31'), s: 0.95, layer: 'timber' },
    'Silver Oak':  { shape: 'tree', c: G('#b4c866', '#7f9f3f', '#54732b'), s: 0.95, layer: 'timber' },
    'Eucalyptus':  { shape: 'tree', c: G('#a4d1bd', '#66a892', '#3f7a68'), s: 0.85, layer: 'timber' },
    'Neem':        { shape: 'tree', c: G('#93cc6a', '#5aa543', '#367a2b'), s: 1.0,  layer: 'timber' },
    'Sandalwood':  { shape: 'tree', c: G('#f3f6d6', '#d3e0a6', '#a8c17a'), s: 0.95, layer: 'core' },
    'Red Sanders': { shape: 'tree', c: G('#c1da86', '#8fb455', '#607f35'), s: 0.9,  layer: 'core' },
    'Agarwood':    { shape: 'tree', c: G('#a7d883', '#70b54d', '#457e35'), s: 0.9,  layer: 'core' },
    'Mango':       { shape: 'tree', c: G('#86c45f', '#4b9c3d', '#2a6a2c'), s: 1.05, layer: 'secondary', fruit: '#f2a531' },
    'Jackfruit':   { shape: 'tree', c: G('#68b25f', '#3a8a45', '#1f5d30'), s: 1.0,  layer: 'secondary', fruit: '#c9a53a' },
    'Guava':       { shape: 'tree', c: G('#b0d670', '#82b84d', '#588a36'), s: 0.85, layer: 'secondary', fruit: '#f1e27a' },
    'Amla':        { shape: 'tree', c: G('#c5e07f', '#98c455', '#6b9a3c'), s: 0.8,  layer: 'secondary' },
    'Cashew':      { shape: 'tree', c: G('#88c06d', '#58a04e', '#347538'), s: 0.9,  layer: 'secondary', fruit: '#e9783a' },
    'Moringa':     { shape: 'tree', c: G('#cce58e', '#a4d05f', '#78a745'), s: 0.75, layer: 'secondary' },
    'Coconut':     { shape: 'palm', c: G('#7fbf4d', '#4e9a35', '#2b6b25'), s: 1.15, layer: 'secondary' },
    'Arecanut':    { shape: 'palm', c: G('#8ecb5c', '#5fa740', '#357a2a'), s: 0.95, layer: 'secondary', slim: true },
    'Bamboo':      { shape: 'bamboo', c: G('#c4de70', '#9bc24d', '#6f9a35'), s: 1.0, layer: 'secondary' },
    'Banana':      { shape: 'banana', c: G('#a0d85b', '#6fb845', '#3f8a30'), s: 0.9, layer: 'ground' },
    'Papaya':      { shape: 'banana', c: G('#9ad35d', '#6ab346', '#3d8630'), s: 0.85, layer: 'ground', papaya: true },
    'Sugarcane':   { shape: 'tuft', c: G('#c6e66b', '#93c644', '#65972f'), s: 1, tall: 2.1, layer: 'ground' },
    'Turmeric':    { shape: 'tuft', c: G('#8fd05c', '#5fae45', '#3e8734'), s: 1, tall: 1.2, layer: 'ground' },
    'Ginger':      { shape: 'tuft', c: G('#9bd664', '#72bb4a', '#488f37'), s: 1, tall: 1.1, layer: 'ground' },
    'Pineapple':   { shape: 'tuft', c: G('#b6cf78', '#8fb45a', '#5f8a3a'), s: 1, tall: 0.9, layer: 'ground', accent: '#e9b53a', wide: true },
    'Brinjal':     { shape: 'tuft', c: G('#8fce6e', '#5fae55', '#3a8140'), s: 1, tall: 1.0, layer: 'ground', accent: '#7b3fa0' },
    'Chilli':      { shape: 'tuft', c: G('#8fd06a', '#5fb050', '#3a8440'), s: 1, tall: 0.95, layer: 'ground', accent: '#d33a2c' },
    'Okra':        { shape: 'tuft', c: G('#9ad86e', '#68b850', '#3f8a3c'), s: 1, tall: 1.2, layer: 'ground', accent: '#f0e07a' },
    'Tomato':      { shape: 'tuft', c: G('#8fd070', '#5fb055', '#3a8442'), s: 1, tall: 1.0, layer: 'ground', accent: '#d9432f' },
    'Leafy Greens':{ shape: 'tuft', c: G('#b5ec86', '#86d05e', '#58a842'), s: 1, tall: 0.75, layer: 'ground' },
    'Marigold':    { shape: 'tuft', c: G('#8fd070', '#62b04e', '#3d8640'), s: 1, tall: 0.85, layer: 'ground', accent: '#f39c12' },
    'Watermelon':  { shape: 'tuft', c: G('#9ad871', '#62b64f', '#3d8d40'), s: 1, tall: 0.7, layer: 'ground', accent: '#3a8f3a', wide: true }
  };
  var CATEGORY_LAYER = { long_term: 'timber', annuity: 'secondary', six_month: 'ground', three_month: 'ground' };

  function visOf(name, category) {
    var v = VIS[name];
    if (v) return v;
    var layer = CATEGORY_LAYER[category] || 'secondary';
    return { shape: layer === 'ground' ? 'tuft' : 'tree', c: G('#86c45f', '#4b9c3d', '#2a6a2c'), s: 0.95, layer: layer, tall: 1 };
  }
  function layerOf(name, category) { return visOf(name, category).layer; }

  /* ---------- Intercrop visuals + photos ---------- */
  // wiki = Wikipedia article title used to fetch a real photograph
  var IC = {
    'Black pepper':         { wiki: 'Black pepper',      kind: 'climber', c: G('#7cc46a', '#3f8f3a', '#22602a'), accent: '#c0392b', role: 'Climber / support crop' },
    'Cocoa':                { wiki: 'Theobroma cacao',   kind: 'mid',     c: G('#7fc06a', '#4c9a45', '#2b6b2c'), accent: '#d98c2b', role: 'Shade-tolerant mid layer', s: 0.55 },
    'Coffee':               { wiki: 'Coffea',            kind: 'mid',     c: G('#6fb066', '#2f7a3b', '#1a4f2a'), accent: '#c0392b', role: 'Shade-tolerant mid layer', s: 0.5 },
    'Banana':               { wiki: 'Banana',            kind: 'banana',  c: G('#a0d85b', '#6fb845', '#3f8a30'), role: 'Mid layer', s: 0.55 },
    'Pineapple':            { wiki: 'Pineapple',         kind: 'tuft',    c: G('#b6cf78', '#8fb45a', '#5f8a3a'), accent: '#e9b53a', role: 'Ground layer', tall: 0.9, wide: true },
    'Ginger':               { wiki: 'Ginger',            kind: 'tuft',    c: G('#9bd664', '#72bb4a', '#488f37'), role: 'Ground layer', tall: 1.1 },
    'Turmeric':             { wiki: 'Turmeric',          kind: 'tuft',    c: G('#8fd05c', '#5fae45', '#3e8734'), role: 'Ground layer', tall: 1.2 },
    'Pigeon pea':           { wiki: 'Pigeon pea',        kind: 'host',    c: G('#a5d46a', '#7bbb4d', '#4f9337'), accent: '#f2d13b', role: 'Host / nitrogen-fixing legume' },
    'Pulses':               { wiki: 'Pulse (legume)',    kind: 'tuft',    c: G('#b8e07a', '#8cc95a', '#5f9f3f'), accent: '#e8e26a', role: 'Legume ground crop', tall: 0.9 },
    'Groundnut':            { wiki: 'Peanut',            kind: 'tuft',    c: G('#a5d670', '#7dbc52', '#55923a'), accent: '#f0d84a', role: 'Legume ground crop', tall: 0.8 },
    'Vegetables':           { wiki: 'Vegetable',         kind: 'tuft',    c: G('#95d879', '#66bd62', '#3f9147'), accent: '#e2743a', role: 'Short-duration ground crop', tall: 0.85 },
    'Short-duration crops': { wiki: 'Vegetable',         kind: 'tuft',    c: G('#a4dd7e', '#7ac45c', '#50994a'), role: 'Short-duration ground crop', tall: 0.85 }
  };
  var IC_LABEL = {
    'Pulses': 'Pulses / legumes',
    'Vegetables': 'Vegetables',
    'Short-duration crops': 'Short-duration crops',
    'Pigeon pea': 'Pigeon pea (red gram)'
  };

  var EARLY = 'Early years (open canopy)';
  var YOUNG = 'While the trees are young';
  /* strips = drawn between rows, cards = shown in the photo plan.
     Every entry follows the species' own guidance text in species-knowledge.js. */
  var INTERCROP_MAP = {
    'Coconut':     { climber: 'Black pepper', strips: ['Banana', 'Pineapple', 'Ginger'], cards: ['Black pepper', 'Banana', 'Pineapple', 'Ginger', 'Cocoa'], when: 'Multistorey system — depends on light and water', note: 'Black pepper can be trained on the palms as a support crop where local recommendations permit.' },
    'Arecanut':    { climber: 'Black pepper', strips: ['Banana', 'Pineapple', 'Ginger'], cards: ['Black pepper', 'Banana', 'Pineapple', 'Ginger', 'Cocoa'], when: 'Multistorey system — depends on light and water', note: 'Black pepper can be trained on the palms as a support crop where the local system permits.' },
    'Sandalwood':  { host: 'Pigeon pea', strips: ['Short-duration crops'], cards: ['Pigeon pea', 'Short-duration crops'], when: 'Host plant from planting; other crops only if they do not compete for water and light', note: 'Sandalwood is hemi-parasitic and needs a suitable host. Follow local forestry guidance for host choice and spacing.' },
    'Silver Oak':  { climber: 'Black pepper', strips: ['Coffee'], cards: ['Coffee', 'Black pepper'], when: 'Shade-compatible crops where local systems support them', note: 'Coffee and pepper are the shade-compatible crops named in the species guide.' },
    'Mango':       { strips: ['Pulses', 'Turmeric', 'Ginger'], cards: ['Pulses', 'Vegetables', 'Ginger', 'Turmeric'], when: 'Young orchard — while shade and water permit', note: '' },
    'Jackfruit':   { strips: ['Pulses', 'Turmeric', 'Ginger'], cards: ['Pulses', 'Ginger', 'Turmeric'], when: 'Young orchard', note: '' },
    'Cashew':      { strips: ['Groundnut', 'Pulses'], cards: ['Groundnut', 'Pulses'], when: 'Young orchard — where moisture permits', note: '' },
    'Guava':       { strips: ['Pulses', 'Vegetables'], cards: ['Pulses', 'Vegetables'], when: 'While the canopy is open', note: '' },
    'Amla':        { strips: ['Pulses', 'Vegetables'], cards: ['Pulses', 'Vegetables'], when: 'While the canopy is open', note: '' },
    'Teak':        { strips: ['Pulses', 'Vegetables'], cards: ['Pulses', 'Vegetables'], when: EARLY, note: 'Depends on spacing and light; as the canopy closes there is less room for crops.' },
    'Mahogany':    { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: EARLY, note: 'Only if light and moisture allow.' },
    'Neem':        { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: YOUNG, note: 'Only if light and moisture permit.' },
    'Eucalyptus':  { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: 'Early establishment period only', note: 'Needs adequate spacing between rows.' },
    'Rosewood':    { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: 'Early establishment', note: 'Follow local forestry guidance and keep adequate spacing.' },
    'Red Sanders': { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: EARLY, note: 'Only if light and moisture permit.' },
    'Agarwood':    { strips: ['Pulses'], cards: ['Pulses'], when: EARLY, note: 'Short-duration legumes or other low-growing crops, if moisture and shade permit.' },
    'Bamboo':      { strips: ['Short-duration crops'], cards: ['Short-duration crops'], when: 'Between widely spaced young clumps', note: 'Only where light permits.' },
    'Banana':      { strips: ['Pulses', 'Vegetables'], cards: ['Pulses', 'Vegetables'], when: 'Early in the crop cycle', note: '' },
    'Papaya':      { strips: ['Pulses', 'Vegetables'], cards: ['Pulses', 'Vegetables'], when: 'Early, when spacing permits', note: '' },
    'Moringa':     { strips: ['Vegetables', 'Pulses'], cards: ['Vegetables', 'Pulses'], when: 'Compatible short-duration crops', note: '' },
    'Sugarcane':   { strips: ['Pulses'], cards: ['Pulses'], when: 'As an early intercrop, where recommended', note: '' }
  };

  /* Species that are themselves documented intercrops under other selected trees */
  var ORCHARD = ['Mango', 'Guava', 'Jackfruit', 'Amla', 'Cashew', 'Coconut', 'Arecanut'];
  var DOCUMENTED = [
    { crop: 'Turmeric',     trees: ['Coconut', 'Arecanut', 'Mango', 'Jackfruit'], text: 'grows beneath young trees where shade and drainage are suitable' },
    { crop: 'Ginger',       trees: ['Coconut', 'Arecanut', 'Mango', 'Jackfruit'], text: 'can be grown with tree plantations in the early years where shade and drainage suit' },
    { crop: 'Pineapple',    trees: ['Coconut', 'Mango', 'Arecanut'],              text: 'can be grown beneath young trees where light allows' },
    { crop: 'Banana',       trees: ['Coconut', 'Arecanut'],                        text: 'fits multistorey palm systems depending on light and water' },
    { crop: 'Leafy Greens', trees: ORCHARD,                                        text: 'works as a short-duration intercrop between young orchard trees' },
    { crop: 'Marigold',     trees: ORCHARD,                                        text: 'can be used as a border or short-duration intercrop around young orchards' }
  ];

  function years(months) {
    if (!months) return '';
    if (months < 24) return months + ' months';
    var y = months / 12;
    return (Math.abs(y - Math.round(y)) < 0.05 ? Math.round(y) : y.toFixed(1)) + ' yrs';
  }

  /* Tall → short, so the picture reads like the reference (timber at the back). */
  function orderSpecies(names, info) {
    return names.slice().sort(function (a, b) {
      var ia = info(a) || {}, ib = info(b) || {};
      var la = LAYERS[layerOf(a, ia.category)].order, lb = LAYERS[layerOf(b, ib.category)].order;
      if (la !== lb) return la - lb;
      return (ib.months || 0) - (ia.months || 0);
    });
  }

  /* ---------- SVG shape builders ---------- */
  function drawTree(px, py, r, v, gid, sa, sb, opt) {
    opt = opt || {};
    var j = rng(sa, sb), rr = r * (0.9 + 0.2 * j), th = rr * 1.05, cy = py - th - rr * 0.45, s = '';
    s += '<ellipse cx="' + f(px + rr * 0.35) + '" cy="' + f(py + rr * 0.05) + '" rx="' + f(rr) + '" ry="' + f(rr * 0.42) + '" fill="rgba(25,45,20,.30)"/>';
    s += '<rect x="' + f(px - rr * 0.09) + '" y="' + f(py - th) + '" width="' + f(rr * 0.18) + '" height="' + f(th) + '" rx="' + f(rr * 0.05) + '" fill="#6a4a2c"/>';
    if (opt.climber) s += vine(px, py, th, rr, opt.climber);
    s += '<circle cx="' + f(px - rr * 0.5) + '" cy="' + f(cy + rr * 0.2) + '" r="' + f(rr * 0.68) + '" fill="url(#' + gid + ')"/>';
    s += '<circle cx="' + f(px + rr * 0.5) + '" cy="' + f(cy + rr * 0.22) + '" r="' + f(rr * 0.66) + '" fill="url(#' + gid + ')"/>';
    s += '<circle cx="' + f(px) + '" cy="' + f(cy) + '" r="' + f(rr * 0.85) + '" fill="url(#' + gid + ')"/>';
    if (v.fruit && rng(sb, sa) > 0.35) {
      s += '<circle cx="' + f(px - rr * 0.3) + '" cy="' + f(cy + rr * 0.15) + '" r="' + f(rr * 0.11) + '" fill="' + v.fruit + '"/>';
      s += '<circle cx="' + f(px + rr * 0.35) + '" cy="' + f(cy + rr * 0.35) + '" r="' + f(rr * 0.11) + '" fill="' + v.fruit + '"/>';
    }
    return s;
  }

  function vine(px, py, th, rr, ic) {
    var s = '';
    for (var i = 0; i < 4; i++) {
      var y = py - th * (0.18 + i * 0.2), x = px + (i % 2 ? rr * 0.1 : -rr * 0.1);
      s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rr * 0.2) + '" ry="' + f(rr * 0.11) + '" fill="' + ic.c[1] + '" transform="rotate(' + (i % 2 ? 25 : -25) + ' ' + f(x) + ' ' + f(y) + ')"/>';
    }
    s += '<circle cx="' + f(px + rr * 0.12) + '" cy="' + f(py - th * 0.5) + '" r="' + f(rr * 0.07) + '" fill="' + ic.accent + '"/>';
    return s;
  }

  function drawPalm(px, py, r, v, gid, sa, sb, opt) {
    opt = opt || {};
    var j = rng(sa, sb), h = r * (v.slim ? 2.3 : 1.9) * (0.94 + 0.12 * j), lean = (j - 0.5) * r * 0.3;
    var tx = px + lean, ty = py - h, s = '';
    s += '<ellipse cx="' + f(px + r * 0.3) + '" cy="' + f(py + r * 0.05) + '" rx="' + f(r * 0.85) + '" ry="' + f(r * 0.34) + '" fill="rgba(25,45,20,.28)"/>';
    s += '<path d="M' + f(px) + ' ' + f(py) + ' Q' + f(px + lean * 0.2 + r * 0.15) + ' ' + f(py - h * 0.5) + ' ' + f(tx) + ' ' + f(ty) + '" stroke="#7a5a38" stroke-width="' + f(r * (v.slim ? 0.14 : 0.2)) + '" fill="none" stroke-linecap="round"/>';
    if (opt.climber) s += vine(px + lean * 0.3, py, h * 0.85, r * 0.9, opt.climber);
    var fr = v.slim ? 7 : 8;
    for (var k = 0; k < fr; k++) {
      var ang = -172 + k * (164 / (fr - 1)), rad = ang * Math.PI / 180;
      var cx = tx + Math.cos(rad) * r * 0.62, cy = ty + Math.sin(rad) * r * 0.3 + r * 0.08;
      s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * 0.72) + '" ry="' + f(r * 0.13) + '" fill="' + (k % 2 ? v.c[1] : v.c[2]) + '" transform="rotate(' + f(ang * 0.55) + ' ' + f(cx) + ' ' + f(cy) + ')"/>';
    }
    s += '<circle cx="' + f(tx - r * 0.12) + '" cy="' + f(ty + r * 0.2) + '" r="' + f(r * 0.13) + '" fill="#9aa646"/><circle cx="' + f(tx + r * 0.14) + '" cy="' + f(ty + r * 0.22) + '" r="' + f(r * 0.13) + '" fill="#8b983c"/>';
    return s;
  }

  function drawBamboo(px, py, r, v, sa, sb) {
    var s = '<ellipse cx="' + f(px + r * 0.3) + '" cy="' + f(py + r * 0.05) + '" rx="' + f(r * 0.9) + '" ry="' + f(r * 0.36) + '" fill="rgba(25,45,20,.26)"/>';
    var offs = [-0.55, -0.25, 0, 0.28, 0.55];
    for (var i = 0; i < offs.length; i++) {
      var h = r * (2.3 + 0.9 * rng(sa + i, sb)), lean = (rng(sb, sa + i) - 0.5) * r * 0.35, x = px + offs[i] * r;
      s += '<line x1="' + f(x) + '" y1="' + f(py) + '" x2="' + f(x + lean) + '" y2="' + f(py - h) + '" stroke="' + v.c[2] + '" stroke-width="' + f(r * 0.12) + '" stroke-linecap="round"/>';
      s += '<ellipse cx="' + f(x + lean - r * 0.18) + '" cy="' + f(py - h + r * 0.1) + '" rx="' + f(r * 0.34) + '" ry="' + f(r * 0.1) + '" fill="' + v.c[1] + '" transform="rotate(-28 ' + f(x + lean - r * 0.18) + ' ' + f(py - h + r * 0.1) + ')"/>';
      s += '<ellipse cx="' + f(x + lean + r * 0.18) + '" cy="' + f(py - h + r * 0.2) + '" rx="' + f(r * 0.34) + '" ry="' + f(r * 0.1) + '" fill="' + v.c[0] + '" transform="rotate(28 ' + f(x + lean + r * 0.18) + ' ' + f(py - h + r * 0.2) + ')"/>';
    }
    return s;
  }

  function drawBanana(px, py, r, v, sa, sb) {
    var h = r * (v.papaya ? 1.9 : 1.1), s = '<ellipse cx="' + f(px + r * 0.3) + '" cy="' + f(py + r * 0.05) + '" rx="' + f(r * 0.8) + '" ry="' + f(r * 0.32) + '" fill="rgba(25,45,20,.26)"/>';
    s += '<rect x="' + f(px - r * 0.1) + '" y="' + f(py - h) + '" width="' + f(r * 0.2) + '" height="' + f(h) + '" rx="' + f(r * 0.06) + '" fill="' + (v.papaya ? '#8a9a5a' : '#7fa860') + '"/>';
    var angs = v.papaya ? [-78, -40, -5, 32, 68] : [-62, -32, 0, 32, 62];
    for (var i = 0; i < angs.length; i++) {
      var a = angs[i], rad = a * Math.PI / 180;
      var cx = px + Math.sin(rad) * r * 0.62, cy = py - h - Math.cos(rad) * r * (v.papaya ? 0.15 : 0.55);
      s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * 0.3) + '" ry="' + f(r * (v.papaya ? 0.62 : 0.82)) + '" fill="' + (i % 2 ? v.c[1] : v.c[0]) + '" stroke="' + v.c[2] + '" stroke-width="0.6" transform="rotate(' + a + ' ' + f(cx) + ' ' + f(cy) + ')"/>';
    }
    return s;
  }

  function drawTuft(px, py, w, h, v, sa, sb) {
    var d = '', l = '', n = v.wide ? 6 : 5;
    for (var i = 0; i < n; i++) {
      var t = i - (n - 1) / 2, bx = px + t * w * 0.26;
      var tipx = bx + t * w * 0.2 + (rng(sa + i, sb) - 0.5) * w * 0.15, tipy = py - h * (0.65 + 0.35 * rng(sb, sa + i)), bw = w * 0.1;
      var seg = 'M' + f(bx - bw) + ' ' + f(py) + 'L' + f(tipx) + ' ' + f(tipy) + 'L' + f(bx + bw) + ' ' + f(py) + 'Z';
      if (i % 2) l += seg; else d += seg;
    }
    var s = '<path d="' + d + '" fill="' + v.c[2] + '"/><path d="' + l + '" fill="' + v.c[1] + '"/>';
    if (v.accent && rng(sa, sb + 3) > 0.45) s += '<circle cx="' + f(px + (rng(sb, sa) - 0.5) * w * 0.4) + '" cy="' + f(py - h * 0.85) + '" r="' + f(Math.max(1.6, w * 0.13)) + '" fill="' + v.accent + '"/>';
    return s;
  }

  function drawHost(px, py, r, ic, sa, sb) {
    var s = '<circle cx="' + f(px) + '" cy="' + f(py - r * 0.35) + '" r="' + f(r * 0.42) + '" fill="' + ic.c[1] + '"/>';
    s += '<circle cx="' + f(px - r * 0.28) + '" cy="' + f(py - r * 0.2) + '" r="' + f(r * 0.3) + '" fill="' + ic.c[0] + '"/>';
    s += '<circle cx="' + f(px + r * 0.3) + '" cy="' + f(py - r * 0.2) + '" r="' + f(r * 0.3) + '" fill="' + ic.c[2] + '"/>';
    s += '<circle cx="' + f(px - r * 0.12) + '" cy="' + f(py - r * 0.5) + '" r="' + f(r * 0.1) + '" fill="' + ic.accent + '"/><circle cx="' + f(px + r * 0.2) + '" cy="' + f(py - r * 0.42) + '" r="' + f(r * 0.1) + '" fill="' + ic.accent + '"/>';
    return s;
  }

  /* draw any species (or intercrop) at a point */
  function drawPlant(kind, px, py, r, v, gid, sa, sb, opt) {
    switch (kind) {
      case 'palm':   return drawPalm(px, py, r, v, gid, sa, sb, opt);
      case 'bamboo': return drawBamboo(px, py, r, v, sa, sb);
      case 'banana': return drawBanana(px, py, r, v, sa, sb);
      case 'tuft':   return drawTuft(px, py, r * (v.wide ? 1.3 : 1.1), r * 1.1 * (v.tall || 1), v, sa, sb);
      default:       return drawTree(px, py, r, v, gid, sa, sb, opt);
    }
  }

  /* ---------- Row-band helpers ---------- */
  function displayRows(bands, maxRows) {
    var total = bands.reduce(function (a, b) { return a + b.rows; }, 0);
    if (total <= maxRows) return bands.map(function (b) { return b.rows; });
    var d = bands.map(function (b) { return Math.max(1, Math.round(b.rows * maxRows / total)); });
    var guard = 60;
    while (d.reduce(function (a, b) { return a + b; }, 0) > maxRows && guard--) {
      var mi = d.indexOf(Math.max.apply(null, d)); if (d[mi] <= 1) break; d[mi]--;
    }
    return d;
  }

  function wrap(text, n) {
    var words = String(text).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }

  /* ============================================================
     MAIN RENDER  — opts: {rows, perRow, bands, species:[names], info(name)->{category,months},
                            tree_spacing, row_spacing, boundary_gap}
     ============================================================ */
  function render(container, opts) {
    if (!container) return;
    var info = opts.info || function () { return {}; };
    var bands = (opts.bands || []).filter(function (b) { return b.rows > 0; });
    if (!opts.rows || !opts.perRow || !bands.length) {
      container.innerHTML = '<div class="lf-empty">No planting rows fit inside this plot with the chosen spacing and boundary gap. Reduce the spacing or gap, or increase the land size, then calculate again.</div>';
      return;
    }
    var prefix = 'lf' + (++uid);
    var MAXC = 14, MAXR = Math.max(12, bands.length * 2);
    var cols = Math.min(opts.perRow, MAXC);
    var drows = displayRows(bands, MAXR);
    var compressed = cols < opts.perRow || drows.reduce(function (a, b) { return a + b; }, 0) < opts.rows;

    // ----- describe every band -----
    var desc = bands.map(function (b, i) {
      var cat = (info(b.species) || {}).category;
      var v = visOf(b.species, cat), m = INTERCROP_MAP[b.species] || {};
      var isGround = v.layer === 'ground';
      var strips = (!isGround && m.strips) ? m.strips.slice(0, 3) : [];
      return { i: i, b: b, v: v, m: m, layer: v.layer, strips: strips, isGround: isGround, months: (info(b.species) || {}).months, rowsShown: drows[i], gid: prefix + '-s' + i };
    });

    // ----- grid geometry (isometric units) -----
    var M = 1.9, GAP = 0.6;
    var pitchOf = function (d) { return d.strips.length ? 1.9 : (d.isGround ? 0.95 : 1.45); };
    var yCursor = M, blocks = [];
    desc.forEach(function (d, k) {
      var pitch = pitchOf(d), h = d.rowsShown * pitch;
      blocks.push({ d: d, pitch: pitch, y0: yCursor, y1: yCursor + h });
      yCursor += h + (k < desc.length - 1 ? GAP : 0);
    });
    var X = cols + 2 * M;
    var Y = yCursor + M;

    var W = 1000, dxRaw = 880 / (X + Y), dx = clamp(dxRaw, 14, 58), dy = dx / 2;
    var baseR = dx * 0.62, beltR = dx * 0.78;
    var topPad = beltR * 3.6 + 26, slab = 12;
    var ox = W / 2 - (X - Y) * dx / 2, oy = topPad;
    var H = Math.ceil(oy + (X + Y) * dy + slab + 46);
    var P = function (x, y) { return [ox + (x - y) * dx, oy + (x + y) * dy]; };

    // ----- boundary belt species -----
    var beltDesc = null;
    desc.forEach(function (d) {
      if (d.v.shape === 'tree' || d.v.shape === 'palm' || d.v.shape === 'bamboo') {
        if (!beltDesc || (d.months || 0) > (beltDesc.months || 0)) beltDesc = d;
      }
    });
    var wantsBelt = !!beltDesc;

    // ----- defs -----
    var defs = '';
    desc.forEach(function (d) {
      defs += '<radialGradient id="' + d.gid + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + d.v.c[0] + '"/><stop offset=".55" stop-color="' + d.v.c[1] + '"/><stop offset="1" stop-color="' + d.v.c[2] + '"/></radialGradient>';
      if (d.m.strips) d.strips.forEach(function (n) {
        var ic = IC[n]; if (!ic || (!ic.c)) return;
        var id = prefix + '-ic-' + n.replace(/\W/g, '');
        if (defs.indexOf('id="' + id + '"') === -1) defs += '<radialGradient id="' + id + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + ic.c[0] + '"/><stop offset=".55" stop-color="' + ic.c[1] + '"/><stop offset="1" stop-color="' + ic.c[2] + '"/></radialGradient>';
      });
      if (d.m.climber && IC[d.m.climber]) { /* vine colours are inline */ }
    });
    if (wantsBelt) defs += '<radialGradient id="' + prefix + '-belt" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + beltDesc.v.c[0] + '"/><stop offset=".5" stop-color="' + beltDesc.v.c[1] + '"/><stop offset="1" stop-color="#153f22"/></radialGradient>';
    defs += '<linearGradient id="' + prefix + '-dirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98b5c"/><stop offset="1" stop-color="#9c6f45"/></linearGradient>';
    defs += '<linearGradient id="' + prefix + '-sideL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6240"/><stop offset="1" stop-color="#5f4229"/></linearGradient>';
    defs += '<linearGradient id="' + prefix + '-sideR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#75502f"/><stop offset="1" stop-color="#4c341f"/></linearGradient>';
    defs += '<linearGradient id="' + prefix + '-water" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f9fdb"/><stop offset="1" stop-color="#6cc3ee"/></linearGradient>';
    defs += '<filter id="' + prefix + '-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>';

    // ----- ground -----
    var poly = function (pts, fill, extra) { return '<polygon points="' + pts.map(function (p) { return f(p[0]) + ',' + f(p[1]) }).join(' ') + '" fill="' + fill + '" ' + (extra || '') + '/>'; };
    var g = '';
    var a = P(0, 0), b = P(X, 0), c = P(X, Y), d0 = P(0, Y);
    g += '<polygon points="' + [a, b, c, d0].map(function (p) { return f(p[0] + 6) + ',' + f(p[1] + slab + 10); }).join(' ') + '" fill="rgba(20,50,25,.22)" filter="url(#' + prefix + '-blur)"/>';
    g += poly([d0, c, [c[0], c[1] + slab], [d0[0], d0[1] + slab]], 'url(#' + prefix + '-sideL)');
    g += poly([c, b, [b[0], b[1] + slab], [c[0], c[1] + slab]], 'url(#' + prefix + '-sideR)');
    g += poly([a, b, c, d0], 'url(#' + prefix + '-dirt)', 'stroke="#7d5a38" stroke-width="1"');

    // blocks (grass)
    blocks.forEach(function (bk) {
      var col = LAYERS[bk.d.layer].grass;
      var p0 = P(M - 0.35, bk.y0 - 0.2), p1 = P(X - M + 0.35, bk.y0 - 0.2), p2 = P(X - M + 0.35, bk.y1 + 0.05), p3 = P(M - 0.35, bk.y1 + 0.05);
      g += poly([p0, p1, p2, p3], col[0], 'stroke="' + col[1] + '" stroke-width="1.2"');
    });

    // irrigation channel (front-left edge)
    var cy0 = Y - 0.95, cw = 0.17, ch = [P(0.9, cy0 - cw), P(X - 0.9, cy0 - cw), P(X - 0.9, cy0 + cw), P(0.9, cy0 + cw)];
    g += poly([[ch[0][0], ch[0][1] + 2], [ch[1][0], ch[1][1] + 2], [ch[2][0], ch[2][1] + 2], [ch[3][0], ch[3][1] + 2]], '#4d6f3a');
    g += poly(ch, 'url(#' + prefix + '-water)');
    var mid0 = P(1.1, cy0), mid1 = P(X - 1.1, cy0);
    g += '<line x1="' + f(mid0[0]) + '" y1="' + f(mid0[1]) + '" x2="' + f(mid1[0]) + '" y2="' + f(mid1[1]) + '" stroke="#d6f0fb" stroke-width="1.4" stroke-dasharray="10 9" opacity=".8"/>';
    for (var st = 1; st <= 3; st++) {
      var sx = 0.9 + (X - 1.8) * st / 4, s0 = P(sx, cy0 - cw - 0.02), s1 = P(sx, cy0 + cw + 0.02);
      g += '<line x1="' + f(s0[0]) + '" y1="' + f(s0[1]) + '" x2="' + f(s1[0]) + '" y2="' + f(s1[1]) + '" stroke="#ffffff" stroke-width="2.4" opacity=".85"/>';
    }

    // drip lines along each planted row
    var items = [];
    blocks.forEach(function (bk) {
      var d = bk.d;
      for (var r = 0; r < d.rowsShown; r++) {
        var ry = bk.y0 + r * bk.pitch + bk.pitch * (d.strips.length ? 0.3 : 0.5);
        var l0 = P(M, ry + 0.16), l1 = P(X - M, ry + 0.16);
        g += '<line x1="' + f(l0[0]) + '" y1="' + f(l0[1]) + '" x2="' + f(l1[0]) + '" y2="' + f(l1[1]) + '" stroke="#5ab4e8" stroke-width="1.1" stroke-dasharray="3 3" opacity=".75"/>';
      }
    });

    // ----- plants (depth sorted) -----
    var mainPositions = {}; // for callout targets
    blocks.forEach(function (bk) {
      var d = bk.d, v = d.v, cat = (info(d.b.species) || {}).category;
      var climberIC = d.m.climber ? IC[d.m.climber] : null;
      for (var r = 0; r < d.rowsShown; r++) {
        var ry = bk.y0 + r * bk.pitch + bk.pitch * (d.strips.length ? 0.3 : 0.5);
        var perRowDraw = d.isGround ? cols * 2 : cols;
        for (var cI = 0; cI < perRowDraw; cI++) {
          var gx = d.isGround ? M + (cI + 0.5) / 2 : M + cI + 0.5;
          var pp = P(gx, ry);
          var rad = d.isGround ? baseR * 0.62 * v.s : baseR * v.s;
          var svg = drawPlant(v.shape, pp[0], pp[1], rad, v, d.gid, d.i * 97 + r, cI, { climber: climberIC });
          items.push({ z: gx + ry, s: svg });
          if (d.m.host && IC[d.m.host]) {
            var hp = P(gx + 0.36, ry + 0.2);
            items.push({ z: gx + ry + 0.5, s: drawHost(hp[0], hp[1], baseR * 0.55, IC[d.m.host], r, cI) });
          }
          if (r === 0 && cI === Math.floor(perRowDraw / 2)) mainPositions[d.i] = [pp[0], pp[1] - rad * 2.2];
        }
        // intercrop strip after this row
        if (d.strips.length) {
          var sy = bk.y0 + r * bk.pitch + bk.pitch * 0.76, stripIC = d.strips[r % d.strips.length], ic = IC[stripIC] || IC['Short-duration crops'];
          var per = cols * 2;
          for (var sI = 0; sI < per; sI++) {
            var sxg = M + (sI + 0.5) / 2, sp = P(sxg, sy);
            var kind = ic.kind === 'host' ? 'tuft' : ic.kind;
            var rr = baseR * (ic.s || 0.55) * 0.9;
            var gidIc = prefix + '-ic-' + stripIC.replace(/\W/g, '');
            var sv = (ic.kind === 'mid') ? drawTree(sp[0], sp[1], rr, ic, gidIc, r + 40, sI) : drawPlant(kind, sp[0], sp[1], baseR * 0.6, ic, gidIc, r + 40, sI, {});
            items.push({ z: sxg + sy, s: sv });
            if (r === 0 && sI === Math.floor(per / 2) && !mainPositions['ic' + d.i]) mainPositions['ic' + d.i] = [sp[0], sp[1] - baseR * 0.6];
          }
        }
      }
    });

    // boundary belt (back-left, back-right, front-right sides; front-left stays open)
    var beltTarget = null;
    if (wantsBelt) {
      var bv = beltDesc.v, bo = 0.62, step = 1.5, belt = [];
      for (var by = bo; by <= Y - bo + 0.01; by += step) belt.push([bo, by]);            // back-left edge (x small)
      for (var bx = bo + step; bx <= X - bo + 0.01; bx += step) belt.push([bx, bo]);     // back-right edge (y small)
      for (var by2 = bo + step; by2 <= Y - bo + 0.01; by2 += step) belt.push([X - bo, by2]); // front-right edge
      belt.forEach(function (q, idx) {
        var qp = P(q[0], q[1]);
        items.push({ z: q[0] + q[1] + 0.2, s: drawPlant(bv.shape === 'tuft' ? 'tree' : bv.shape, qp[0], qp[1], beltR * bv.s, bv, prefix + '-belt', idx + 500, idx, {}) });
        if (!beltTarget && q[0] === bo && q[1] > Y * 0.3) beltTarget = [qp[0], qp[1] - beltR * 2.2];
      });
      if (!beltTarget && belt.length) { var q0 = P(belt[0][0], belt[0][1]); beltTarget = [q0[0], q0[1] - beltR * 2.2]; }
    } else {
      // crops-only mix: low hedge strip instead of trees
      for (var hx = 0.7; hx <= X - 0.7; hx += 0.55) { var hp1 = P(hx, 0.55); items.push({ z: hx + 0.55, s: drawTuft(hp1[0], hp1[1], baseR * 0.7, baseR * 0.7, { c: G('#9ad86e', '#6ab84f', '#3f8a3c') }, hx * 10, 1) }); }
    }

    items.sort(function (p, q) { return p.z - q.z; });
    var plantSvg = items.map(function (i) { return i.s; }).join('');

    // ----- band number badges (on top) -----
    var badges = '';
    blocks.forEach(function (bk) {
      var bp = P(M - 0.9, (bk.y0 + bk.y1) / 2);
      badges += '<g><circle cx="' + f(bp[0]) + '" cy="' + f(bp[1]) + '" r="10.5" fill="#12392a" stroke="#fff" stroke-width="2"/><text x="' + f(bp[0]) + '" y="' + f(bp[1] + 4.2) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">' + (bk.d.i + 1) + '</text></g>';
    });

    // ----- call-outs -----
    var boxW = 262, callSvg = '';
    var stackY = { LT: 12, RT: 12, LB: H - 8, RB: H - 8 };   // running y for top-left/right and bottom-left/right stacks
    // side: 'L' | 'R'; edge: 'T' (stack down from the top) | 'B' (stack up from the bottom)
    var callout = function (side, edge, title, lines, target, tint) {
      var bx = side === 'L' ? 12 : W - boxW - 12;
      var ls = [];
      lines.forEach(function (ln) { wrap(ln, 40).forEach(function (w2) { ls.push(w2); }); });
      var h = 26 + ls.length * 14, key = side + edge, by;
      if (edge === 'T') { by = stackY[key]; stackY[key] = by + h + 10; }
      else { by = stackY[key] - h; stackY[key] = by - 10; }
      var out = '<g><rect x="' + bx + '" y="' + f(by) + '" width="' + boxW + '" height="' + h + '" rx="10" fill="' + tint + '" stroke="#b9d6bd" stroke-width="1.2"/>';
      out += '<text x="' + (bx + 12) + '" y="' + f(by + 19) + '" font-size="13" font-weight="700" fill="#173f2b">' + esc(title) + '</text>';
      ls.forEach(function (ln, i) { out += '<text x="' + (bx + 12) + '" y="' + f(by + 35 + i * 14) + '" font-size="11.5" fill="#3d5f4b">' + esc(ln) + '</text>'; });
      out += '</g>';
      if (target) {
        var ax = side === 'L' ? bx + boxW : bx, ay = by + h / 2;
        out = '<line x1="' + f(ax) + '" y1="' + f(ay) + '" x2="' + f(target[0]) + '" y2="' + f(target[1]) + '" stroke="#1d4d34" stroke-width="1.3"/><circle cx="' + f(target[0]) + '" cy="' + f(target[1]) + '" r="3.6" fill="#1d4d34" stroke="#fff" stroke-width="1.2"/>' + out;
      }
      return out;
    };

    var stripNames = [];
    desc.forEach(function (d) { d.strips.forEach(function (n) { if (stripNames.indexOf(n) === -1) stripNames.push(n); }); if (d.m.climber && stripNames.indexOf(d.m.climber) === -1) stripNames.push(d.m.climber); });
    var hostDesc = desc.filter(function (d) { return d.m.host; })[0];
    var firstStrip = null; desc.forEach(function (d) { if (!firstStrip && mainPositions['ic' + d.i]) firstStrip = mainPositions['ic' + d.i]; });

    if (wantsBelt) {
      callSvg += callout('L', 'T', 'Boundary belt: ' + beltDesc.b.species, ['Windbreak & boundary marker, planted in the boundary gap. Not counted in the tree total.'], beltTarget, 'rgba(255,255,255,.93)');
    } else {
      callSvg += callout('L', 'T', 'Boundary strip', ['A low hedge marks the boundary gap. Not counted in the crop total.'], null, 'rgba(255,255,255,.93)');
    }
    if (hostDesc && mainPositions[hostDesc.i]) {
      callSvg += callout('L', 'T', 'Host plant: ' + (IC_LABEL[hostDesc.m.host] || hostDesc.m.host), [hostDesc.b.species + ' is hemi-parasitic, so a host plant grows beside every tree.'], [mainPositions[hostDesc.i][0] + dx * 0.34, mainPositions[hostDesc.i][1] + baseR * 1.7], 'rgba(255,251,230,.95)');
    }
    if (stripNames.length && firstStrip) {
      callSvg += callout('R', 'T', 'Intercrop strips', ['Grown between the tree rows: ' + stripNames.slice(0, 4).map(function (n) { return IC_LABEL[n] || n; }).join(', ') + '.'], firstStrip, 'rgba(240,252,234,.95)');
    } else {
      callSvg += callout('R', 'T', 'Planted rows', ['Row spacing ' + (opts.row_spacing || '—') + ' ft · tree spacing ' + (opts.tree_spacing || '—') + ' ft.'], null, 'rgba(255,255,255,.93)');
    }
    // bottom callouts
    var chanT = P(X * 0.3, cy0), pathT = P(X - 1.25, Y * 0.58);
    var irr = callout('L', 'B', 'Irrigation channel', ['Drip irrigation: dashed blue lines run along every planted row.'], chanT, 'rgba(232,246,255,.96)');
    var acc = callout('R', 'B', 'Access path', ['Service lane around the plot for maintenance.'], pathT, 'rgba(250,240,225,.96)');
    callSvg += irr + acc;

    // ----- assemble SVG -----
    var svg = '<svg class="lf-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Isometric layout of your mixed, intercropped plantation" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">' +
      '<defs>' + defs + '</defs><rect width="' + W + '" height="' + H + '" fill="#f4faf0"/>' + g + plantSvg + badges + callSvg + '</svg>';

    // ----- legend + bands (HTML) -----
    var byLayer = { timber: [], core: [], secondary: [], ground: [] };
    desc.forEach(function (d) { byLayer[d.layer].push(d); });
    var minMonths = Math.min.apply(null, desc.map(function (d) { return d.months || 999; }));
    var layerHtml = LAYER_KEYS.map(function (k) {
      var L = LAYERS[k], list = byLayer[k];
      var body = list.length ? list.map(function (d) { return '<span class="lf-sp"><b>' + esc(d.b.species) + '</b>' + (d.months ? ' <em>' + years(d.months) + '</em>' : '') + '</span>'; }).join('') : '<span class="lf-none">Not in this mix — ' + LAYER_EXAMPLES[k] + '</span>';
      return '<div class="lf-layer' + (list.length ? '' : ' is-off') + '"><div class="lf-layer-ico">' + L.icon + '</div><div><h5>' + L.label + '</h5><p class="lf-layer-sub">' + L.sub + '</p><div class="lf-layer-sp">' + body + '</div></div></div>';
    }).join('');

    var bandHtml = desc.map(function (d) {
      var ic = d.strips.slice();
      if (d.m.host) ic.unshift(d.m.host);
      if (d.m.climber && ic.indexOf(d.m.climber) === -1) ic.push(d.m.climber);
      return '<div class="lf-band"><span class="lf-num">' + (d.i + 1) + '</span><span class="lf-swatch" style="background:' + d.v.c[1] + '"></span>' +
        '<div class="lf-band-txt"><strong>' + esc(d.b.species) + '</strong> <span class="lf-tag lf-tag-' + d.layer + '">' + LAYERS[d.layer].label + '</span><br>' +
        '<span>' + d.b.rows + ' row' + (d.b.rows === 1 ? '' : 's') + ' · ' + d.b.trees + ' plants</span>' +
        (ic.length ? '<span class="lf-ic"> · Intercrop: ' + ic.map(function (n) { return esc(IC_LABEL[n] || n); }).join(', ') + '</span>' : '') + '</div></div>';
    }).join('');

    var hasLegume = desc.some(function (d) { return d.m.host === 'Pigeon pea' || d.strips.indexOf('Pulses') > -1 || d.strips.indexOf('Groundnut') > -1; });
    var nLayers = LAYER_KEYS.filter(function (k) { return byLayer[k].length; }).length;
    var benefits = [];
    benefits.push('Layered income: ' + desc.length + ' species across ' + nLayers + ' layer' + (nLayers === 1 ? '' : 's') + (isFinite(minMonths) && minMonths < 999 ? ' — earliest crop ready in about ' + years(minMonths) : ''));
    if (stripNames.length) benefits.push('Intercrops use the space between rows for extra income');
    if (hasLegume) benefits.push('Legume hosts / intercrops help soil fertility');
    if (wantsBelt) benefits.push('Boundary belt gives wind protection and marks the plot');
    benefits.push('Drip lines along the rows save water');

    var html = '<div class="lf-figure">' + svg + '</div>' +
      '<p class="lf-scale">Schematic, not to scale · ' + (compressed ? 'preview shows ' + cols + ' of ' + opts.perRow + ' plants per row and ' + drows.reduce(function (a, b) { return a + b; }, 0) + ' of ' + opts.rows + ' rows; the calculation above uses the full plot' : 'every calculated row and plant is shown') + ' · Plot ' + (opts.length || '—') + ' × ' + (opts.width || '—') + ' m</p>' +
      '<div class="lf-bands"><h4><i class="fas fa-layer-group"></i> Mixed plantation — ' + desc.length + ' row-band' + (desc.length === 1 ? '' : 's') + '</h4>' + bandHtml + '</div>' +
      '<div class="lf-legend"><div class="lf-legend-main"><h4>Legend &amp; profit layers</h4><div class="lf-layers">' + layerHtml + '</div></div>' +
      '<div class="lf-benefits"><h4>Key benefits</h4><ul>' + benefits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></div>';

    container.innerHTML = html;
  }

  /* ============================================================
     INTERCROPPING PLAN with photos (cards)
     ============================================================ */
  function renderPlan(container, names, info) {
    if (!container) return;
    info = info || function () { return {}; };
    if (!names || !names.length) {
      container.innerHTML = '<div class="lf-empty">Select one or more species in the calculator above to see suitable intercrops with photos.</div>';
      return;
    }
    var html = '<div class="ic-plan">';
    names.forEach(function (n) {
      var i = info(n) || {}, v = visOf(n, i.category), m = INTERCROP_MAP[n];
      html += '<div class="ic-row"><div class="ic-main"><img data-tree-name="' + esc(n) + '" alt="' + esc(n) + '" loading="lazy"><div><strong>' + esc(n) + '</strong><span class="ic-layer ic-layer-' + v.layer + '">' + LAYERS[v.layer].label + (i.months ? ' · ' + years(i.months) : '') + '</span></div></div>';
      if (m) {
        html += '<div class="ic-crops">' + m.cards.map(function (cn) {
          var ic = IC[cn] || {};
          return '<div class="ic-crop"><img data-tree-name="' + esc(ic.wiki || cn) + '" alt="' + esc(cn) + '" loading="lazy"><b>' + esc(IC_LABEL[cn] || cn) + '</b><small>' + esc(ic.role || '') + '</small></div>';
        }).join('') + '</div>';
        html += '<p class="ic-note"><i class="fas fa-clock"></i> <strong>When:</strong> ' + esc(m.when) + (m.note ? ' — ' + esc(m.note) : '') + '</p>';
      } else if (v.layer === 'ground') {
        html += '<p class="ic-note ic-note-solo"><i class="fas fa-seedling"></i> A short-duration crop. It is grown as its own row-band here, and can also be used as an intercrop under compatible young trees (see the pairs below).</p>';
      } else {
        html += '<p class="ic-note">No specific intercrop is listed for this species in the guide; check the Species page.</p>';
      }
      html += '</div>';
    });
    html += '</div>';

    var pairs = [];
    DOCUMENTED.forEach(function (doc) {
      if (names.indexOf(doc.crop) === -1) return;
      var t = doc.trees.filter(function (x) { return names.indexOf(x) > -1; });
      if (t.length) pairs.push('<li><strong>' + esc(doc.crop) + '</strong> with <strong>' + t.map(esc).join(', ') + '</strong> — ' + esc(doc.text) + '.</li>');
    });
    if (pairs.length) html += '<div class="ic-pairs"><h4><i class="fas fa-handshake"></i> Compatible pairs in your mix</h4><ul>' + pairs.join('') + '</ul></div>';
    else if (names.length > 1) html += '<div class="ic-pairs ic-pairs-none"><i class="fas fa-info-circle"></i> The species you picked do not form a documented tree + intercrop pair. Each still gets its own row-band, and the intercrops above can be planted between its rows.</div>';

    container.innerHTML = html;
    if (typeof hydrateSpeciesImages === 'function') hydrateSpeciesImages(container);
  }

  window.AranyaLayout = { render: render, renderPlan: renderPlan, orderSpecies: orderSpecies, layerOf: layerOf, LAYERS: LAYERS, INTERCROP_MAP: INTERCROP_MAP, VIS: VIS };
})();
