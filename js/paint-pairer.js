// Paint Pairer — generates a small, paint-chart-style palette from a base colour.
// Original word lists; not affiliated with or copying any paint brand's naming.

(function () {
  "use strict";

  const HUE_BANDS = [
    { max: 15, nouns: ["Clay", "Brick", "Terracotta", "Ember", "Rust"] },
    { max: 45, nouns: ["Rust", "Amber", "Copper", "Paprika", "Ginger"] },
    { max: 65, nouns: ["Mustard", "Wheat", "Straw", "Honey", "Ochre"] },
    { max: 90, nouns: ["Olive", "Fern", "Moss", "Thyme", "Bramble"] },
    { max: 150, nouns: ["Sage", "Willow", "Pine", "Fennel", "Juniper"] },
    { max: 180, nouns: ["Teal", "Lagoon", "Kelp", "Marsh", "Spruce"] },
    { max: 200, nouns: ["Harbour", "Lake", "Slate", "Pewter", "Storm"] },
    { max: 230, nouns: ["Denim", "Navy", "Cobalt", "Dusk", "Horizon"] },
    { max: 265, nouns: ["Indigo", "Thistle", "Heather", "Iris", "Twilight"] },
    { max: 300, nouns: ["Plum", "Fig", "Mulberry", "Aubergine", "Violet"] },
    { max: 335, nouns: ["Rosewood", "Blush", "Clover", "Peony", "Raspberry"] },
    { max: 361, nouns: ["Clay", "Brick", "Terracotta", "Ember", "Rust"] },
  ];

  const NEUTRAL_NOUNS = ["Driftwood", "Linen", "Putty", "Oat", "Pebble", "Chalk", "Fog", "Ash"];

  const DARK_ADJ = ["Deep", "Smoked", "Burnt", "Hollow", "Stormy", "Charred"];
  const LIGHT_ADJ = ["Pale", "Quiet", "Chalky", "Faded", "Whispering", "Weathered"];
  const MID_ADJ = ["Dusty", "Soft", "Muted", "Warm", "Cool", "Gentle"];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "").trim();
    const full =
      clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean;
    const num = parseInt(full, 16);
    if (full.length !== 6 || Number.isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToHex({ h, s, l }) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = (v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function pick(list, seed) {
    return list[seed % list.length];
  }

  function nameFor(hsl, seed) {
    const isNeutral = hsl.s < 12;
    const noun = isNeutral
      ? pick(NEUTRAL_NOUNS, seed)
      : pick(HUE_BANDS.find((b) => hsl.h <= b.max).nouns, seed);

    let adjList;
    if (hsl.l < 30) adjList = DARK_ADJ;
    else if (hsl.l > 75) adjList = LIGHT_ADJ;
    else adjList = MID_ADJ;

    const adj = pick(adjList, Math.floor(seed / 7));
    return `${adj} ${noun}`;
  }

  function buildSwatch(role, hsl, seedBase) {
    hsl = {
      h: hsl.h,
      s: clamp(hsl.s, 14, 58),
      l: clamp(hsl.l, 8, 93),
    };
    const hex = hslToHex(hsl);
    const seed = hashString(hex + seedBase);
    return { role, hex, name: nameFor(hsl, seed) };
  }

  function generatePalette(baseHex) {
    const rgb = hexToRgb(baseHex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb);

    const base = buildSwatch("Your colour", hsl, "base");
    const complement = buildSwatch("Complement", { h: hsl.h + 180, s: hsl.s, l: hsl.l }, "comp");
    const warmNeighbour = buildSwatch("Warm neighbour", { h: hsl.h - 30, s: hsl.s, l: hsl.l }, "warm");
    const coolNeighbour = buildSwatch("Cool neighbour", { h: hsl.h + 30, s: hsl.s, l: hsl.l }, "cool");
    const ceiling = buildSwatch("Ceiling / trim", { h: hsl.h, s: hsl.s * 0.5, l: Math.max(hsl.l, 82) }, "tint");
    const skirting = buildSwatch("Skirting / accent", { h: hsl.h, s: hsl.s, l: Math.min(hsl.l, 22) }, "shade");

    return [base, warmNeighbour, coolNeighbour, complement, ceiling, skirting];
  }

  window.PaintPairer = { generatePalette, hexToRgb };
})();
