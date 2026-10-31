/* AranyaAI — recommended spacing (in FEET), plot-size species limit and unit helpers.
   Everything the farmer sees is in feet / inches / sq ft, the way it is measured locally.
   tree = tree-to-tree distance inside a row (ft), row = row-to-row distance (ft).
   Values are taken from the species guides (originally metres/cm) and rounded to practical field numbers. */
(function () {
  'use strict';
  var G = {
    'Agarwood':     { tree: 10,  row: 10,  text: 'About 10 x 10 ft to 13 x 13 ft, adjusted for plantation objective' },
    'Amla':         { tree: 20,  row: 20,  text: 'About 20 x 20 ft to 26 x 26 ft' },
    'Arecanut':     { tree: 9,   row: 9,   text: 'About 9 x 9 ft to 10 x 10 ft' },
    'Bamboo':       { tree: 15,  row: 15,  text: 'About 13 x 13 ft to 20 x 20 ft depending on type' },
    'Banana':       { tree: 6,   row: 6,   text: 'About 6 x 6 ft to 6.5 x 6.5 ft' },
    'Brinjal':      { tree: 2,   row: 2.5, text: 'About 2 x 1.5 ft to 2.5 x 2 ft' },
    'Cashew':       { tree: 25,  row: 25,  text: 'About 23 x 23 ft to 33 x 33 ft' },
    'Chilli':       { tree: 1.5, row: 2,   text: 'About 1.5 x 1.5 ft to 2 x 1.5 ft' },
    'Coconut':      { tree: 25,  row: 25,  text: 'About 25 x 25 ft to 26 x 26 ft' },
    'Eucalyptus':   { tree: 8,   row: 8,   text: 'About 6.5 x 6.5 ft to 10 x 10 ft depending on purpose' },
    'Ginger':       { tree: 1,   row: 1,   text: 'About 12 x 8 inches to 12 x 12 inches' },
    'Guava':        { tree: 20,  row: 20,  text: 'About 20 x 20 ft to 26 x 26 ft in conventional orchards' },
    'Jackfruit':    { tree: 30,  row: 30,  text: 'About 26 x 26 ft to 33 x 33 ft' },
    'Leafy Greens': { tree: 0.5, row: 1,   text: 'About 6 to 12 inches between rows and 2 to 6 inches within rows, depending on crop' },
    'Mahogany':     { tree: 15,  row: 15,  text: 'About 13 x 13 ft to 16 x 16 ft, adjusted for long-term timber objectives' },
    'Mango':        { tree: 30,  row: 30,  text: 'About 26 x 26 ft to 33 x 33 ft in conventional orchards' },
    'Marigold':     { tree: 1.5, row: 2,   text: 'About 1.5 x 1 ft to 2 x 1.5 ft' },
    'Moringa':      { tree: 10,  row: 10,  text: 'About 8 x 8 ft to 13 x 13 ft for tree production' },
    'Neem':         { tree: 20,  row: 20,  text: 'About 16 x 16 ft to 26 x 26 ft depending on purpose' },
    'Okra':         { tree: 1,   row: 2,   text: 'About 1.5 x 1 ft to 2 x 1.5 ft' },
    'Papaya':       { tree: 7,   row: 7,   text: 'About 6 x 6 ft to 8 x 8 ft' },
    'Pineapple':    { tree: 1,   row: 2,   text: 'About 2 x 1 ft or 3 x 1 ft in paired-row systems' },
    'Red Sanders':  { tree: 13,  row: 13,  text: 'Spacing must follow approved plantation design; commonly around 10 x 10 ft to 16 x 16 ft' },
    'Rosewood':     { tree: 15,  row: 15,  text: 'About 13 x 13 ft to 16 x 16 ft subject to local forestry guidance' },
    'Sandalwood':   { tree: 12,  row: 12,  text: 'About 10 x 10 ft to 13 x 13 ft depending on plantation system' },
    'Silver Oak':   { tree: 15,  row: 15,  text: 'About 13 x 13 ft to 16 x 16 ft depending on purpose' },
    'Sugarcane':    { tree: 1,   row: 3.5, text: 'Common row spacing about 2.5 to 4 ft depending on variety and planting method' },
    'Teak':         { tree: 12,  row: 12,  text: 'About 10 x 10 ft to 13 x 13 ft; wider spacing may suit long-rotation timber' },
    'Tomato':       { tree: 2,   row: 3,   text: 'About 2 x 1.5 ft to 3 x 2 ft depending on variety and training' },
    'Turmeric':     { tree: 1,   row: 1,   text: 'About 1 x 1 ft to 1.5 x 1 ft' },
    'Watermelon':   { tree: 3.5, row: 8,   text: 'About 6.5 x 3.5 ft to 10 x 3.5 ft depending on variety and system' }
  };
  var DEFAULT = { tree: 10, row: 10, text: 'About 10 x 10 ft (verify locally)' };

  var FT_PER_M = 3.28084, M_PER_FT = 0.3048, SQFT_PER_SQM = 10.7639104167;
  var SQFT_PER_SPECIES = 80, MAX_SPECIES_CAP = 8; // keep in sync with backend/main.py

  function spacingFor(name) { return G[name] || DEFAULT; }
  function maxSpeciesForSqft(area) {
    var a = Number(area) || 0;
    return Math.max(1, Math.min(MAX_SPECIES_CAP, Math.floor(Math.round(a * 100) / 100 / SQFT_PER_SPECIES + 1e-6)));
  }
  // 12 -> "12 ft", 0.5 -> "6 inches", 2.5 -> "2.5 ft"
  function fmtFt(n) {
    n = Number(n);
    if (!isFinite(n)) return '';
    if (n < 1) return Math.round(n * 12) + ' inches';
    var r = Math.round(n * 10) / 10;
    return (r % 1 === 0 ? String(r) : r.toFixed(1)) + ' ft';
  }
  function fmtNum(n, d) { n = Number(n); return isFinite(n) ? (Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('en-IN') : ''; }

  // Turns any leftover metre/cm wording into feet ("4 m" -> "13 ft", "60 cm" -> "2 ft"). Used on free text.
  function toFeetText(str) {
    if (typeof str !== 'string') return str;
    function conv(v, unit) {
      var ft = unit === 'cm' ? v / 30.48 : v * FT_PER_M;
      if (ft < 1) return Math.round(ft * 12);
      return Math.round(ft * 2) / 2; // nearest half foot
    }
    var out = str.replace(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(cm|m)\b/gi, function (_, a, b, u) {
      var A = conv(parseFloat(a), u.toLowerCase()), B = conv(parseFloat(b), u.toLowerCase());
      var small = parseFloat(a) / (u.toLowerCase() === 'cm' ? 30.48 : 1 / FT_PER_M) < 1;
      return small ? A + ' x ' + B + ' inches' : A + ' x ' + B + ' ft';
    });
    out = out.replace(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*(cm|m)\b/gi, function (_, a, b, u) {
      u = u.toLowerCase();
      var ftA = u === 'cm' ? parseFloat(a) / 30.48 : parseFloat(a) * FT_PER_M;
      return ftA < 1 ? conv(parseFloat(a), u) + ' to ' + conv(parseFloat(b), u) + ' inches' : conv(parseFloat(a), u) + ' to ' + conv(parseFloat(b), u) + ' ft';
    });
    out = out.replace(/(\d+(?:\.\d+)?)\s*(cm|m)\b/gi, function (_, a, u) {
      u = u.toLowerCase();
      var ft = u === 'cm' ? parseFloat(a) / 30.48 : parseFloat(a) * FT_PER_M;
      return ft < 1 ? Math.round(ft * 12) + ' inches' : conv(parseFloat(a), u) + ' ft';
    });
    return out.replace(/\bmetres?\b|\bmeters?\b/gi, 'feet');
  }

  // Make sure every species guide shows the feet wording (covers the browser copy of the guides).
  if (window.speciesKnowledge) {
    Object.keys(window.speciesKnowledge).forEach(function (n) { if (G[n]) window.speciesKnowledge[n].spacing = G[n].text; });
  }

  window.AranyaUnits = {
    SPACING: G, spacingFor: spacingFor, maxSpeciesForSqft: maxSpeciesForSqft,
    fmtFt: fmtFt, fmtNum: fmtNum, toFeetText: toFeetText,
    FT_PER_M: FT_PER_M, M_PER_FT: M_PER_FT, SQFT_PER_SQM: SQFT_PER_SQM,
    SQFT_PER_SPECIES: SQFT_PER_SPECIES, MAX_SPECIES_CAP: MAX_SPECIES_CAP
  };
})();
