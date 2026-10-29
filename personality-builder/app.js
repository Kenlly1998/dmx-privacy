(() => {
  "use strict";

  const GROUPS = [
    { id: "I", label: "Intensity" },
    { id: "P", label: "Pan/Tilt" },
    { id: "C", label: "Colour" },
    { id: "G", label: "Gobo" },
    { id: "B", label: "Beam" },
    { id: "E", label: "Effect" },
    { id: "S", label: "Special" },
  ];

  /** Official-style PB function templates (Intensity tab + other groups). */
  const FUNC_GROUPS = [
    { id: "I", label: "Intensity" },
    { id: "P", label: "Pan/Tilt" },
    { id: "C", label: "Colour" },
    { id: "G", label: "Gobo" },
    { id: "B", label: "Beam" },
    { id: "E", label: "Effect" },
    { id: "S", label: "Special" },
  ];

  const FUNC_CATALOG = [
    // Intensity — matches PB 3.4.1 Functions pane
    { group: "I", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    { group: "I", name: "Raw DMX 16bit", dmx: "0~65535", display: "'Raw DMX %.f',0~65535", glyph: "ƒ" },
    { group: "I", name: "8bit Dimmer", dmx: "0~255", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "I", name: "16bit Dimmer", dmx: "0~65535", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "I", name: "Open", dmx: "0~0", display: "Open", glyph: "ƒ" },
    { group: "I", name: "Closed", dmx: "0~0", display: "Closed", glyph: "ƒ" },
    { group: "I", name: "Strobe Hz Range", dmx: "0~255", display: "'Strobe %.1fHz',0.0~25.0", glyph: "ƒ" },
    { group: "I", name: "Strobe % Range", dmx: "0~255", display: "'Strobe %.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "I", name: "Pulse Range", dmx: "0~255", display: "'Pulse %.f%%',0~100", glyph: "ƒ" },
    { group: "I", name: "Open Pulse Range", dmx: "0~255", display: "'Open Pulse %.f%%',0~100", glyph: "ƒ" },
    { group: "I", name: "Close Pulse Range", dmx: "0~255", display: "'Close Pulse %.f%%',100~0", glyph: "ƒ" },
    { group: "I", name: "Random Strobe Range", dmx: "0~255", display: "'Random Strobe %.f%%',0~100", glyph: "ƒ" },
    { group: "I", name: "Generic Percentage Range", dmx: "0~255", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    // Pan/Tilt
    { group: "P", name: "Pan", dmx: "0~65535", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "P", name: "Tilt", dmx: "0~65535", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "P", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    { group: "P", name: "Raw DMX 16bit", dmx: "0~65535", display: "'Raw DMX %.f',0~65535", glyph: "ƒ" },
    { group: "P", name: "Generic Percentage Range", dmx: "0~255", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    // Colour — wheel swatches + C-Mix (PB colour presets)
    { group: "C", name: "Open", dmx: "0~0", display: "Open", colour: "255,255,255", glyph: "ƒ" },
    { group: "C", name: "Red", dmx: "0~0", display: "Red", colour: "255,0,0", glyph: "ƒ" },
    { group: "C", name: "Green", dmx: "0~0", display: "Green", colour: "0,255,0", glyph: "ƒ" },
    { group: "C", name: "Blue", dmx: "0~0", display: "Blue", colour: "0,0,255", glyph: "ƒ" },
    { group: "C", name: "Yellow", dmx: "0~0", display: "Yellow", colour: "255,255,0", glyph: "ƒ" },
    { group: "C", name: "Cyan", dmx: "0~0", display: "Cyan", colour: "0,255,255", glyph: "ƒ" },
    { group: "C", name: "Magenta", dmx: "0~0", display: "Magenta", colour: "255,0,255", glyph: "ƒ" },
    { group: "C", name: "Warm White", dmx: "0~0", display: "Warm White", colour: "255,240,200", glyph: "ƒ" },
    { group: "C", name: "Red C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "255,0,0", glyph: "ƒ" },
    { group: "C", name: "Green C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "0,255,0", glyph: "ƒ" },
    { group: "C", name: "Blue C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "0,0,255", glyph: "ƒ" },
    { group: "C", name: "White C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "255,255,255", glyph: "ƒ" },
    { group: "C", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    // Gobo
    { group: "G", name: "Open", dmx: "0~0", display: "Open", glyph: "ƒ" },
    { group: "G", name: "Index", dmx: "0~127", display: "'Index %.f',0~100", glyph: "ƒ" },
    { group: "G", name: "Rotate CW", dmx: "128~191", display: "'CW %.f',0~100", glyph: "ƒ" },
    { group: "G", name: "Rotate CCW", dmx: "192~255", display: "'CCW %.f',0~100", glyph: "ƒ" },
    { group: "G", name: "Shake", dmx: "0~255", display: "'Shake %.f%%',0~100", glyph: "ƒ" },
    { group: "G", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    // Beam
    { group: "B", name: "Open", dmx: "0~0", display: "Open", glyph: "ƒ" },
    { group: "B", name: "Closed", dmx: "0~0", display: "Closed", glyph: "ƒ" },
    { group: "B", name: "Generic Percentage Range", dmx: "0~255", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "B", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    { group: "B", name: "Raw DMX 16bit", dmx: "0~65535", display: "'Raw DMX %.f',0~65535", glyph: "ƒ" },
    // Effect
    { group: "E", name: "Open", dmx: "0~0", display: "Open", glyph: "ƒ" },
    { group: "E", name: "Index", dmx: "0~127", display: "'Index %.f',0~100", glyph: "ƒ" },
    { group: "E", name: "Rotate CW", dmx: "128~191", display: "'CW %.f',0~100", glyph: "ƒ" },
    { group: "E", name: "Rotate CCW", dmx: "192~255", display: "'CCW %.f',0~100", glyph: "ƒ" },
    { group: "E", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    // Special
    { group: "S", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255", glyph: "ƒ" },
    { group: "S", name: "Generic Percentage Range", dmx: "0~255", display: "'%.1f%%',0.0~100.0", glyph: "ƒ" },
    { group: "S", name: "Open", dmx: "0~0", display: "Open", glyph: "ƒ" },
    { group: "S", name: "Closed", dmx: "0~0", display: "Closed", glyph: "ƒ" },
  ];

  function findFuncPreset(name, group) {
    if (group) {
      const hit = FUNC_CATALOG.find((f) => f.group === group && f.name === name);
      if (hit) return hit;
    }
    return FUNC_CATALOG.find((f) => f.name === name) || FUNC_CATALOG[0];
  }

  /** Fallback if catalog.json fails to load */
  let ATTR_CATALOG = [
    { id: "Dimmer", name: "Dimmer", group: "I", bank: "Intensity", page: "1", wheel: "Dimmer", glyph: "DIM" },
    { id: "Pan", name: "Pan", group: "P", bank: "Pan", page: "1", wheel: "Pan", glyph: "PAN" },
    { id: "Tilt", name: "Tilt", group: "P", bank: "Tilt", page: "1", wheel: "Tilt", glyph: "TIL" },
    { id: "Shutter", name: "Shutter", group: "I", bank: "Intensity", page: "1", wheel: "Wheel 1", glyph: "SHU" },
    { id: "Red", name: "Red", group: "C", bank: "Colour Mix", page: "1", wheel: "Wheel 1", glyph: "R" },
    { id: "Green", name: "Green", group: "C", bank: "Colour Mix", page: "1", wheel: "Wheel 2", glyph: "G" },
    { id: "Blue", name: "Blue", group: "C", bank: "Colour Mix", page: "1", wheel: "Wheel 3", glyph: "B" },
    { id: "White", name: "White", group: "C", bank: "Colour", page: "1", wheel: "Wheel 3", glyph: "W" },
    { id: "Control", name: "Control", group: "S", bank: "Control", page: "1", wheel: "Wheel 1", glyph: "CTL" },
  ];

  let MODE_TEMPLATES = [
    { name: "x DMX, 16bit", channels: 16 },
    { name: "x DMX, 8bit", channels: 24 },
    { name: "Mode 1", channels: 24 },
    { name: "Mode 2", channels: 24 },
    { name: "Basic", channels: 24 },
    { name: "Standard", channels: 24 },
    { name: "Extended", channels: 24 },
    { name: "4ch", channels: 4 },
    { name: "8ch", channels: 8 },
    { name: "12ch", channels: 12 },
  ];

  /**
   * Pearl/Titan Include Wheel= values are numeric indices (PearlMapping.xml Index),
   * not the symbolic names used in Standard.d4t Attribute definitions ("Wheel 1", "Dimmer").
   * Exporting symbolic names is a common cause of Titan/PB rejecting generated .d4 files.
   */
  const WHEEL_INDEX_BY_ATTR = {
    Dimmer: "1",
    Pan: "2",
    Tilt: "3",
    Shutter: "4",
    Shutter1: "4",
    Iris: "21",
    Zoom: "19",
    Focus: "20",
    Colour1: "8",
    Colour2: "8",
    Cyan: "10",
    Magenta: "11",
    Yellow: "12",
    Red: "10",
    Green: "11",
    Blue: "12",
    White: "9",
    Amber: "8",
    WarmWhite: "40",
    ColdWhite: "41",
    UV: "42",
    Lime: "43",
    Gobo1: "14",
    Gobo1Rot: "15",
    Gobo2: "17",
    Gobo2Rot: "18",
    Effect: "23",
    Effect_Rot: "24",
    Frost: "20",
    Prism: "23",
    Prism_Rot: "24",
    Control: "28",
    Speed: "25",
    PT_Speed: "26",
  };

  const COLOR_MIX_IDS = new Set([
    "Red",
    "Green",
    "Blue",
    "White",
    "Amber",
    "WarmWhite",
    "ColdWhite",
    "UV",
    "Lime",
    "Cyan",
    "Magenta",
    "Yellow",
  ]);

  const SYMBOLIC_WHEEL_TO_INDEX = {
    Dimmer: "1",
    Pan: "2",
    Tilt: "3",
  };

  function newGuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** Normalize Include/Master Wheel to a numeric Pearl index string. */
  function wheelIndexForExport(attrId, wheelHint) {
    const raw = String(wheelHint ?? "").trim();
    if (/^\d+$/.test(raw)) return raw;
    if (SYMBOLIC_WHEEL_TO_INDEX[raw]) return SYMBOLIC_WHEEL_TO_INDEX[raw];
    const m = /^Wheel\s+(\d+)$/i.exec(raw);
    if (WHEEL_INDEX_BY_ATTR[attrId]) return WHEEL_INDEX_BY_ATTR[attrId];
    if (m) {
      // "Wheel N" in templates is bank-local; prefer attr map, else leave N only as last resort
      return m[1];
    }
    if (WHEEL_INDEX_BY_ATTR[attrId]) return WHEEL_INDEX_BY_ATTR[attrId];
    return "1";
  }

  function defaultLocateValue(attr) {
    const v = String(attr?.locate || "").trim();
    return v || "1:100";
  }

  function defaultPowerOnValue(attr) {
    const v = String(attr?.powerOn || "").trim();
    if (v) return v;
    if (attr?.id === "Dimmer") return "1:0";
    return defaultLocateValue(attr);
  }

  function physicalXmlBlock(indent) {
    const sp = " ".repeat(indent);
    return [
      `${sp}<Physical>`,
      `${sp}  <Bulb Type="" Lumens="" ColourTemp="" />`,
      `${sp}  <Lens Name="" Degrees="" />`,
      `${sp}  <Weight Kg="" />`,
      `${sp}  <Size Height="" Width="" Depth="" />`,
      `${sp}  <Focus Type="Fixed" PanMax="0" TiltMax="0" PanMaxSpeed="0" TiltMaxSpeed="0" />`,
      `${sp}</Physical>`,
    ];
  }

  function resolveVirtualControl(inc, mode, fx) {
    const existing = String(inc.virtualControl || "").trim();
    if (existing) return existing;
    const hasDimmer =
      fx.attributes.some((a) => a.id === "Dimmer") || mode.includes.some((i) => i.id === "Dimmer");
    if (!hasDimmer) return "";
    if (COLOR_MIX_IDS.has(inc.id) && inc.channelOffset) return "Dimmer";
    // Cell dimmers Dimmer1..DimmerN under a master Dimmer
    if (/^Dimmer\d+$/i.test(inc.id) && inc.channelOffset) return "Dimmer";
    return "";
  }

  let state = createEmptyFixture();
  let selection = { kind: "fixture" };
  let catalogTab = "attributes";
  let funcCatalogGroup = "I";
  let propsTab = "properties";
  let statusMsg = "";
  let dirty = false;
  /** UI state for DMX range sequencer (per session, not persisted). */
  let seqUi = {
    attrId: null,
    start: 0,
    step: 10,
    ceiling: 255,
    mode: "contiguous",
    gap: 1,
    selected: new Set(),
  };

  function t(key, vars) {
    return window.PB_I18N?.t?.(key, vars) ?? key;
  }

  function refreshI18nDom() {
    window.PB_I18N?.applyDom?.();
  }

  function createEmptyFixture() {
    return {
      manufacturer: "",
      name: "Fixture 1",
      shortName: "0",
      personalityVersion: "0",
      tags: "",
      updateVersionOnDirty: true,
      attributes: [],
      modes: [],
    };
  }

  function createEmptyCells() {
    return {
      rows: 1,
      cols: 4,
      channelsPerCell: 3,
      startOffset: 1,
      order: "row-ltr", // row-ltr | row-rtl | col-ttb | serpentine | custom
      modeLink: "RGB 8bit cell",
      masterIds: [],
      customOrder: [], // flat indices into rows*cols for custom click order
      cells: [], // { id, name, x, y, channelOffset, orderIndex }
    };
  }

  function ensureModeCells(mode) {
    if (!mode.cells) mode.cells = createEmptyCells();
    if (!Array.isArray(mode.cells.cells)) mode.cells.cells = [];
    if (!Array.isArray(mode.cells.customOrder)) mode.cells.customOrder = [];
    if (!Array.isArray(mode.cells.masterIds)) mode.cells.masterIds = [];
    return mode.cells;
  }

  /** Build ordered list of {x,y,flat} according to pattern */
  function buildCellCoordinates(cfg) {
    const rows = Math.max(1, Number(cfg.rows) || 1);
    const cols = Math.max(1, Number(cfg.cols) || 1);
    const coords = [];
    if (cfg.order === "custom" && cfg.customOrder.length) {
      for (const flat of cfg.customOrder) {
        const y = Math.floor(flat / cols);
        const x = flat % cols;
        if (y >= 0 && y < rows && x >= 0 && x < cols) coords.push({ x, y, flat });
      }
      return coords;
    }
    if (cfg.order === "col-ttb") {
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) coords.push({ x, y, flat: y * cols + x });
      return coords;
    }
    if (cfg.order === "row-rtl") {
      for (let y = 0; y < rows; y++) for (let x = cols - 1; x >= 0; x--) coords.push({ x, y, flat: y * cols + x });
      return coords;
    }
    if (cfg.order === "serpentine") {
      for (let y = 0; y < rows; y++) {
        if (y % 2 === 0) for (let x = 0; x < cols; x++) coords.push({ x, y, flat: y * cols + x });
        else for (let x = cols - 1; x >= 0; x--) coords.push({ x, y, flat: y * cols + x });
      }
      return coords;
    }
    // row-ltr default
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) coords.push({ x, y, flat: y * cols + x });
    return coords;
  }

  function regenerateCells(mode) {
    const cfg = ensureModeCells(mode);
    const stride = Math.max(1, Number(cfg.channelsPerCell) || 1);
    const start = Math.max(1, Number(cfg.startOffset) || 1);
    const coords = buildCellCoordinates(cfg);
    cfg.cells = coords.map((c, i) => ({
      id: `Cell${i + 1}`,
      name: `Cell ${i + 1}`,
      x: c.x,
      y: c.y,
      channelOffset: String(start + i * stride),
      orderIndex: i + 1,
      flat: c.flat,
    }));
    const total = start - 1 + coords.length * stride;
    if (total > mode.channels) mode.channels = total;
    if (!cfg.masterIds.length) {
      cfg.masterIds = state.attributes
        .filter((a) => ["Dimmer", "Red", "Green", "Blue", "White", "Amber"].includes(a.id))
        .map((a) => a.id);
    }
    return cfg;
  }

  function setStatus(msg) {
    statusMsg = msg;
    const el = document.getElementById("status-text");
    if (el) {
      el.removeAttribute("data-i18n");
      el.textContent = msg;
    }
  }

  function setHelp(text) {
    const el = document.getElementById("help-bar");
    if (el) {
      el.removeAttribute("data-i18n");
      el.textContent = text;
    }
  }

  function updateStatusCounts() {
    const el = document.getElementById("status-counts");
    if (el) el.textContent = t("status.counts", { attrs: state.attributes.length, modes: state.modes.length });
  }

  function ensureSeqUiForAttr(attr) {
    if (!attr) return;
    if (seqUi.attrId !== attr.id) {
      seqUi.attrId = attr.id;
      seqUi.selected = new Set(attr.functions.map((_, i) => i));
      const ceiling = attr.resolution === "16-bit" ? 65535 : 255;
      seqUi.ceiling = ceiling;
      if (seqUi.step > ceiling + 1) seqUi.step = Math.min(10, ceiling + 1) || 1;
    } else {
      const max = attr.functions.length;
      seqUi.selected = new Set([...seqUi.selected].filter((i) => i >= 0 && i < max));
    }
  }

  /**
   * Build Start/End ranges for selected function indices.
   * Width = step; contiguous next = end+1; gap next = end+1+gap; single start=end, next=start+1.
   */
  function computeSeqRanges(indices, opts) {
    const start = Math.max(0, Number(opts.start) || 0);
    const step = Math.max(1, Number(opts.step) || 1);
    const ceiling = Math.max(0, Number(opts.ceiling) || 0);
    const gap = Math.max(0, Number(opts.gap) || 0);
    const mode = opts.mode || "contiguous";
    const ordered = [...indices].sort((a, b) => a - b);
    const ranges = [];
    let cursor = start;
    let overflow = false;
    for (const index of ordered) {
      let lo;
      let hi;
      if (mode === "single") {
        lo = cursor;
        hi = cursor;
        cursor = lo + 1;
      } else {
        lo = cursor;
        hi = cursor + step - 1;
        cursor = hi + 1 + (mode === "gap" ? gap : 0);
      }
      if (hi > ceiling || lo > ceiling) overflow = true;
      ranges.push({ index, start: lo, end: hi });
    }
    return { ranges, overflow, ceiling, next: cursor };
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function xmlAttr(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function findAttr(id) {
    return state.attributes.find((a) => a.id === id);
  }

  function findMode(name) {
    return state.modes.find((m) => m.name === name);
  }

  function markDirty() {
    dirty = true;
    updateTitle();
    scheduleLint();
  }

  let lintTimer = null;
  function scheduleLint() {
    clearTimeout(lintTimer);
    lintTimer = setTimeout(() => renderLint(runLinter()), 120);
  }

  function guessCatalogMatch(name) {
    const n = String(name || "").trim().toLowerCase();
    if (!n) return null;
    const exact = ATTR_CATALOG.find((a) => a.id.toLowerCase() === n || a.name.toLowerCase() === n);
    if (exact) return exact;
    const fuzzy = ATTR_CATALOG.find(
      (a) => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase()) || a.id.toLowerCase().includes(n)
    );
    return fuzzy || null;
  }

  function uniqueAttrId(base) {
    let id = String(base || "Generic").replace(/\s+/g, "");
    if (!id) id = "Generic";
    if (!state.attributes.some((a) => a.id === id)) return id;
    let i = 2;
    while (state.attributes.some((a) => a.id === `${id}${i}`)) i++;
    return `${id}${i}`;
  }

  function ensureAttributeStub(name, resolution) {
    const cat = guessCatalogMatch(name);
    const baseId = cat?.id || String(name).replace(/\s+/g, "") || "Generic";
    const existing = state.attributes.find(
      (a) => a.id === baseId || a.name.toLowerCase() === String(name).toLowerCase()
    );
    if (existing) {
      if (resolution && existing.resolution !== resolution) existing.resolution = resolution;
      return existing;
    }
    const id = state.attributes.some((a) => a.id === baseId) ? uniqueAttrId(baseId) : baseId;
    const attr = {
      id,
      name: cat?.name || name,
      group: cat?.group || "S",
      bank: cat?.bank || "",
      page: cat?.page || "1",
      wheel: cat?.wheel || "Wheel 1",
      resolution: resolution || (id === "Pan" || id === "Tilt" ? "16-bit" : "8-bit"),
      functions: [defaultFunctionFor(id)],
      locate: "1:100",
    };
    state.attributes.push(attr);
    return attr;
  }

  /**
   * Parse lines like:
   * 1,Dimmer,8
   * 2 Red 8
   * Dimmer
   * 5,Pan,16
   */
  function parseChannelLines(text) {
    const rows = [];
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    let autoCh = 1;
    for (const line of lines) {
      let parts = line.includes("\t") ? line.split("\t") : line.split(/[,;|]/);
      parts = parts.map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1 && /^(ch|channel|canal)$/i.test(parts[0])) continue;
      if (parts.length >= 2 && /^(ch|channel|canal)$/i.test(parts[0]) && /attr/i.test(parts[1])) continue;

      let ch = null;
      let name = null;
      let res = null;
      let functionsHint = null;

      if (/^\d+$/.test(parts[0])) {
        ch = Number(parts[0]);
        name = parts[1] || `Channel${ch}`;
        res = parts[2];
        functionsHint = parts[3];
      } else {
        name = parts[0];
        res = parts[1];
        functionsHint = parts[2];
        ch = autoCh;
      }

      let resolution = "8-bit";
      if (res) {
        if (/16/.test(res)) resolution = "16-bit";
        else if (/none|virt/i.test(res)) resolution = "None";
        else resolution = "8-bit";
      } else if (/pan|tilt/i.test(name)) resolution = "16-bit";

      const width = resolution === "16-bit" ? 2 : resolution === "None" ? 0 : 1;
      rows.push({ channel: ch, name, resolution, width, functionsHint });
      autoCh = ch + Math.max(width, 1);
    }
    return rows;
  }

  function applyChannelRows(rows, modeName) {
    if (!rows.length) {
      setStatus("No hay canales para crear.");
      return null;
    }
    let name = modeName || "Mode 1";
    let n = 2;
    while (state.modes.some((m) => m.name === name)) name = `${modeName || "Mode"} ${n++}`;

    const mode = {
      name,
      id: newGuid(),
      channels: 0,
      includes: [],
      cells: createEmptyCells(),
    };

    let cursor = Math.min(...rows.map((r) => r.channel));
    for (const row of rows) {
      const attr = ensureAttributeStub(row.name, row.resolution);
      if (row.functionsHint) {
        const fn = parseFunctionHint(row.functionsHint);
        if (fn) attr.functions = [fn];
      }
      let offset = "";
      if (row.resolution !== "None") {
        const start = row.channel || cursor;
        offset = row.resolution === "16-bit" ? `${start},${start + 1}` : String(start);
        cursor = start + (row.resolution === "16-bit" ? 2 : 1);
      }
      if (!mode.includes.some((i) => i.id === attr.id)) {
        mode.includes.push({
          id: attr.id,
          channelOffset: offset,
          wheel: wheelIndexForExport(attr.id, attr.wheel),
          virtualControl: "",
        });
      }
    }
    mode.channels = Math.max(
      0,
      ...mode.includes.flatMap((i) =>
        String(i.channelOffset || "")
          .split(",")
          .map(Number)
          .filter(Boolean)
      )
    );
    state.modes.push(mode);
    selection = { kind: "mode", name: mode.name };
    propsTab = "channels";
    catalogTab = "created";
    markDirty();
    setStatus(`Mode-first: ${mode.name} · ${mode.includes.length} attrs · ${mode.channels} ch`);
    render();
    return mode;
  }

  function parseFunctionHint(hint) {
    const h = String(hint || "").trim();
    if (!h) return null;
    const m = h.match(/^(\d+)\s*[-~–]\s*(\d+)\s*(.*)$/);
    if (m) {
      const name = (m[3] || "Range").trim() || "Range";
      return {
        id: "1",
        name,
        dmx: `${m[1]}~${m[2]}`,
        display: name,
      };
    }
    return {
      id: "1",
      name: h,
      dmx: "0~255",
      display: h,
    };
  }

  function runLinter() {
    /** @type {{level:'error'|'warn'|'ok', msg:string}[]} */
    const issues = [];
    const ids = new Set();
    for (const a of state.attributes) {
      if (!a.id) issues.push({ level: "error", msg: `Atributo sin ID (${a.name}).` });
      else if (ids.has(a.id)) issues.push({ level: "error", msg: `ID duplicado: ${a.id}.` });
      else ids.add(a.id);
      if (!a.functions.length) issues.push({ level: "error", msg: `${a.id}: sin functions.` });
      else {
        const ranges = [];
        for (const fn of a.functions) {
          const [s, e] = String(fn.dmx || "0~0").split("~").map(Number);
          if (Number.isNaN(s) || Number.isNaN(e)) {
            issues.push({ level: "error", msg: `${a.id}/${fn.name}: DMX inválido (${fn.dmx}).` });
            continue;
          }
          const lo = Math.min(s, e);
          const hi = Math.max(s, e);
          for (const r of ranges) {
            if (lo <= r.hi && hi >= r.lo) {
              issues.push({ level: "error", msg: `${a.id}: solape DMX ${fn.name} con ${r.name}.` });
            }
          }
          ranges.push({ lo, hi, name: fn.name });
        }
        ranges.sort((a, b) => a.lo - b.lo);
        let expect = 0;
        for (const r of ranges) {
          if (r.lo > expect) {
            issues.push({ level: "warn", msg: `${a.id}: hueco DMX ${expect}–${r.lo - 1}.` });
          }
          expect = Math.max(expect, r.hi + 1);
        }
      }
      if (!a.locate) issues.push({ level: "warn", msg: `${a.id}: Locate vacío.` });
      if ((a.id === "Pan" || a.id === "Tilt") && a.resolution !== "16-bit") {
        issues.push({ level: "warn", msg: `${a.id}: suele ser 16-bit.` });
      }
    }

    const hasDimmer = state.attributes.some((a) => a.id === "Dimmer");
    if (state.attributes.length && !hasDimmer) {
      issues.push({ level: "warn", msg: "No hay Attribute ID Dimmer (HTP / fader Pearl)." });
    }

    for (const mode of state.modes) {
      const used = [];
      for (const inc of mode.includes) {
        if (!findAttr(inc.id)) issues.push({ level: "error", msg: `${mode.name}: include desconocido ${inc.id}.` });
        const parts = String(inc.channelOffset || "")
          .split(",")
          .map(Number)
          .filter((n) => n > 0);
        const isVirtualDimmer =
          !parts.length &&
          (inc.virtualControl ||
            mode.includes.some((other) => other.virtualControl === inc.id) ||
            (inc.id === "Dimmer" &&
              mode.includes.some((other) => other.id !== "Dimmer" && other.channelOffset && other.virtualControl === "Dimmer")));
        if (!parts.length && !isVirtualDimmer && findAttr(inc.id)?.resolution !== "None") {
          issues.push({ level: "warn", msg: `${mode.name}/${inc.id}: sin ChannelOffset.` });
        }
        for (const p of parts) {
          if (used.includes(p)) issues.push({ level: "error", msg: `${mode.name}: canal ${p} duplicado.` });
          used.push(p);
        }
      }
      used.sort((a, b) => a - b);
      for (let i = 1; i < used.length; i++) {
        if (used[i] > used[i - 1] + 1) {
          issues.push({ level: "warn", msg: `${mode.name}: hueco de patch ${used[i - 1] + 1}–${used[i] - 1}.` });
        }
      }
      if (mode.cells?.cells?.length) {
        const seen = new Set();
        for (const c of mode.cells.cells) {
          const key = `${c.x},${c.y}`;
          if (seen.has(key)) issues.push({ level: "error", msg: `${mode.name}: celda duplicada X/Y ${key}.` });
          seen.add(key);
        }
      }
    }

    if (!state.attributes.length) issues.push({ level: "warn", msg: "Fixture sin atributos." });
    if (!state.modes.length) issues.push({ level: "warn", msg: "Fixture sin modes." });
    else if (state.modes.every((m) => !Number(m.channels) && !m.includes.length && !m.cells?.cells?.length)) {
      issues.push({ level: "warn", msg: "Hay modes pero ninguno tiene canales / includes / cells." });
    }
    for (const attr of state.attributes) {
      if (attr.hasConditions) {
        issues.push({
          level: "warn",
          msg: `${attr.id}: Condition/ColourFunc presente en el .d4 (lectura parcial; wizard Condition pendiente).`,
        });
      }
    }
    let virtualCount = 0;
    for (const mode of state.modes) {
      for (const inc of mode.includes) {
        if (inc.virtualControl && !inc.channelOffset) virtualCount += 1;
      }
    }
    if (virtualCount) {
      issues.push({
        level: "ok",
        msg: `${virtualCount} include(s) con VirtualControl (dimmer virtual sin ChannelOffset).`,
      });
    }
    if (!issues.some((i) => i.level === "error" || i.level === "warn")) {
      if (!issues.length) issues.push({ level: "ok", msg: "Sin problemas detectados." });
    }
    return issues;
  }

  function renderLint(issues) {
    const bar = document.getElementById("lint-bar");
    if (!bar) return;
    const errors = issues.filter((i) => i.level === "error").length;
    const warns = issues.filter((i) => i.level === "warn").length;
    bar.hidden = false;
    bar.dataset.level = errors ? "error" : issues.every((i) => i.level === "ok") ? "ok" : "warn";
    bar.innerHTML = issues
      .slice(0, 12)
      .map((i) => `<span class="lint-item ${i.level}">${i.level === "ok" ? "✓" : i.level === "error" ? "●" : "▲"} ${esc(i.msg)}</span>`)
      .join("");
    if (issues.length > 12) {
      bar.innerHTML += `<span class="lint-item warn">… +${issues.length - 12} más</span>`;
    }
    if (!errors && !warns) {
      /* keep ok visible briefly */
    }
  }

  function openModal(id) {
    document.getElementById(id)?.removeAttribute("hidden");
    if (id === "modal-mode-first") {
      updateChannelPreview("mf");
      document.getElementById("mf-name")?.focus();
    }
    if (id === "modal-import-table") {
      updateChannelPreview("it");
      document.getElementById("it-name")?.focus();
    }
    if (id === "modal-settings") {
      fillSettingsLangSelect();
      document.getElementById("settings-lang")?.focus();
    }
  }
  function closeModal(id) {
    document.getElementById(id)?.setAttribute("hidden", "");
  }

  function fillSettingsLangSelect() {
    const sel = document.getElementById("settings-lang");
    if (!sel || !window.PB_I18N) return;
    const current = window.PB_I18N.getLang();
    sel.innerHTML = window.PB_I18N.LANGS.map(
      (l) => `<option value="${esc(l.id)}" ${l.id === current ? "selected" : ""}>${esc(l.native)}</option>`
    ).join("");
  }

  function applyLanguage(next) {
    if (!window.PB_I18N) return;
    window.PB_I18N.setLang(next);
    refreshI18nDom();
    const langMeta = window.PB_I18N.LANGS.find((l) => l.id === next);
    setStatus(t("settings.saved", { lang: langMeta?.native || next }));
    render();
    refreshI18nDom();
  }

  function channelPreviewRows(text) {
    const rows = parseChannelLines(text);
    let cursor = rows.length ? Math.min(...rows.map((r) => r.channel)) : 1;
    return rows.map((row) => {
      let offset = "—";
      if (row.resolution !== "None") {
        const start = row.channel || cursor;
        offset = row.resolution === "16-bit" ? `${start},${start + 1}` : String(start);
        cursor = start + (row.resolution === "16-bit" ? 2 : 1);
      }
      return { ...row, offset };
    });
  }

  function updateChannelPreview(kind) {
    const isMf = kind === "mf";
    const text = document.getElementById(isMf ? "mf-channels" : "it-text")?.value || "";
    const meta = document.getElementById(isMf ? "mf-preview-meta" : "it-preview-meta");
    const table = document.getElementById(isMf ? "mf-preview" : "it-preview");
    const tbody = table?.querySelector("tbody");
    if (!tbody) return;
    const rows = channelPreviewRows(text);
    let footprint = 0;
    for (const r of rows) {
      if (r.resolution === "16-bit") footprint += 2;
      else if (r.resolution !== "None") footprint += 1;
    }
    if (meta) {
      meta.textContent = rows.length
        ? `${rows.length} atr · ${footprint} ch DMX`
        : "0 canales";
    }
    tbody.innerHTML = rows.length
      ? rows
          .map(
            (r) => `<tr>
          <td>${esc(r.channel)}</td>
          <td>${esc(r.name)}</td>
          <td>${esc(r.resolution.replace("-bit", ""))}</td>
          <td>${esc(isMf ? r.offset : r.functionsHint || "—")}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="empty">Escribe o pega canales para previsualizar.</td></tr>`;
  }

  function applyMfPreset(key) {
    const presets = {
      rgb: `1,Dimmer,8\n2,Red,8\n3,Green,8\n4,Blue,8`,
      spot: `1,Dimmer,8\n2,Pan,16\n4,Tilt,16\n6,Cyan,8\n7,Magenta,8\n8,Yellow,8\n9,Gobo1,8\n10,Zoom,8`,
      wash: `1,Dimmer,8\n2,Red,8\n3,Green,8\n4,Blue,8\n5,White,8\n6,Zoom,8\n7,Pan,16\n9,Tilt,16`,
    };
    const ta = document.getElementById("mf-channels");
    const name = document.getElementById("mf-name");
    if (!ta) return;
    ta.value = presets[key] || presets.rgb;
    if (name) {
      name.value = key === "spot" ? "Spot 16-bit" : key === "wash" ? "Wash RGBW" : "RGB Mode";
    }
    document.querySelectorAll("[data-mf-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mfPreset === key);
    });
    updateChannelPreview("mf");
  }

  function creationHero(opts = {}) {
    const title = opts.title || t("hero.title");
    const body = opts.body || t("hero.body");
    return `
      <div class="empty-hero">
        <p class="eyebrow">${esc(t("hero.eyebrow"))}</p>
        <h3>${esc(title)}</h3>
        <p>${esc(body)}</p>
        <div class="empty-actions">
          <button type="button" class="btn accent" data-open-mf>${esc(t("hero.createMode"))}</button>
          <button type="button" class="btn ghost" data-open-it>${esc(t("hero.importTable"))}</button>
        </div>
      </div>`;
  }

  function defaultFunctionFor(attrId) {
    const byAttr = {
      Dimmer: () => findFuncPreset("8bit Dimmer", "I"),
      Shutter: () => findFuncPreset("Closed", "I"),
      Pan: () => findFuncPreset("Pan", "P"),
      Tilt: () => findFuncPreset("Tilt", "P"),
      Red: () => findFuncPreset("Red C-Mix", "C"),
      Green: () => findFuncPreset("Green C-Mix", "C"),
      Blue: () => findFuncPreset("Blue C-Mix", "C"),
      White: () => findFuncPreset("White C-Mix", "C"),
      Colour1: () => findFuncPreset("Open", "C"),
    };
    const p = (byAttr[attrId] || (() => findFuncPreset("Raw DMX", "I")))();
    return {
      id: "1",
      name: p.name === "8bit Dimmer" ? "Dimmer" : p.name,
      dmx: p.dmx,
      display: p.display,
      colour: p.colour,
    };
  }

  function addAttributeFromCatalog(item) {
    const id = item.id;
    if (state.attributes.some((a) => a.id === id)) {
      // Allow duplicate visual names with unique instance IDs like Colour1 already used
      setStatus(`El atributo ID "${id}" ya existe (debe ser único).`);
      return;
    }
    const resolution = item.id === "Pan" || item.id === "Tilt" ? "16-bit" : "8-bit";
    state.attributes.push({
      id,
      name: item.name,
      group: item.group || "S",
      bank: item.bank || "",
      page: item.page || "1",
      wheel: item.wheel || "Wheel 1",
      resolution,
      functions: [defaultFunctionFor(id)],
      locate: "1:100",
    });
    selection = { kind: "attribute", id };
    propsTab = "properties";
    markDirty();
    setStatus(`Atributo añadido: ${item.name}`);
    render();
  }

  function addFunctionToSelected(fn) {
    if (selection.kind !== "attribute") {
      setStatus("Selecciona un atributo en Navigation Pane.");
      return;
    }
    const attr = findAttr(selection.id);
    if (!attr) return;
    attr.functions.push({
      id: String(attr.functions.length + 1),
      name: fn.name,
      dmx: fn.dmx,
      display: fn.display,
      colour: fn.colour,
    });
    propsTab = "dmx";
    markDirty();
    setStatus(`Función añadida a ${attr.name}: ${fn.name}`);
    render();
  }

  function addModeFromTemplate(tpl) {
    let name = tpl.name;
    let n = 2;
    while (state.modes.some((m) => m.name === name)) name = `${tpl.name} ${n++}`;
    state.modes.push({
      name,
      id: newGuid(),
      channels: tpl.channels || 0,
      includes: [],
      cells: createEmptyCells(),
    });
    selection = { kind: "mode", name };
    propsTab = "channels";
    markDirty();
    setStatus(`Modo creado: ${name}`);
    render();
  }

  function uniqueModeName(base) {
    const copyLabel = t("mode.copySuffix");
    const escLabel = copyLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const suffixRe = new RegExp(`\\s+${escLabel}(?:\\s+\\d+)?$`, "i");
    let root = String(base || "Mode").trim() || "Mode";
    // Strip prior "copia" / "copy N" so duplicating a copy yields "… copia 2", not "… copia copia"
    root = root.replace(suffixRe, "").trim() || root;
    let name = `${root} ${copyLabel}`;
    let n = 2;
    while (state.modes.some((m) => m.name === name)) {
      name = `${root} ${copyLabel} ${n++}`;
    }
    return name;
  }

  function cloneModeDeep(mode) {
    const cellsSrc = mode.cells || createEmptyCells();
    return {
      name: uniqueModeName(mode.name),
      id: newGuid(),
      channels: Number(mode.channels) || 0,
      includes: (mode.includes || []).map((inc) => ({
        id: inc.id,
        channelOffset: inc.channelOffset || "",
        wheel: inc.wheel || "",
        virtualControl: inc.virtualControl || "",
      })),
      cells: {
        rows: cellsSrc.rows,
        cols: cellsSrc.cols,
        channelsPerCell: cellsSrc.channelsPerCell,
        startOffset: cellsSrc.startOffset,
        order: cellsSrc.order,
        modeLink: cellsSrc.modeLink || "",
        masterIds: [...(cellsSrc.masterIds || [])],
        customOrder: [...(cellsSrc.customOrder || [])],
        cells: (cellsSrc.cells || []).map((c) => ({
          id: c.id,
          name: c.name,
          x: c.x,
          y: c.y,
          channelOffset: c.channelOffset,
          modeLink: c.modeLink || "",
          links: (c.links || []).map((l) => ({ sourceId: l.sourceId, targetId: l.targetId })),
          orderIndex: c.orderIndex,
        })),
      },
    };
  }

  function duplicateMode(sourceName) {
    const src = findMode(sourceName);
    if (!src) {
      setStatus(t("mode.dupMissing"));
      return null;
    }
    const copy = cloneModeDeep(src);
    state.modes.push(copy);
    selection = { kind: "mode", name: copy.name };
    propsTab = "channels";
    catalogTab = "modes";
    markDirty();
    setStatus(t("mode.dupDone", { from: src.name, to: copy.name }));
    render();
    return copy;
  }

  function modeActionsBar(modeName) {
    return `<div class="toolbar mode-actions">
      <button type="button" class="btn accent" id="btn-dup-mode" data-dup-mode="${esc(modeName)}" title="${esc(t("mode.dupHint"))}">${esc(t("mode.duplicate"))}</button>
      <span class="mode-actions-hint">${esc(t("mode.dupHint"))}</span>
    </div>`;
  }

  function bindModeDuplicateHandlers() {
    document.querySelectorAll("#btn-dup-mode, [data-dup-mode]").forEach((btn) => {
      if (btn.dataset.dupBound) return;
      btn.dataset.dupBound = "1";
      btn.addEventListener("click", () => {
        const name =
          btn.getAttribute("data-dup-mode") ||
          (selection.kind === "mode" ? selection.name : null);
        if (name) duplicateMode(name);
      });
    });
    document.querySelectorAll("[data-select-mode]").forEach((btn) => {
      if (btn.dataset.selectBound) return;
      btn.dataset.selectBound = "1";
      btn.addEventListener("click", () => {
        selection = { kind: "mode", name: btn.getAttribute("data-select-mode") };
        propsTab = "properties";
        render();
      });
    });
  }

  function addAttrToSelectedMode(attrId) {
    if (selection.kind !== "mode") {
      setStatus("Selecciona un Mode para mapear ChannelOffset.");
      return;
    }
    const mode = findMode(selection.name);
    const attr = findAttr(attrId);
    if (!mode || !attr) return;
    if (mode.includes.some((i) => i.id === attrId)) {
      setStatus(`${attrId} ya está en el modo.`);
      return;
    }
    const used = new Set();
    for (const inc of mode.includes) {
      for (const part of String(inc.channelOffset || "").split(",")) {
        const n = Number(part);
        if (n) used.add(n);
      }
    }
    let next = 1;
    while (used.has(next)) next++;
    const offset =
      attr.resolution === "16-bit" ? `${next},${next + 1}` : attr.resolution === "None" ? "" : String(next);
    mode.includes.push({
      id: attrId,
      channelOffset: offset,
      wheel: wheelIndexForExport(attrId, attr.wheel),
      virtualControl: "",
    });
    const maxCh = Math.max(
      mode.channels,
      ...mode.includes.flatMap((i) =>
        String(i.channelOffset || "")
          .split(",")
          .map(Number)
          .filter(Boolean)
      ),
      0
    );
    mode.channels = maxCh;
    propsTab = "channels";
    markDirty();
    setStatus(`${attrId} → modo ${mode.name} @ ${offset || "virtual"}`);
    render();
  }

  function collectExportWarnings(fx) {
    const warnings = [];
    if (!fx.attributes.length) warnings.push("fixture sin atributos");
    if (!fx.modes.length) warnings.push("fixture sin modes");
    else {
      const emptyModes = fx.modes.filter(
        (m) => !m.includes?.length && !(m.cells?.cells && m.cells.cells.length) && !Number(m.channels)
      );
      if (emptyModes.length) warnings.push(`${emptyModes.length} mode(s) vacíos`);
    }
    if (!String(fx.manufacturer || "").trim()) warnings.push("Manufacturer vacío");
    if (!String(fx.name || "").trim()) warnings.push("Name vacío");
    for (const a of fx.attributes) {
      if (!a.functions?.length) warnings.push(`${a.id || a.name}: sin functions`);
    }
    return warnings;
  }

  function exportD4() {
    const warnings = collectExportWarnings(state);
    let xml;
    try {
      xml = serializeD4(state);
    } catch (err) {
      console.error(err);
      setStatus(`Export falló: ${err?.message || err}`);
      return;
    }
    const parsed = new DOMParser().parseFromString(xml, "application/xml");
    if (parsed.querySelector("parsererror")) {
      setStatus("Export falló: XML mal formado (no se descargó).");
      return;
    }
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    const safeMan = (state.manufacturer || "Manufacturer").replace(/[^\w\- ]+/g, "").trim() || "Manufacturer";
    const safeName = (state.name || "Fixture").replace(/[^\w\- ]+/g, "").trim() || "Fixture";
    a.href = URL.createObjectURL(blob);
    a.download = `${safeMan}_${safeName}.d4`;
    a.click();
    URL.revokeObjectURL(a.href);
    dirty = false;
    updateTitle();
    if (warnings.length) {
      setStatus(`Guardado ${a.download} · aviso: ${warnings.join("; ")}`);
    } else {
      setStatus(`Guardado ${a.download}`);
    }
  }

  function serializeIncludeAttribute(inc, mode, fx) {
    const parts = [`ID="${xmlAttr(inc.id)}"`];
    if (inc.channelOffset) parts.push(`ChannelOffset="${xmlAttr(inc.channelOffset)}"`);
    const attr = fx.attributes.find((a) => a.id === inc.id);
    const wheel = wheelIndexForExport(inc.id, inc.wheel || attr?.wheel);
    parts.push(`Wheel="${xmlAttr(wheel)}"`);
    const vctrl = resolveVirtualControl(inc, mode, fx);
    if (vctrl) parts.push(`VirtualControl="${xmlAttr(vctrl)}"`);
    return `      <Attribute ${parts.join(" ")} />`;
  }

  function serializeModeBody(mode, fx, opts = {}) {
    const lines = [];
    const hidden = opts.hidden ? ` Hidden="True"` : "";
    const modeId = mode.id || newGuid();
    if (!mode.id) mode.id = modeId;
    const channels = Number(mode.channels) || 0;
    lines.push(`  <Mode Name="${xmlAttr(mode.name)}" Channels="${channels}" Id="${xmlAttr(modeId)}"${hidden}>`);
    lines.push(`    <Import PearlRef="" DiamondRef="" WysiwygRef="" />`);
    lines.push(...physicalXmlBlock(4));
    const hasCells = mode.cells && Array.isArray(mode.cells.cells) && mode.cells.cells.length > 0;
    if (hasCells) {
      // Official cell modes use empty Include; masters live under Cells
      lines.push(`    <Include />`);
      lines.push(`    <Cells>`);
      lines.push(`      <Master>`);
      const masters = mode.cells.masterIds?.length
        ? mode.cells.masterIds
        : fx.attributes.map((a) => a.id);
      for (const mid of masters) {
        const attr = fx.attributes.find((a) => a.id === mid);
        const wheel = wheelIndexForExport(mid, attr?.wheel);
        lines.push(`        <Attribute ID="${xmlAttr(mid)}" Wheel="${xmlAttr(wheel)}" />`);
      }
      lines.push(`      </Master>`);
      const modeLink = String(mode.cells.modeLink || "").trim() || "cell";
      for (const cell of mode.cells.cells) {
        lines.push(
          `      <Cell ID="${xmlAttr(cell.id)}" Name="${xmlAttr(cell.name)}" ChannelOffset="${xmlAttr(
            cell.channelOffset
          )}" ModeLink="${xmlAttr(modeLink)}" X="${cell.x}" Y="${cell.y}">`
        );
        const links =
          Array.isArray(cell.links) && cell.links.length
            ? cell.links
            : masters.map((mid) => ({ sourceId: mid, targetId: mid }));
        for (const link of links) {
          lines.push(
            `        <AttributeLink SourceId="${xmlAttr(link.sourceId)}" TargetId="${xmlAttr(link.targetId)}" />`
          );
        }
        lines.push(`      </Cell>`);
      }
      lines.push(`    </Cells>`);
    } else {
      lines.push(`    <Include>`);
      for (const inc of mode.includes || []) {
        lines.push(serializeIncludeAttribute(inc, mode, fx));
      }
      lines.push(`    </Include>`);
    }
    lines.push(`  </Mode>`);
    return lines;
  }

  /** Build a Hidden Mode referenced by Cells ModeLink when missing. */
  function ensureCellLinkModes(fx) {
    const extras = [];
    const names = new Set(fx.modes.map((m) => m.name));
    for (const mode of fx.modes) {
      const cells = mode.cells?.cells;
      if (!cells?.length) continue;
      const linkName = String(mode.cells.modeLink || "").trim() || "cell";
      mode.cells.modeLink = linkName;
      if (names.has(linkName)) continue;
      names.add(linkName);
      const masters = mode.cells.masterIds?.length
        ? mode.cells.masterIds
        : fx.attributes.map((a) => a.id);
      const stride = Math.max(1, Number(mode.cells.channelsPerCell) || masters.filter((id) => id !== "Dimmer").length || 1);
      let cursor = 1;
      const includes = [];
      for (const mid of masters) {
        if (mid === "Dimmer") {
          // Virtual dimmer in cell footprint (matches Generic LED Batten / RGB 3 DMX)
          includes.push({ id: mid, channelOffset: "", wheel: wheelIndexForExport(mid), virtualControl: "" });
          continue;
        }
        const attr = fx.attributes.find((a) => a.id === mid);
        const is16 = attr?.resolution === "16-bit";
        const offset = is16 ? `${cursor},${cursor + 1}` : String(cursor);
        cursor += is16 ? 2 : 1;
        includes.push({
          id: mid,
          channelOffset: offset,
          wheel: wheelIndexForExport(mid, attr?.wheel),
          virtualControl: COLOR_MIX_IDS.has(mid) ? "Dimmer" : "",
        });
      }
      // Official order often puts Dimmer last without offset when VirtualControl is used
      const dimIdx = includes.findIndex((i) => i.id === "Dimmer");
      if (dimIdx >= 0 && dimIdx !== includes.length - 1) {
        const [dim] = includes.splice(dimIdx, 1);
        includes.push(dim);
      }
      extras.push({
        name: linkName,
        id: newGuid(),
        channels: Math.max(stride, cursor - 1),
        includes,
        cells: createEmptyCells(),
        hidden: true,
      });
    }
    return extras;
  }

  function serializeD4(fx) {
    const lines = [];
    const version = String(fx.personalityVersion || "0");
    const company = fx.manufacturer || "";
    const name = fx.name || "Fixture 1";
    const shortName = fx.shortName || String(name).slice(0, 10) || "0";
    lines.push(`<?xml version="1.0" encoding="utf-8"?>`);
    lines.push(
      `<Fixture Name="${xmlAttr(name)}" ShortName="${xmlAttr(shortName)}" Company="${xmlAttr(company)}" Version="${xmlAttr(
        version
      )}">`
    );
    const year = new Date().getFullYear();
    lines.push(`  <Copyright Notice="Replica Personality Builder — independent .d4 export ${year}" />`);
    const today = new Date();
    const d = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getFullYear()
    ).slice(2)}`;
    lines.push(
      `  <History Date="${d}" Author="Personality Builder Replica" Comment="Created" Version="${xmlAttr(version)}" />`
    );
    if (fx.tags) lines.push(`  <!-- Tags: ${xmlAttr(fx.tags)} -->`);
    lines.push(`  <Manual Filename="" Summary="" />`);
    lines.push(`  <Control>`);
    for (const attr of fx.attributes) {
      const size = attr.resolution === "16-bit" ? ` Size="2"` : "";
      lines.push(
        `    <Attribute ID="${xmlAttr(attr.id)}" Name="${xmlAttr(attr.name)}" Description="" Group="${xmlAttr(
          attr.group || "S"
        )}"${size}>`
      );
      const locate = defaultLocateValue(attr);
      const powerOn = defaultPowerOnValue(attr);
      lines.push(`      <Locate Locate="${xmlAttr(locate)}" PowerOn="${xmlAttr(powerOn)}" />`);
      const fns = attr.functions?.length ? attr.functions : [{ name: attr.name || attr.id, dmx: "0~255", display: "" }];
      fns.forEach((fn, idx) => {
        const colour = fn.colour ? ` Colour="${xmlAttr(fn.colour)}"` : "";
        const intensity = attr.id === "Dimmer" ? ` Intensity="0~0"` : "";
        const display = fn.display || fn.name || "";
        const dmx = fn.dmx || (attr.resolution === "16-bit" ? "0~65535" : "0~255");
        lines.push(
          `      <Function ID="${idx + 1}" Name="${xmlAttr(fn.name || `Function ${idx + 1}`)}" Display="${xmlAttr(
            display
          )}" Dmx="${xmlAttr(dmx)}"${colour}${intensity} />`
        );
      });
      lines.push(`    </Attribute>`);
    }
    lines.push(`  </Control>`);

    const cellLinkModes = ensureCellLinkModes(fx);
    for (const mode of fx.modes) {
      lines.push(...serializeModeBody(mode, fx, { hidden: !!mode.hidden }));
    }
    for (const mode of cellLinkModes) {
      lines.push(...serializeModeBody(mode, fx, { hidden: true }));
    }
    lines.push(`</Fixture>`);
    // Official personalities use CRLF; LF alone usually works but CRLF matches Titan/PB on Windows.
    return lines.join("\r\n") + "\r\n";
  }

  // Test hook for Playwright / console round-trips
  window.__PB_TEST__ = {
    serializeD4,
    collectExportWarnings,
    wheelIndexForExport,
    getState: () => state,
    setState: (next) => {
      state = next;
    },
  };

  function applyImportedFixture(next, statusKey) {
    // Drop importer-only fields
    const clean = {
      manufacturer: next.manufacturer || "",
      name: next.name || "Fixture 1",
      shortName: next.shortName || (next.name || "Fixture").slice(0, 10),
      personalityVersion: next.personalityVersion || "0",
      tags: next.tags || "",
      updateVersionOnDirty: next.updateVersionOnDirty !== false,
      attributes: next.attributes || [],
      modes: (next.modes || []).map((m) => ({
        ...m,
        cells: m.cells || createEmptyCells(),
      })),
    };
    state = clean;
    selection = { kind: "fixture" };
    catalogTab = "created";
    propsTab = "properties";
    dirty = true;
    const modes = state.modes.length;
    setStatus(
      t(statusKey || "import.okD4", {
        man: state.manufacturer || "—",
        name: state.name,
        modes,
      })
    );
    render();
    scheduleLint();
  }

  function parseD4Text(text) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("XML inválido.");
    }
    const root = doc.querySelector("Fixture");
    if (!root) {
      throw new Error("No es un .d4 (falta Fixture).");
    }
    const next = createEmptyFixture();
    next.manufacturer = root.getAttribute("Company") || "";
    next.name = root.getAttribute("Name") || "";
    next.shortName = root.getAttribute("ShortName") || next.name.slice(0, 10);
    next.personalityVersion = root.getAttribute("Version") || next.personalityVersion || "0";
    for (const attrEl of root.querySelectorAll("Control > Attribute")) {
      const functions = [...attrEl.querySelectorAll(":scope > Function")].map((fn, i) => ({
        id: fn.getAttribute("ID") || String(i + 1),
        name: fn.getAttribute("Name") || "",
        dmx: fn.getAttribute("Dmx") || "0~255",
        display: fn.getAttribute("Display") || fn.getAttribute("Name") || "",
        colour: fn.getAttribute("Colour") || undefined,
      }));
      const locateEl = attrEl.querySelector(":scope > Locate");
      const dmxSample = functions[0]?.dmx || "0~255";
      const sizeAttr = Number(attrEl.getAttribute("Size") || 0);
      const is16 = sizeAttr >= 2 || dmxSample.split("~").some((v) => Number(v) > 255);
      const id = attrEl.getAttribute("ID") || `Attr${next.attributes.length + 1}`;
      const cat = ATTR_CATALOG.find((c) => c.id === id);
      next.attributes.push({
        id,
        name: attrEl.getAttribute("Name") || "",
        group: attrEl.getAttribute("Group") || "S",
        bank: cat?.bank || "",
        page: cat?.page || "1",
        wheel: cat?.wheel || "Wheel 1",
        resolution: is16 ? "16-bit" : "8-bit",
        functions,
        locate: locateEl?.getAttribute("Locate") || "1:100",
        powerOn: locateEl?.getAttribute("PowerOn") || "",
        hasConditions: !!attrEl.querySelector(":scope > Condition"),
      });
    }
    for (const modeEl of root.querySelectorAll(":scope > Mode")) {
      const includes = [...modeEl.querySelectorAll(":scope > Include > Attribute")].map((a) => ({
        id: a.getAttribute("ID") || "",
        channelOffset: a.getAttribute("ChannelOffset") || "",
        wheel: a.getAttribute("Wheel") || "",
        virtualControl: a.getAttribute("VirtualControl") || "",
      }));
      const cellsCfg = createEmptyCells();
      const cellsRoot = modeEl.querySelector(":scope > Cells");
      if (cellsRoot) {
        cellsCfg.masterIds = [...cellsRoot.querySelectorAll("Master > Attribute")].map((a) => a.getAttribute("ID") || "").filter(Boolean);
        const cellEls = [...cellsRoot.querySelectorAll(":scope > Cell")];
        cellsCfg.cells = cellEls.map((el, i) => ({
          id: el.getAttribute("ID") || `Cell${i + 1}`,
          name: el.getAttribute("Name") || `Cell ${i + 1}`,
          x: Number(el.getAttribute("X") || 0),
          y: Number(el.getAttribute("Y") || 0),
          channelOffset: el.getAttribute("ChannelOffset") || String(i + 1),
          modeLink: el.getAttribute("ModeLink") || "",
          links: [...el.querySelectorAll("AttributeLink")].map((l) => ({
            sourceId: l.getAttribute("SourceId") || "",
            targetId: l.getAttribute("TargetId") || "",
          })),
          orderIndex: i + 1,
        }));
        if (cellEls[0]) cellsCfg.modeLink = cellEls[0].getAttribute("ModeLink") || cellsCfg.modeLink;
        if (cellsCfg.cells.length) {
          const xs = cellsCfg.cells.map((c) => c.x);
          const ys = cellsCfg.cells.map((c) => c.y);
          cellsCfg.cols = Math.max(...xs) - Math.min(...xs) + 1;
          cellsCfg.rows = Math.max(...ys) - Math.min(...ys) + 1;
          if (cellsCfg.cells.length >= 2) {
            const o0 = Number(cellsCfg.cells[0].channelOffset);
            const o1 = Number(cellsCfg.cells[1].channelOffset);
            if (o1 > o0) cellsCfg.channelsPerCell = o1 - o0;
          }
          cellsCfg.startOffset = Number(cellsCfg.cells[0].channelOffset) || 1;
          cellsCfg.order = "custom";
          cellsCfg.customOrder = cellsCfg.cells.map((c) => c.y * cellsCfg.cols + c.x);
        }
      }
      next.modes.push({
        name: modeEl.getAttribute("Name") || "Mode",
        id: modeEl.getAttribute("Id") || "",
        channels: Number(modeEl.getAttribute("Channels") || includes.length),
        includes,
        cells: cellsCfg,
        hidden: String(modeEl.getAttribute("Hidden") || "").toLowerCase() === "true",
      });
    }
    return next;
  }

  let mvrPick = { buffer: null, choices: [], selected: "" };

  function openMvrPicker(choices, buffer) {
    mvrPick = { buffer, choices, selected: choices[0]?.path || "" };
    const list = document.getElementById("mvr-list");
    if (list) {
      list.innerHTML = choices
        .map(
          (c, i) => `
        <label class="mvr-item">
          <input type="radio" name="mvr-fix" value="${esc(c.path)}" ${i === 0 ? "checked" : ""} />
          <span>${esc(c.label)}</span>
        </label>`
        )
        .join("");
      list.querySelectorAll("input[name='mvr-fix']").forEach((input) => {
        input.addEventListener("change", () => {
          mvrPick.selected = input.value;
        });
      });
    }
    openModal("modal-mvr-pick");
    window.PB_I18N?.applyDom?.(document.getElementById("modal-mvr-pick") || document);
  }

  async function importD4(file) {
    try {
      const text = await file.text();
      const next = parseD4Text(text);
      applyImportedFixture(next, "import.okD4");
      dirty = false;
    } catch (err) {
      setStatus(err.message || String(err));
    }
  }

  async function importGdtfFile(file) {
    if (!window.PB_IMPORT?.importGdtfArrayBuffer) {
      setStatus(t("import.gdtfMissing"));
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const next = await window.PB_IMPORT.importGdtfArrayBuffer(buf);
      applyImportedFixture(next, "import.okGdtf");
    } catch (err) {
      setStatus(`${t("import.gdtfMissing")} ${err.message || err}`);
    }
  }

  async function importMvrFile(file) {
    if (!window.PB_IMPORT?.listMvrGdtfs) {
      setStatus(t("import.gdtfMissing"));
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const choices = await window.PB_IMPORT.listMvrGdtfs(buf);
      if (!choices.length) {
        setStatus(t("mvr.none"));
        return;
      }
      if (choices.length === 1) {
        const next = await window.PB_IMPORT.importMvrArrayBuffer(buf, choices[0].path);
        applyImportedFixture(next, "import.okMvr");
        return;
      }
      openMvrPicker(
        choices.map((c) => ({ path: c.path, label: c.label })),
        buf
      );
    } catch (err) {
      setStatus(`${t("import.gdtfMissing")} ${err.message || err}`);
    }
  }

  async function importAnyFile(file) {
    if (!file) return;
    const name = String(file.name || "").toLowerCase();
    if (name.endsWith(".gdtf")) return importGdtfFile(file);
    if (name.endsWith(".mvr")) return importMvrFile(file);
    if (name.endsWith(".d4") || name.endsWith(".xml")) return importD4(file);
    // sniff zip vs xml
    const buf = await file.arrayBuffer();
    const head = new Uint8Array(buf.slice(0, 4));
    const isZip = head[0] === 0x50 && head[1] === 0x4b;
    if (isZip) {
      // try GDTF then MVR
      try {
        const next = await window.PB_IMPORT.importGdtfArrayBuffer(buf);
        applyImportedFixture(next, "import.okGdtf");
        return;
      } catch {
        /* fall through */
      }
      return importMvrFile(new File([buf], file.name || "file.mvr"));
    }
    try {
      const text = new TextDecoder().decode(buf);
      if (text.includes("<Fixture") || text.includes("<Fixture ")) {
        applyImportedFixture(parseD4Text(text), "import.okD4");
        dirty = false;
        return;
      }
      if (text.includes("FixtureType") || text.includes("<GDTF")) {
        const next = await window.PB_IMPORT.importGdtfTextOrBuffer(text);
        applyImportedFixture(next, "import.okGdtf");
        return;
      }
    } catch (err) {
      setStatus(err.message || String(err));
      return;
    }
    setStatus(t("import.badType"));
  }

  function newFixture() {
    state = createEmptyFixture();
    selection = { kind: "fixture" };
    catalogTab = "attributes";
    propsTab = "properties";
    dirty = false;
    setStatus("Nuevo fixture (File → New).");
    render();
    scheduleLint();
  }

  function renderTree() {
    const root = document.getElementById("tree");
    const attrNodes = state.attributes
      .map((a) => {
        const sel = selection.kind === "attribute" && selection.id === a.id ? "selected" : "";
        return `<li><div class="node ${sel}" data-kind="attribute" data-id="${esc(a.id)}"><span class="twist"></span><span class="icon">◆</span>${esc(
          a.name
        )}</div></li>`;
      })
      .join("");
    const modeNodes = state.modes
      .map((m) => {
        const sel = selection.kind === "mode" && selection.name === m.name ? "selected" : "";
        const kids = m.includes
          .map(
            (inc) =>
              `<li><div class="node" data-kind="mode-attr" data-id="${esc(inc.id)}"><span class="twist"></span><span class="icon">·</span>${esc(
                inc.id
              )} <span style="opacity:.7">@${esc(inc.channelOffset || "virt")}</span></div></li>`
          )
          .join("");
        return `<li>
          <div class="node ${sel}" data-kind="mode" data-name="${esc(m.name)}"><span class="twist">▾</span><span class="icon">☰</span>${esc(
            m.name
          )} (${m.channels})</div>
          <ul>${kids}</ul>
        </li>`;
      })
      .join("");

    // Order matches PB 3.4.1: History, Manual, Physical, Attributes, Modes, Macros, Palettes
    root.innerHTML = `
      <li><div class="node ${selection.kind === "fixture" ? "selected" : ""}" data-kind="fixture"><span class="twist">▾</span><span class="icon">💡</span>${esc(
        state.name
      )}</div>
        <ul>
          <li><div class="node" data-kind="history"><span class="twist"></span><span class="icon">🕒</span>History</div></li>
          <li><div class="node" data-kind="manual"><span class="twist"></span><span class="icon">📄</span>Manual</div></li>
          <li><div class="node" data-kind="physical"><span class="twist"></span><span class="icon">📐</span>Physical</div></li>
          <li>
            <div class="node ${selection.kind === "attributes" ? "selected" : ""}" data-kind="attributes"><span class="twist">▾</span><span class="icon">▤</span>Attributes</div>
            <ul>${attrNodes}</ul>
          </li>
          <li>
            <div class="node ${selection.kind === "modes" ? "selected" : ""}" data-kind="modes"><span class="twist">▾</span><span class="icon">☰</span>Modes</div>
            <ul>${modeNodes}</ul>
          </li>
          <li><div class="node" data-kind="macros"><span class="twist"></span><span class="icon">⌘</span>Macros</div></li>
          <li><div class="node" data-kind="palettes"><span class="twist"></span><span class="icon">▣</span>Palettes</div></li>
        </ul>
      </li>`;
  }

  function renderCatalog() {
    const body = document.getElementById("catalog-body");
    document.querySelectorAll("#catalog-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === catalogTab));

    const stub = (label) => `<p class="empty">${label} — pendiente en la réplica. Disponible en PB 3.4.1.</p>`;

    if (catalogTab === "attributes") {
      const hero = !state.attributes.length && !state.modes.length ? creationHero() : "";
      body.innerHTML = `${hero}<div class="catalog-grid">${ATTR_CATALOG.map(
        (item) => `
        <div class="catalog-item" draggable="true" data-type="attr" data-id="${esc(item.id)}" title="${esc(item.bank)} / ${esc(item.wheel)}">
          <div class="glyph">${esc(item.glyph || item.name.slice(0, 3).toUpperCase())}</div>
          <div class="label">${esc(item.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>
      <p class="empty">${ATTR_CATALOG.length} atributos del catálogo PB. Usa + para añadir.</p>`;
    } else if (catalogTab === "functions") {
      if (!FUNC_GROUPS.some((g) => g.id === funcCatalogGroup)) funcCatalogGroup = "I";
      const items = FUNC_CATALOG.map((fn, i) => ({ fn, i })).filter(({ fn }) => fn.group === funcCatalogGroup);
      const sub = FUNC_GROUPS.map(
        (g) =>
          `<button type="button" class="func-group-btn ${g.id === funcCatalogGroup ? "active" : ""}" data-func-group="${g.id}">${esc(
            g.label
          )}</button>`
      ).join("");
      body.innerHTML = `
        <div class="func-group-tabs">${sub}</div>
        <div class="catalog-grid">${items
          .map(
            ({ fn, i }) => `
        <div class="catalog-item" draggable="true" data-type="func" data-index="${i}" title="${esc(fn.display)} · DMX ${esc(fn.dmx)}">
          <div class="glyph">${esc(fn.glyph || "ƒ")}</div>
          <div class="label">${esc(fn.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
          )
          .join("")}</div>
        <p class="empty">${items.length} presets · grupo ${esc(
        FUNC_GROUPS.find((g) => g.id === funcCatalogGroup)?.label || funcCatalogGroup
      )} (PB)</p>`;
    } else if (catalogTab === "created") {
      body.innerHTML = state.attributes.length
        ? `<div class="catalog-grid">${state.attributes
            .map(
              (a) => `
          <div class="catalog-item" draggable="true" data-type="created" data-id="${esc(a.id)}">
            <div class="glyph">${esc(a.group)}</div>
            <div class="label">${esc(a.name)}</div>
            <button type="button" class="add-btn" data-add>+</button>
          </div>`
            )
            .join("")}</div>
          <p class="empty">Con un Mode seleccionado, + mapea ChannelOffset.</p>`
        : `<p class="empty">Aún no hay atributos creados.</p>`;
    } else if (catalogTab === "modes") {
      body.innerHTML = `<div class="catalog-grid">${MODE_TEMPLATES.map(
        (m, i) => `
        <div class="catalog-item" data-type="mode-tpl" data-index="${i}">
          <div class="glyph">${m.channels || "M"}</div>
          <div class="label">${esc(m.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>`;
    } else if (catalogTab === "current") body.innerHTML = stub("Current Functions");
    else if (catalogTab === "history") body.innerHTML = stub("History");
    else if (catalogTab === "macros") body.innerHTML = stub("Macros");
    else if (catalogTab === "palettes") body.innerHTML = stub("Palettes");
    else if (catalogTab === "swatch") body.innerHTML = stub("Swatch");
  }

  function renderProps() {
    const body = document.getElementById("props-body");
    document.querySelectorAll("#props-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === propsTab));

    if (propsTab === "properties") body.innerHTML = renderPropertiesTab();
    else if (propsTab === "dmx") body.innerHTML = renderDmxTab();
    else if (propsTab === "channels") body.innerHTML = renderChannelsTab();
    else if (propsTab === "wheels") body.innerHTML = renderWheelsTab();
    else if (propsTab === "locate") body.innerHTML = renderLocateTab();
    else if (propsTab === "cells") body.innerHTML = renderCellsTab();
  }

  function renderCellsTab() {
    if (selection.kind !== "mode") {
      setHelp("Cells: selecciona un Mode para mapear la cuadrícula de celdas.");
      if (!state.modes.length) {
        return creationHero({
          title: "Crea un modo antes de mapear celdas",
          body: "Las celdas viven dentro de un Mode. Genera el patch Mode-first y vuelve aquí para la rejilla.",
        });
      }
      return `<div class="empty-hero soft">
        <h3>Selecciona un Mode</h3>
        <p>Elige un modo en el árbol Fixture y define filas × columnas para generar el orden DMX.</p>
      </div>`;
    }
    const mode = findMode(selection.name);
    if (!mode) return "";
    const cfg = ensureModeCells(mode);
    setHelp("Cells grid: X/Y + ChannelOffset. El orden define la secuencia DMX de las celdas.");

    const rows = Math.max(1, Number(cfg.rows) || 1);
    const cols = Math.max(1, Number(cfg.cols) || 1);
    const byFlat = new Map(cfg.cells.map((c) => [c.y * cols + c.x, c]));
    const tiles = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const flat = y * cols + x;
        const cell = byFlat.get(flat);
        const inCustom = cfg.order === "custom" && cfg.customOrder.includes(flat);
        const ordLabel = cell ? cell.orderIndex : inCustom ? cfg.customOrder.indexOf(flat) + 1 : "";
        tiles.push(`
          <button type="button" class="cell-tile ${cell ? "active" : "empty-slot"}" data-cell-flat="${flat}" title="X=${x} Y=${y}">
            <span class="ord">${ordLabel || "·"}</span>
            <span class="meta">${cell ? `ch ${esc(cell.channelOffset)}` : `${x},${y}`}</span>
          </button>`);
      }
    }

    const masterChecks = state.attributes.length
      ? state.attributes
          .map(
            (a) => `
        <label><input type="checkbox" data-master-id="${esc(a.id)}" ${
              cfg.masterIds.includes(a.id) ? "checked" : ""
            } /> ${esc(a.name)}</label>`
          )
          .join("")
      : `<span class="empty">Añade atributos del fixture (p.ej. RGB + Dimmer) para Master.</span>`;

    const orderPreview = cfg.cells.length
      ? cfg.cells.map((c) => `${c.orderIndex}. ${c.id}  X=${c.x} Y=${c.y}  offset=${c.channelOffset}`).join("\n")
      : "(sin celdas — pulsa Generar)";

    return `
      <div class="cell-mapper">
        <div class="cell-controls">
          <label>Filas<input id="cell-rows" type="number" min="1" max="64" value="${rows}" /></label>
          <label>Columnas<input id="cell-cols" type="number" min="1" max="64" value="${cols}" /></label>
          <label>Ch / celda<input id="cell-stride" type="number" min="1" max="64" value="${cfg.channelsPerCell}" /></label>
          <label>Inicio DMX<input id="cell-start" type="number" min="1" value="${cfg.startOffset}" /></label>
          <label>Orden
            <select id="cell-order">
              <option value="row-ltr" ${cfg.order === "row-ltr" ? "selected" : ""}>Filas → (L→R)</option>
              <option value="row-rtl" ${cfg.order === "row-rtl" ? "selected" : ""}>Filas → (R→L)</option>
              <option value="col-ttb" ${cfg.order === "col-ttb" ? "selected" : ""}>Columnas ↓</option>
              <option value="serpentine" ${cfg.order === "serpentine" ? "selected" : ""}>Serpentine</option>
              <option value="custom" ${cfg.order === "custom" ? "selected" : ""}>Manual (clic)</option>
            </select>
          </label>
          <label class="grow">ModeLink<input id="cell-modelink" value="${esc(cfg.modeLink)}" /></label>
          <div class="actions">
            <button type="button" class="btn primary" id="btn-cell-gen">Generar</button>
            <button type="button" class="btn ghost" id="btn-cell-clear">Limpiar</button>
          </div>
        </div>
        <div class="cell-section">
          <div class="section-label">Master attributes</div>
          <div class="cell-master">${masterChecks}</div>
        </div>
        <div class="cell-section">
          <div class="section-label">Rejilla ${rows}×${cols}</div>
          <div class="cell-layout" style="grid-template-columns: repeat(${cols}, 68px);">
            ${tiles.join("")}
          </div>
        </div>
        <p class="empty">Con orden Manual, haz clic en las celdas para definir la secuencia. Generar aplica offsets = inicio + (n−1)×ch/celda.</p>
        <div class="cell-section">
          <div class="section-label">Orden generado</div>
          <div class="cell-order-list">${esc(orderPreview)}</div>
        </div>
      </div>`;
  }

  function renderPropertiesTab() {
    if (selection.kind === "fixture") {
      setHelp("Identidad del fixture. Luego crea el modo desde el patch del manual.");
      const hero = !state.attributes.length && !state.modes.length ? creationHero() : "";
      return `${hero}
        <table class="prop-grid">
          <tr><th colspan="2">Fixture</th></tr>
          <tr><td class="label">Display Name</td><td><input id="p-short" maxlength="10" value="${esc(state.shortName)}" /></td></tr>
          <tr><td class="label">Manufacturer</td><td><input id="p-man" value="${esc(state.manufacturer)}" /></td></tr>
          <tr><td class="label">Name</td><td><input id="p-name" value="${esc(state.name)}" /></td></tr>
          <tr><td class="label">Personality Version</td><td><input id="p-ver" value="${esc(state.personalityVersion)}" /></td></tr>
          <tr><td class="label">Tags</td><td><input id="p-tags" value="${esc(state.tags)}" /></td></tr>
          <tr><th colspan="2">Misc</th></tr>
          <tr><td class="label">UpdateVersionOnDirty</td><td>
            <select id="p-dirty"><option value="true" ${state.updateVersionOnDirty ? "selected" : ""}>True</option>
            <option value="false" ${!state.updateVersionOnDirty ? "selected" : ""}>False</option></select>
          </td></tr>
        </table>`;
    }
    if (selection.kind === "attribute") {
      const a = findAttr(selection.id);
      if (!a) return `<p class="empty">Atributo no encontrado.</p>`;
      setHelp("Attribute ID: Unique identifier used by Titan (shapes, colour pickers, HTP).");
      return `
        <table class="prop-grid">
          <tr><th colspan="2">Attribute Properties</th></tr>
          <tr><td class="label">Attribute ID</td><td><input id="p-aid" value="${esc(a.id)}" /></td></tr>
          <tr><td class="label">Name</td><td><input id="p-aname" value="${esc(a.name)}" /></td></tr>
          <tr><td class="label">Group</td><td>
            <select id="p-group">${GROUPS.map(
              (g) => `<option value="${g.id}" ${g.id === a.group ? "selected" : ""}>${g.id} — ${g.label}</option>`
            ).join("")}</select>
          </td></tr>
          <tr><td class="label">Maximum Resolution</td><td>
            <select id="p-res">${["8-bit", "16-bit", "None"]
              .map((r) => `<option value="${r}" ${r === a.resolution ? "selected" : ""}>${r}</option>`)
              .join("")}</select>
          </td></tr>
          <tr><th colspan="2">Diamond/Pearl Mapping</th></tr>
          <tr><td class="label">Bank</td><td><input id="p-bank" value="${esc(a.bank)}" /></td></tr>
          <tr><td class="label">Page</td><td><input id="p-page" value="${esc(a.page)}" /></td></tr>
          <tr><td class="label">Wheel</td><td><input id="p-wheel" value="${esc(a.wheel)}" /></td></tr>
        </table>`;
    }
    if (selection.kind === "mode") {
      const m = findMode(selection.name);
      if (!m) return "";
      setHelp(t("mode.help"));
      const cellCount = m.cells?.cells?.length || 0;
      return `
        ${modeActionsBar(m.name)}
        <table class="prop-grid">
          <tr><th colspan="2">Mode</th></tr>
          <tr><td class="label">Name</td><td><input id="p-mname" value="${esc(m.name)}" /></td></tr>
          <tr><td class="label">Channels</td><td><input id="p-mch" type="number" min="0" value="${m.channels}" /></td></tr>
          <tr><td class="label">${esc(t("mode.includes"))}</td><td>${m.includes.length}</td></tr>
          <tr><td class="label">Cells</td><td>${cellCount}</td></tr>
        </table>`;
    }
    if (selection.kind === "attributes") {
      setHelp("Add attributes from the Attributes catalog.");
      if (!state.attributes.length) {
        return creationHero({
          title: "Aún no hay atributos",
          body: "Lo más rápido es crear un modo desde el patch; los atributos se generan solos.",
        });
      }
      return `<p class="empty">Elige atributos en el catálogo (+).</p>`;
    }
    if (selection.kind === "modes") {
      setHelp(t("mode.listHelp"));
      if (!state.modes.length) {
        return creationHero({
          title: "Crea tu primer modo",
          body: "Mode-first lee el manual en orden DMX y deja el modo listo con offsets.",
        });
      }
      const rows = state.modes
        .map(
          (m) => `
        <div class="mode-row">
          <div class="mode-row-main">
            <strong>${esc(m.name)}</strong>
            <span class="mode-row-meta">${m.channels} ch · ${m.includes.length} includes · ${m.cells?.cells?.length || 0} cells</span>
          </div>
          <div class="mode-row-actions">
            <button type="button" class="btn ghost" data-select-mode="${esc(m.name)}">${esc(t("mode.open"))}</button>
            <button type="button" class="btn accent" data-dup-mode="${esc(m.name)}" title="${esc(t("mode.dupHint"))}">${esc(t("mode.duplicate"))}</button>
          </div>
        </div>`
        )
        .join("");
      return `
        <div class="mode-list">
          <p class="empty">${esc(t("mode.listIntro"))}</p>
          ${rows}
        </div>`;
    }
    setHelp("");
    return `<p class="empty">Nodo pendiente en la réplica MVP.</p>`;
  }

  function renderDmxTab() {
    if (selection.kind !== "attribute") return `<p class="empty">${esc(t("dmx.selectAttr"))}</p>`;
    const a = findAttr(selection.id);
    if (!a) return "";
    ensureSeqUiForAttr(a);
    setHelp("DMX Values: function ranges for this attribute.");
    const gapHidden = seqUi.mode === "gap" ? "" : "hidden";
    const fnChecks = a.functions
      .map((fn, i) => {
        const checked = seqUi.selected.has(i) ? "checked" : "";
        return `<label class="seq-fn-item">
          <input type="checkbox" data-seq-i="${i}" ${checked} />
          <span class="seq-fn-name">${esc(fn.name)}</span>
          <span class="seq-fn-range">${esc(fn.dmx)}</span>
        </label>`;
      })
      .join("");
    const rows = a.functions
      .map(
        (fn, i) => `
      <tr>
        <td class="col-sel"><input type="checkbox" data-seq-i="${i}" ${seqUi.selected.has(i) ? "checked" : ""} aria-label="select" /></td>
        <td><input data-dmx-i="${i}" data-f="name" value="${esc(fn.name)}" /></td>
        <td><input data-dmx-i="${i}" data-f="start" value="${esc(fn.dmx.split("~")[0] || "0")}" /></td>
        <td><input data-dmx-i="${i}" data-f="end" value="${esc(fn.dmx.split("~")[1] || "255")}" /></td>
        <td><input data-dmx-i="${i}" data-f="display" value="${esc(fn.display)}" /></td>
      </tr>`
      )
      .join("");
    return `
      <div class="toolbar">
        <button type="button" id="btn-add-fn">${esc(t("dmx.addFn"))}</button>
        <button type="button" id="btn-del-fn">${esc(t("dmx.delFn"))}</button>
      </div>
      <div class="seq-panel" id="seq-panel">
        <div class="seq-head">
          <strong>${esc(t("seq.title"))}</strong>
          <p class="seq-hint">${esc(t("seq.hint"))}</p>
        </div>
        <div class="seq-controls">
          <label>${esc(t("seq.start"))}<input id="seq-start" type="number" min="0" value="${seqUi.start}" /></label>
          <label>${esc(t("seq.step"))}<input id="seq-step" type="number" min="1" value="${seqUi.step}" /></label>
          <label>${esc(t("seq.ceiling"))}<input id="seq-ceiling" type="number" min="0" value="${seqUi.ceiling}" /></label>
          <label>${esc(t("seq.mode"))}
            <select id="seq-mode">
              <option value="contiguous" ${seqUi.mode === "contiguous" ? "selected" : ""}>${esc(t("seq.mode.contiguous"))}</option>
              <option value="gap" ${seqUi.mode === "gap" ? "selected" : ""}>${esc(t("seq.mode.gap"))}</option>
              <option value="single" ${seqUi.mode === "single" ? "selected" : ""}>${esc(t("seq.mode.single"))}</option>
            </select>
          </label>
          <label class="seq-gap-wrap" ${gapHidden}>${esc(t("seq.gap"))}<input id="seq-gap" type="number" min="0" value="${seqUi.gap}" /></label>
        </div>
        <div class="seq-actions">
          <button type="button" class="btn ghost" id="seq-all">${esc(t("seq.selectAll"))}</button>
          <button type="button" class="btn ghost" id="seq-none">${esc(t("seq.selectNone"))}</button>
          <button type="button" class="btn ghost" id="seq-preview-btn">${esc(t("seq.preview"))}</button>
          <button type="button" class="btn accent" id="seq-apply">${esc(t("seq.apply"))}</button>
        </div>
        <div class="seq-fn-list">${fnChecks || `<span class="empty">${esc(t("dmx.empty"))}</span>`}</div>
        <div class="seq-preview" id="seq-preview" aria-live="polite"></div>
      </div>
      <table class="dmx-table">
        <thead><tr><th class="col-sel"></th><th>${esc(t("dmx.col.name"))}</th><th>${esc(t("dmx.col.start"))}</th><th>${esc(t("dmx.col.end"))}</th><th>${esc(t("dmx.col.display"))}</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="empty">${esc(t("dmx.empty"))}</td></tr>`}</tbody>
      </table>`;
  }

  function renderChannelsTab() {
    if (selection.kind !== "mode") return `<p class="empty">Selecciona un Mode para ver Channels.</p>`;
    const m = findMode(selection.name);
    if (!m) return "";
    setHelp("Channels: ChannelOffset and wheel assignment per attribute in this mode.");
    const bar = modeActionsBar(m.name);
    if (!m.includes.length) {
      return `${bar}<p class="empty">Pulsa + en Created Attributes con este modo seleccionado.</p>`;
    }
    const rows = m.includes
      .map(
        (inc, i) => `
      <div class="channel-row">
        <strong>ch</strong>
        <span>${esc(inc.id)}</span>
        <input data-ch-i="${i}" data-f="offset" value="${esc(inc.channelOffset)}" title="ChannelOffset" />
        <input data-ch-i="${i}" data-f="wheel" value="${esc(inc.wheel)}" title="Wheel" />
      </div>`
      )
      .join("");
    return `${bar}<div class="channels-list">
      <div class="channel-row" style="font-weight:600;color:var(--muted)"><span> </span><span>Attribute</span><span>Offset</span><span>Wheel</span></div>
      ${rows}
    </div>`;
  }

  function renderWheelsTab() {
    const mode = selection.kind === "mode" ? findMode(selection.name) : state.modes[0];
    if (!mode) return `<p class="empty">Crea un modo primero.</p>`;
    setHelp("Wheel Mapping: encoder layout (simplified MVP).");
    const slots = { 1: [], 2: [], 3: [] };
    for (const inc of mode.includes) {
      const label = String(inc.wheel || "");
      let page = 1;
      if (/Wheel\s*2/i.test(label)) page = 2;
      else if (/Wheel\s*3/i.test(label)) page = 3;
      else if (label === "Pan") page = 2;
      else if (label === "Tilt") page = 3;
      slots[page].push(inc.id);
    }
    return `<div class="wheel-board">
      ${[1, 2, 3]
        .map(
          (n) => `<div class="wheel-slot"><h4>Wheel ${n}</h4>${
            slots[n].map((id) => `<span class="wheel-chip">${esc(id)}</span>`).join("") || '<span class="empty">vacío</span>'
          }</div>`
        )
        .join("")}
    </div>
    <p class="empty">Modo: ${esc(mode.name)}</p>`;
  }

  function renderLocateTab() {
    if (!state.attributes.length) return `<p class="empty">Sin atributos.</p>`;
    setHelp("Locate Values: state when Locate is pressed on the console.");
    const rows = state.attributes
      .map((a) => `<tr><td>${esc(a.name)}</td><td><input data-loc-id="${esc(a.id)}" value="${esc(a.locate)}" /></td></tr>`)
      .join("");
    return `<table class="dmx-table"><thead><tr><th>Attribute</th><th>Locate (fn:percent)</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function bindPropsHandlers() {
    const syncFixture = () => {
      const man = document.getElementById("p-man");
      const name = document.getElementById("p-name");
      const short = document.getElementById("p-short");
      const ver = document.getElementById("p-ver");
      const tags = document.getElementById("p-tags");
      const dirtySel = document.getElementById("p-dirty");
      if (man) state.manufacturer = man.value;
      if (name) state.name = name.value;
      if (short) state.shortName = short.value.slice(0, 10);
      if (ver) state.personalityVersion = ver.value;
      if (tags) state.tags = tags.value;
      if (dirtySel) state.updateVersionOnDirty = dirtySel.value === "true";
      markDirty();
      renderTree();
      updateTitle();
    };
    ["p-man", "p-name", "p-short", "p-ver", "p-tags", "p-dirty"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", syncFixture);
      el.addEventListener("change", syncFixture);
    });

    if (selection.kind === "attribute") {
      const oldId = selection.id;
      const aid = document.getElementById("p-aid");
      aid?.addEventListener("change", () => {
        const attr = findAttr(oldId);
        if (!attr) return;
        const neu = aid.value.trim();
        if (!neu || state.attributes.some((a) => a.id === neu && a !== attr)) {
          setStatus("ID inválido o duplicado.");
          aid.value = oldId;
          return;
        }
        attr.id = neu;
        for (const m of state.modes) for (const inc of m.includes) if (inc.id === oldId) inc.id = neu;
        selection = { kind: "attribute", id: neu };
        markDirty();
        render();
      });
      const bindAttr = (id, key) => {
        const el = document.getElementById(id);
        el?.addEventListener("change", () => {
          const attr = findAttr(selection.id);
          if (!attr) return;
          attr[key] = el.value;
          markDirty();
          if (key === "name") renderTree();
        });
      };
      bindAttr("p-aname", "name");
      bindAttr("p-group", "group");
      bindAttr("p-res", "resolution");
      bindAttr("p-bank", "bank");
      bindAttr("p-page", "page");
      bindAttr("p-wheel", "wheel");
    }

    if (selection.kind === "mode") {
      const old = selection.name;
      document.getElementById("p-mname")?.addEventListener("change", (e) => {
        const mode = findMode(old);
        if (!mode) return;
        const next = String(e.target.value || "").trim() || mode.name;
        if (next !== mode.name && state.modes.some((m) => m.name === next)) {
          setStatus(t("mode.nameTaken", { name: next }));
          e.target.value = mode.name;
          return;
        }
        mode.name = next;
        selection = { kind: "mode", name: mode.name };
        markDirty();
        render();
      });
      document.getElementById("p-mch")?.addEventListener("change", (e) => {
        const mode = findMode(selection.name);
        if (mode) {
          mode.channels = Number(e.target.value) || 0;
          markDirty();
        }
      });
    }

    bindModeDuplicateHandlers();

    document.querySelectorAll("[data-dmx-i]").forEach((input) => {
      input.addEventListener("change", () => {
        const attr = findAttr(selection.id);
        if (!attr) return;
        const i = Number(input.dataset.dmxI);
        const fn = attr.functions[i];
        if (!fn) return;
        if (input.dataset.f === "name") fn.name = input.value;
        if (input.dataset.f === "display") fn.display = input.value;
        if (input.dataset.f === "start" || input.dataset.f === "end") {
          const start = document.querySelector(`[data-dmx-i="${i}"][data-f="start"]`)?.value || "0";
          const end = document.querySelector(`[data-dmx-i="${i}"][data-f="end"]`)?.value || "255";
          fn.dmx = `${start}~${end}`;
        }
        markDirty();
      });
    });

    document.getElementById("btn-add-fn")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr) return;
      attr.functions.push({ id: String(attr.functions.length + 1), name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255" });
      seqUi.selected.add(attr.functions.length - 1);
      markDirty();
      renderProps();
      bindPropsHandlers();
    });
    document.getElementById("btn-del-fn")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr?.functions.length) return;
      attr.functions.pop();
      seqUi.selected.delete(attr.functions.length);
      markDirty();
      renderProps();
      bindPropsHandlers();
    });

    bindSeqHandlers();

    document.querySelectorAll("[data-ch-i]").forEach((input) => {
      input.addEventListener("change", () => {
        const mode = findMode(selection.name);
        if (!mode) return;
        const inc = mode.includes[Number(input.dataset.chI)];
        if (!inc) return;
        if (input.dataset.f === "offset") inc.channelOffset = input.value;
        if (input.dataset.f === "wheel") inc.wheel = input.value;
        markDirty();
        renderTree();
      });
    });

    document.querySelectorAll("[data-loc-id]").forEach((input) => {
      input.addEventListener("change", () => {
        const attr = findAttr(input.dataset.locId);
        if (attr) {
          attr.locate = input.value;
          markDirty();
        }
      });
    });

    bindCellsHandlers();
  }

  function readSeqControlsIntoUi() {
    const start = document.getElementById("seq-start");
    const step = document.getElementById("seq-step");
    const ceiling = document.getElementById("seq-ceiling");
    const mode = document.getElementById("seq-mode");
    const gap = document.getElementById("seq-gap");
    if (start) seqUi.start = Math.max(0, Number(start.value) || 0);
    if (step) seqUi.step = Math.max(1, Number(step.value) || 1);
    if (ceiling) seqUi.ceiling = Math.max(0, Number(ceiling.value) || 0);
    if (mode) seqUi.mode = mode.value || "contiguous";
    if (gap) seqUi.gap = Math.max(0, Number(gap.value) || 0);
    const gapWrap = document.querySelector(".seq-gap-wrap");
    if (gapWrap) {
      if (seqUi.mode === "gap") gapWrap.removeAttribute("hidden");
      else gapWrap.setAttribute("hidden", "");
    }
  }

  function syncSeqSelectionFromDom() {
    seqUi.selected = new Set(
      [...document.querySelectorAll("[data-seq-i]:checked")].map((el) => Number(el.dataset.seqI))
    );
  }

  function updateSeqPreview() {
    const el = document.getElementById("seq-preview");
    if (!el) return;
    readSeqControlsIntoUi();
    syncSeqSelectionFromDom();
    const attr = findAttr(selection.id);
    if (!attr) {
      el.textContent = "";
      return;
    }
    if (!seqUi.selected.size) {
      el.className = "seq-preview warn";
      el.textContent = t("seq.noneSelected");
      return;
    }
    const { ranges, overflow, ceiling } = computeSeqRanges([...seqUi.selected], seqUi);
    const lines = ranges.map((r) => {
      const name = attr.functions[r.index]?.name || `#${r.index}`;
      return `${name}: ${r.start}~${r.end}`;
    });
    if (overflow) {
      el.className = "seq-preview warn";
      el.textContent = `${t("seq.overflow", { ceiling })}\n${lines.join("\n")}`;
    } else {
      el.className = "seq-preview ok";
      el.textContent = lines.join("\n");
    }
  }

  function applySeqRanges() {
    const attr = findAttr(selection.id);
    if (!attr) return;
    readSeqControlsIntoUi();
    syncSeqSelectionFromDom();
    if (!seqUi.selected.size) {
      setStatus(t("seq.noneSelected"));
      updateSeqPreview();
      return;
    }
    const { ranges, overflow, ceiling } = computeSeqRanges([...seqUi.selected], seqUi);
    for (const r of ranges) {
      const fn = attr.functions[r.index];
      if (!fn) continue;
      fn.dmx = `${r.start}~${r.end}`;
    }
    markDirty();
    if (overflow) setStatus(t("seq.overflow", { ceiling }));
    else setStatus(t("seq.applied", { n: ranges.length }));
    renderProps();
    bindPropsHandlers();
  }

  function bindSeqHandlers() {
    if (propsTab !== "dmx" || selection.kind !== "attribute") return;
    if (!document.getElementById("seq-panel")) return;

    const refresh = () => updateSeqPreview();

    ["seq-start", "seq-step", "seq-ceiling", "seq-mode", "seq-gap"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    document.querySelectorAll("[data-seq-i]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const i = Number(cb.dataset.seqI);
        // Keep table + list checkboxes in sync
        document.querySelectorAll(`[data-seq-i="${i}"]`).forEach((el) => {
          el.checked = cb.checked;
        });
        refresh();
      });
    });

    document.getElementById("seq-all")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr) return;
      seqUi.selected = new Set(attr.functions.map((_, i) => i));
      document.querySelectorAll("[data-seq-i]").forEach((el) => {
        el.checked = true;
      });
      refresh();
    });

    document.getElementById("seq-none")?.addEventListener("click", () => {
      seqUi.selected = new Set();
      document.querySelectorAll("[data-seq-i]").forEach((el) => {
        el.checked = false;
      });
      refresh();
    });

    document.getElementById("seq-preview-btn")?.addEventListener("click", refresh);
    document.getElementById("seq-apply")?.addEventListener("click", applySeqRanges);

    updateSeqPreview();
  }

  function bindCellsHandlers() {
    if (propsTab !== "cells" || selection.kind !== "mode") return;
    const mode = findMode(selection.name);
    if (!mode) return;
    const cfg = ensureModeCells(mode);

    const syncDims = () => {
      const rows = document.getElementById("cell-rows");
      const cols = document.getElementById("cell-cols");
      const stride = document.getElementById("cell-stride");
      const start = document.getElementById("cell-start");
      const order = document.getElementById("cell-order");
      const link = document.getElementById("cell-modelink");
      if (rows) cfg.rows = Math.max(1, Number(rows.value) || 1);
      if (cols) cfg.cols = Math.max(1, Number(cols.value) || 1);
      if (stride) cfg.channelsPerCell = Math.max(1, Number(stride.value) || 1);
      if (start) cfg.startOffset = Math.max(1, Number(start.value) || 1);
      if (order) {
        const prev = cfg.order;
        cfg.order = order.value;
        if (cfg.order !== "custom") cfg.customOrder = [];
        else if (prev !== "custom") cfg.customOrder = [];
      }
      if (link) cfg.modeLink = link.value;
      markDirty();
    };

    ["cell-rows", "cell-cols", "cell-stride", "cell-start", "cell-order", "cell-modelink"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        syncDims();
        if (id === "cell-order" || id === "cell-rows" || id === "cell-cols") {
          renderProps();
          bindPropsHandlers();
        }
      });
    });

    document.querySelectorAll("[data-master-id]").forEach((cb) => {
      cb.addEventListener("change", () => {
        cfg.masterIds = [...document.querySelectorAll("[data-master-id]:checked")].map((el) => el.dataset.masterId);
        markDirty();
      });
    });

    document.getElementById("btn-cell-gen")?.addEventListener("click", () => {
      syncDims();
      if (cfg.order === "custom" && !cfg.customOrder.length) {
        setStatus("Orden manual: haz clic en las celdas en el orden deseado, luego Generar.");
        return;
      }
      regenerateCells(mode);
      markDirty();
      setStatus(`Celdas generadas: ${cfg.cells.length} (${cfg.rows}×${cfg.cols}, stride ${cfg.channelsPerCell}).`);
      renderProps();
      bindPropsHandlers();
      renderTree();
      updateTitle();
      updateStatusCounts();
    });

    document.getElementById("btn-cell-clear")?.addEventListener("click", () => {
      cfg.cells = [];
      cfg.customOrder = [];
      markDirty();
      setStatus("Celdas limpiadas.");
      renderProps();
      bindPropsHandlers();
    });

    document.querySelectorAll("[data-cell-flat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const flat = Number(btn.dataset.cellFlat);
        if (cfg.order !== "custom") {
          // Switch to custom and start painting from this click
          cfg.order = "custom";
          cfg.customOrder = [flat];
          const orderSel = document.getElementById("cell-order");
          if (orderSel) orderSel.value = "custom";
          setStatus(`Orden manual: celda 1 = (${flat % cfg.cols},${Math.floor(flat / cfg.cols)}). Sigue haciendo clic.`);
        } else {
          const idx = cfg.customOrder.indexOf(flat);
          if (idx >= 0) cfg.customOrder.splice(idx, 1);
          else cfg.customOrder.push(flat);
          setStatus(`Orden manual: ${cfg.customOrder.length} celdas seleccionadas.`);
        }
        markDirty();
        // Live preview numbers without full regenerate
        regenerateCells(mode);
        renderProps();
        bindPropsHandlers();
      });
    });
  }

  function updateTitle() {
    const star = dirty ? " *" : "";
    const label = state.manufacturer ? `${state.manufacturer} — ${state.name}` : state.name;
    document.getElementById("title-fixture").textContent = `${label}${star}`;
    document.title = `${state.name}${star} - Personality Builder`;
  }

  function render() {
    renderTree();
    renderCatalog();
    renderProps();
    bindPropsHandlers();
    updateTitle();
    const statusEl = document.getElementById("status-text");
    if (statusEl) {
      if (statusMsg) {
        statusEl.removeAttribute("data-i18n");
        statusEl.textContent = statusMsg;
      } else {
        statusEl.setAttribute("data-i18n", "status.ready");
        statusEl.textContent = t("status.ready");
      }
    }
    updateStatusCounts();
  }

  function onTreeClick(e) {
    const node = e.target.closest(".node");
    if (!node) return;
    const kind = node.dataset.kind;
    if (kind === "fixture") selection = { kind: "fixture" };
    else if (kind === "attributes") {
      selection = { kind: "attributes" };
      catalogTab = "attributes";
    } else if (kind === "attribute" || kind === "mode-attr") selection = { kind: "attribute", id: node.dataset.id };
    else if (kind === "modes") {
      selection = { kind: "modes" };
      catalogTab = "modes";
      propsTab = "properties";
    } else if (kind === "mode") selection = { kind: "mode", name: node.dataset.name };
    else {
      setStatus(`${kind}: pendiente en MVP (existe en PB 3.4.1).`);
      return;
    }
    if (kind === "attribute" || kind === "mode-attr") propsTab = "properties";
    if (kind === "mode") propsTab = "channels";
    if (kind === "fixture") propsTab = "properties";
    render();
  }

  function activateCatalogItem(item) {
    if (!item) return;
    if (item.dataset.type === "attr") {
      const cat = ATTR_CATALOG.find((a) => a.id === item.dataset.id);
      if (cat) addAttributeFromCatalog(cat);
    } else if (item.dataset.type === "func") addFunctionToSelected(FUNC_CATALOG[Number(item.dataset.index)]);
    else if (item.dataset.type === "mode-tpl") addModeFromTemplate(MODE_TEMPLATES[Number(item.dataset.index)]);
    else if (item.dataset.type === "created") addAttrToSelectedMode(item.dataset.id);
  }

  function onCatalogActivate(e) {
    const groupBtn = e.target.closest("[data-func-group]");
    if (groupBtn && e.type === "click") {
      funcCatalogGroup = groupBtn.getAttribute("data-func-group") || "I";
      renderCatalog();
      return;
    }
    const item = e.target.closest(".catalog-item");
    if (!item) return;
    if (e.type === "click" && e.target.closest("[data-add]")) {
      activateCatalogItem(item);
      return;
    }
    if (e.type === "dblclick") activateCatalogItem(item);
  }

  function wire() {
    document.getElementById("tree").addEventListener("click", onTreeClick);
    document.getElementById("catalog-body").addEventListener("dblclick", onCatalogActivate);
    document.getElementById("catalog-body").addEventListener("click", onCatalogActivate);
    document.addEventListener("click", (e) => {
      const mf = e.target.closest("[data-open-mf]");
      const it = e.target.closest("[data-open-it]");
      if (mf) openModal("modal-mode-first");
      if (it) openModal("modal-import-table");
    });

    document.querySelectorAll("#catalog-tabs button").forEach((b) => {
      b.addEventListener("click", () => {
        catalogTab = b.dataset.tab;
        renderCatalog();
      });
    });
    document.querySelectorAll("#props-tabs button").forEach((b) => {
      b.addEventListener("click", () => {
        propsTab = b.dataset.tab;
        renderProps();
        bindPropsHandlers();
      });
    });

    document.getElementById("btn-new").addEventListener("click", newFixture);
    document.getElementById("btn-export").addEventListener("click", exportD4);
    document.getElementById("btn-import").addEventListener("click", () => document.getElementById("file-import").click());
    document.getElementById("file-import").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) importAnyFile(file);
      e.target.value = "";
    });

    document.getElementById("btn-mode-first")?.addEventListener("click", () => openModal("modal-mode-first"));
    document.getElementById("btn-quick-create")?.addEventListener("click", () => openModal("modal-mode-first"));
    document.getElementById("btn-import-table")?.addEventListener("click", () => openModal("modal-import-table"));
    document.getElementById("btn-settings")?.addEventListener("click", () => openModal("modal-settings"));

    const closeMvr = () => {
      closeModal("modal-mvr-pick");
      mvrPick = { buffer: null, choices: [], selected: "" };
    };
    document.getElementById("mvr-cancel")?.addEventListener("click", closeMvr);
    document.getElementById("mvr-cancel-2")?.addEventListener("click", closeMvr);
    document.getElementById("mvr-apply")?.addEventListener("click", async () => {
      if (!mvrPick.buffer || !mvrPick.selected) {
        setStatus(t("mvr.none"));
        return;
      }
      try {
        const next = await window.PB_IMPORT.importMvrArrayBuffer(mvrPick.buffer, mvrPick.selected);
        closeMvr();
        applyImportedFixture(next, "import.okMvr");
      } catch (err) {
        setStatus(`${t("import.gdtfMissing")} ${err.message || err}`);
      }
    });
    document.getElementById("btn-run-lint")?.addEventListener("click", () => {
      const issues = runLinter();
      renderLint(issues);
      const err = issues.filter((i) => i.level === "error").length;
      const warn = issues.filter((i) => i.level === "warn").length;
      setStatus(err ? `Linter: ${err} errores, ${warn} avisos` : warn ? `Linter: ${warn} avisos` : "Linter OK");
    });

    const closeSettings = () => closeModal("modal-settings");
    document.getElementById("settings-cancel")?.addEventListener("click", closeSettings);
    document.getElementById("settings-close")?.addEventListener("click", closeSettings);
    document.getElementById("settings-lang")?.addEventListener("change", (e) => {
      applyLanguage(e.target.value);
    });

    const closeMf = () => closeModal("modal-mode-first");
    document.getElementById("mf-cancel")?.addEventListener("click", closeMf);
    document.getElementById("mf-cancel-2")?.addEventListener("click", closeMf);
    document.getElementById("mf-apply")?.addEventListener("click", () => {
      const rows = parseChannelLines(document.getElementById("mf-channels")?.value || "");
      const modeName = document.getElementById("mf-name")?.value || "Mode 1";
      if (applyChannelRows(rows, modeName)) closeModal("modal-mode-first");
    });
    document.getElementById("mf-channels")?.addEventListener("input", () => updateChannelPreview("mf"));
    document.querySelectorAll("[data-mf-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyMfPreset(btn.dataset.mfPreset));
    });

    const closeIt = () => closeModal("modal-import-table");
    document.getElementById("it-cancel")?.addEventListener("click", closeIt);
    document.getElementById("it-cancel-2")?.addEventListener("click", closeIt);
    document.getElementById("it-file")?.addEventListener("click", () => document.getElementById("file-csv")?.click());
    document.getElementById("file-csv")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const ta = document.getElementById("it-text");
      if (ta) ta.value = text;
      updateChannelPreview("it");
      e.target.value = "";
    });
    document.getElementById("it-text")?.addEventListener("input", () => updateChannelPreview("it"));
    document.getElementById("it-apply")?.addEventListener("click", () => {
      const rows = parseChannelLines(document.getElementById("it-text")?.value || "");
      const modeName = document.getElementById("it-name")?.value || "From manual";
      if (applyChannelRows(rows, modeName)) closeModal("modal-import-table");
    });

    document.querySelectorAll(".modal-backdrop").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target === el) el.setAttribute("hidden", "");
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal("modal-mode-first");
        closeModal("modal-import-table");
        closeModal("modal-settings");
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportD4();
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        newFixture();
      }
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        document.getElementById("file-import").click();
      }
    });

    document.getElementById("catalog-body").addEventListener("dragstart", (e) => {
      const item = e.target.closest(".catalog-item");
      if (!item) return;
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ type: item.dataset.type, id: item.dataset.id, index: item.dataset.index })
      );
    });

    const nav = document.getElementById("nav-pane");
    nav.addEventListener("dragover", (e) => e.preventDefault());
    nav.addEventListener("drop", (e) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "attr") {
          const cat = ATTR_CATALOG.find((a) => a.id === data.id);
          if (cat) addAttributeFromCatalog(cat);
        } else if (data.type === "created") addAttrToSelectedMode(data.id);
        else if (data.type === "func") addFunctionToSelected(FUNC_CATALOG[Number(data.index)]);
        else if (data.type === "mode-tpl") addModeFromTemplate(MODE_TEMPLATES[Number(data.index)]);
      } catch {
        /* ignore */
      }
    });
  }

  async function boot() {
    refreshI18nDom();
    fillSettingsLangSelect();
    try {
      const res = await fetch("catalog.json");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.attributes) && data.attributes.length) ATTR_CATALOG = data.attributes;
        if (Array.isArray(data.modes) && data.modes.length) {
          MODE_TEMPLATES = [
            ...data.modes.map((m) => ({ name: m.name, channels: Number(m.channels) || 0 })),
            { name: "4ch", channels: 4 },
            { name: "8ch", channels: 8 },
            { name: "12ch", channels: 12 },
          ];
        }
        setStatus(`Catálogo PB cargado (${ATTR_CATALOG.length} atributos).`);
      }
    } catch {
      setStatus("Usando catálogo embebido (catalog.json no disponible).");
    }
    wire();
    render();
    refreshI18nDom();
    scheduleLint();
  }

  boot();
})();
