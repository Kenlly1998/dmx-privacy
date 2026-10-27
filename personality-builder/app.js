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

  const FUNC_CATALOG = [
    { name: "Dimmer", dmx: "0~255", display: "'%.1f%%',0.0~100.0" },
    { name: "Closed", dmx: "0~9", display: "Closed" },
    { name: "Open", dmx: "10~19", display: "Open" },
    { name: "Strobe", dmx: "20~255", display: "'Strobe %.f',0~100" },
    { name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255" },
    { name: "Pan", dmx: "0~65535", display: "'%.1f%%',0.0~100.0" },
    { name: "Tilt", dmx: "0~65535", display: "'%.1f%%',0.0~100.0" },
    { name: "Red C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "255,0,0" },
    { name: "Green C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "0,255,0" },
    { name: "Blue C-Mix", dmx: "0~255", display: "'%.1f%%',0.0~100.0", colour: "0,0,255" },
    { name: "Open White", dmx: "0~15", display: "Open" },
    { name: "Index", dmx: "0~127", display: "'Index %.f',0~100" },
    { name: "Rotate CW", dmx: "128~191", display: "'CW %.f',0~100" },
    { name: "Rotate CCW", dmx: "192~255", display: "'CCW %.f',0~100" },
  ];

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

  let state = createEmptyFixture();
  let selection = { kind: "fixture" };
  let catalogTab = "attributes";
  let propsTab = "properties";
  let statusMsg = "Listo.";
  let dirty = false;

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
    if (el) el.textContent = msg;
  }

  function setHelp(text) {
    const el = document.getElementById("help-bar");
    if (el) el.textContent = text;
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
  }

  function defaultFunctionFor(attrId) {
    const presets = {
      Dimmer: FUNC_CATALOG[0],
      Shutter: FUNC_CATALOG[1],
      Pan: FUNC_CATALOG[5],
      Tilt: FUNC_CATALOG[6],
      Red: FUNC_CATALOG[7],
      Green: FUNC_CATALOG[8],
      Blue: FUNC_CATALOG[9],
    };
    const p = presets[attrId] || FUNC_CATALOG[4];
    return {
      id: "1",
      name: p.name,
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
      wheel: attr.wheel || "",
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

  function exportD4() {
    const xml = serializeD4(state);
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    const safeMan = (state.manufacturer || "Manufacturer").replace(/[^\w\- ]+/g, "").trim();
    const safeName = (state.name || "Fixture").replace(/[^\w\- ]+/g, "").trim();
    a.href = URL.createObjectURL(blob);
    a.download = `${safeMan}_${safeName}.d4`;
    a.click();
    URL.revokeObjectURL(a.href);
    dirty = false;
    updateTitle();
    setStatus(`Guardado ${a.download}`);
  }

  function serializeD4(fx) {
    const lines = [];
    lines.push(`<?xml version="1.0" encoding="utf-8"?>`);
    lines.push(
      `<Fixture Name="${xmlAttr(fx.name)}" ShortName="${xmlAttr(fx.shortName)}" Company="${xmlAttr(fx.manufacturer)}">`
    );
    lines.push(`  <Copyright Notice="Replica Personality Builder — independent .d4 export" />`);
    const today = new Date();
    const d = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getFullYear()
    ).slice(2)}`;
    lines.push(`  <History Date="${d}" Author="Personality Builder Replica" Comment="Created" />`);
    if (fx.tags) lines.push(`  <!-- Tags: ${xmlAttr(fx.tags)} -->`);
    if (fx.personalityVersion) lines.push(`  <!-- PersonalityVersion: ${xmlAttr(fx.personalityVersion)} -->`);
    lines.push(`  <Manual Filename="" Summary="" />`);
    lines.push(`  <Control>`);
    for (const attr of fx.attributes) {
      lines.push(`    <Attribute ID="${xmlAttr(attr.id)}" Name="${xmlAttr(attr.name)}" Description="" Group="${attr.group}">`);
      lines.push(`      <Locate Locate="${xmlAttr(attr.locate)}" PowerOn="${xmlAttr(attr.locate)}" />`);
      attr.functions.forEach((fn, idx) => {
        const colour = fn.colour ? ` Colour="${fn.colour}"` : "";
        const intensity = attr.id === "Dimmer" ? ` Intensity="0~0"` : "";
        lines.push(
          `      <Function ID="${idx + 1}" Name="${xmlAttr(fn.name)}" Display="${xmlAttr(fn.display)}" Dmx="${xmlAttr(
            fn.dmx
          )}"${colour}${intensity} />`
        );
      });
      lines.push(`    </Attribute>`);
    }
    lines.push(`  </Control>`);
    for (const mode of fx.modes) {
      lines.push(`  <Mode Name="${xmlAttr(mode.name)}" Channels="${mode.channels}">`);
      lines.push(`    <Import PearlRef="" DiamondRef="" WysiwygRef="" />`);
      lines.push(`    <Physical>`);
      lines.push(`      <Bulb Type="" Lumens="" ColourTemp="" />`);
      lines.push(`      <Lens Name="" Degrees="" />`);
      lines.push(`      <Weight Kg="" />`);
      lines.push(`      <Size Height="" Width="" Depth="" />`);
      lines.push(`      <Focus Type="Fixed" PanMax="0" TiltMax="0" PanMaxSpeed="0" TiltMaxSpeed="0" />`);
      lines.push(`    </Physical>`);
      const hasCells = mode.cells && Array.isArray(mode.cells.cells) && mode.cells.cells.length > 0;
      if (hasCells) {
        // Cell modes typically leave Include empty; masters live under Cells
        lines.push(`    <Include />`);
        lines.push(`    <Cells>`);
        lines.push(`      <Master>`);
        const masters = mode.cells.masterIds.length
          ? mode.cells.masterIds
          : fx.attributes.map((a) => a.id);
        for (const mid of masters) {
          const attr = fx.attributes.find((a) => a.id === mid);
          const wheel = attr?.wheel ? ` Wheel="${xmlAttr(attr.wheel)}"` : "";
          lines.push(`        <Attribute ID="${xmlAttr(mid)}"${wheel} />`);
        }
        lines.push(`      </Master>`);
        for (const cell of mode.cells.cells) {
          lines.push(
            `      <Cell ID="${xmlAttr(cell.id)}" Name="${xmlAttr(cell.name)}" ChannelOffset="${xmlAttr(
              cell.channelOffset
            )}" ModeLink="${xmlAttr(mode.cells.modeLink || "")}" X="${cell.x}" Y="${cell.y}">`
          );
          for (const mid of masters) {
            lines.push(`        <AttributeLink SourceId="${xmlAttr(mid)}" TargetId="${xmlAttr(mid)}" />`);
          }
          lines.push(`      </Cell>`);
        }
        lines.push(`    </Cells>`);
      } else {
        lines.push(`    <Include>`);
        for (const inc of mode.includes) {
          const offset = inc.channelOffset ? ` ChannelOffset="${xmlAttr(inc.channelOffset)}"` : "";
          const wheel = inc.wheel ? ` Wheel="${xmlAttr(inc.wheel)}"` : "";
          const vdim =
            ["Red", "Green", "Blue", "White", "Amber"].includes(inc.id) && fx.attributes.some((a) => a.id === "Dimmer")
              ? ` VirtualControl="Dimmer"`
              : "";
          lines.push(`      <Attribute ID="${xmlAttr(inc.id)}"${offset}${wheel}${vdim} />`);
        }
        lines.push(`    </Include>`);
      }
      lines.push(`  </Mode>`);
    }
    lines.push(`</Fixture>`);
    return lines.join("\n") + "\n";
  }

  async function importD4(file) {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) {
      setStatus("XML inválido.");
      return;
    }
    const root = doc.querySelector("Fixture");
    if (!root) {
      setStatus("No es un .d4 (falta Fixture).");
      return;
    }
    const next = createEmptyFixture();
    next.manufacturer = root.getAttribute("Company") || "";
    next.name = root.getAttribute("Name") || "";
    next.shortName = root.getAttribute("ShortName") || next.name.slice(0, 10);
    for (const attrEl of root.querySelectorAll("Control > Attribute")) {
      const functions = [...attrEl.querySelectorAll("Function")].map((fn, i) => ({
        id: fn.getAttribute("ID") || String(i + 1),
        name: fn.getAttribute("Name") || "",
        dmx: fn.getAttribute("Dmx") || "0~255",
        display: fn.getAttribute("Display") || fn.getAttribute("Name") || "",
        colour: fn.getAttribute("Colour") || undefined,
      }));
      const locateEl = attrEl.querySelector("Locate");
      const dmxSample = functions[0]?.dmx || "0~255";
      const is16 = dmxSample.split("~").some((v) => Number(v) > 255);
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
      });
    }
    for (const modeEl of root.querySelectorAll(":scope > Mode")) {
      const includes = [...modeEl.querySelectorAll("Include > Attribute")].map((a) => ({
        id: a.getAttribute("ID") || "",
        channelOffset: a.getAttribute("ChannelOffset") || "",
        wheel: a.getAttribute("Wheel") || "",
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
        channels: Number(modeEl.getAttribute("Channels") || includes.length),
        includes,
        cells: cellsCfg,
      });
    }
    state = next;
    selection = { kind: "fixture" };
    dirty = false;
    setStatus(`Abierto: ${state.manufacturer} / ${state.name}`);
    render();
  }

  function newFixture() {
    state = createEmptyFixture();
    selection = { kind: "fixture" };
    catalogTab = "attributes";
    propsTab = "properties";
    dirty = false;
    setStatus("Nuevo fixture (File → New).");
    render();
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

    const stub = (label) => `<p class="empty">${label} — pendiente (réplica MVP). En PB 3.4.1 esta pestaña está presente.</p>`;

    if (catalogTab === "attributes") {
      body.innerHTML = `<div class="catalog-grid">${ATTR_CATALOG.map(
        (item) => `
        <div class="catalog-item" draggable="true" data-type="attr" data-id="${esc(item.id)}" title="${esc(item.bank)} / ${esc(item.wheel)}">
          <div class="glyph">${esc(item.glyph || item.name.slice(0, 3).toUpperCase())}</div>
          <div class="label">${esc(item.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>
      <p class="empty">Catálogo alineado a PB 3.4.1 (${ATTR_CATALOG.length} attrs). Clic + para añadir.</p>`;
    } else if (catalogTab === "functions") {
      body.innerHTML = `<div class="catalog-grid">${FUNC_CATALOG.map(
        (fn, i) => `
        <div class="catalog-item" draggable="true" data-type="func" data-index="${i}">
          <div class="glyph">ƒ</div>
          <div class="label">${esc(fn.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>`;
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
      return `<p class="empty">Selecciona un Mode. Luego define filas × columnas y genera el orden.</p>`;
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
            <button type="button" id="btn-cell-gen">Generar</button>
            <button type="button" id="btn-cell-clear">Limpiar</button>
          </div>
        </div>
        <div>
          <strong>Master attributes</strong>
          <div class="cell-master">${masterChecks}</div>
        </div>
        <div class="cell-layout" style="grid-template-columns: repeat(${cols}, 64px);">
          ${tiles.join("")}
        </div>
        <p class="empty">Clic en celdas con orden Manual para definir la secuencia. Generar aplica offsets = inicio + (n−1)×ch/celda.</p>
        <div class="cell-order-list">${esc(orderPreview)}</div>
      </div>`;
  }

  function renderPropertiesTab() {
    if (selection.kind === "fixture") {
      setHelp("Name: Name of this fixture.");
      return `
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
      setHelp("Mode: DMX personality mode (channel count and attribute map).");
      return `
        <table class="prop-grid">
          <tr><th colspan="2">Mode</th></tr>
          <tr><td class="label">Name</td><td><input id="p-mname" value="${esc(m.name)}" /></td></tr>
          <tr><td class="label">Channels</td><td><input id="p-mch" type="number" min="0" value="${m.channels}" /></td></tr>
        </table>`;
    }
    if (selection.kind === "attributes") {
      setHelp("Add attributes from the Attributes catalog.");
      return `<p class="empty">Elige atributos en el catálogo (+).</p>`;
    }
    if (selection.kind === "modes") {
      setHelp("Create a mode from a template, then map Created Attributes.");
      return `<p class="empty">Elige una plantilla de Modes (+).</p>`;
    }
    setHelp("");
    return `<p class="empty">Nodo pendiente en la réplica MVP.</p>`;
  }

  function renderDmxTab() {
    if (selection.kind !== "attribute") return `<p class="empty">Selecciona un atributo para editar DMX Values.</p>`;
    const a = findAttr(selection.id);
    if (!a) return "";
    setHelp("DMX Values: function ranges for this attribute.");
    const rows = a.functions
      .map(
        (fn, i) => `
      <tr>
        <td><input data-dmx-i="${i}" data-f="name" value="${esc(fn.name)}" /></td>
        <td><input data-dmx-i="${i}" data-f="start" value="${esc(fn.dmx.split("~")[0] || "0")}" /></td>
        <td><input data-dmx-i="${i}" data-f="end" value="${esc(fn.dmx.split("~")[1] || "255")}" /></td>
        <td><input data-dmx-i="${i}" data-f="display" value="${esc(fn.display)}" /></td>
      </tr>`
      )
      .join("");
    return `
      <div class="toolbar">
        <button type="button" id="btn-add-fn">+ Function</button>
        <button type="button" id="btn-del-fn">Eliminar última</button>
      </div>
      <table class="dmx-table">
        <thead><tr><th>Name</th><th>Start DMX</th><th>End DMX</th><th>Wheel Display</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4" class="empty">Sin functions</td></tr>`}</tbody>
      </table>`;
  }

  function renderChannelsTab() {
    if (selection.kind !== "mode") return `<p class="empty">Selecciona un Mode para ver Channels.</p>`;
    const m = findMode(selection.name);
    if (!m) return "";
    setHelp("Channels: ChannelOffset and wheel assignment per attribute in this mode.");
    if (!m.includes.length) return `<p class="empty">Pulsa + en Created Attributes con este modo seleccionado.</p>`;
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
    return `<div class="channels-list">
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
        mode.name = e.target.value;
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
      markDirty();
      renderProps();
      bindPropsHandlers();
    });
    document.getElementById("btn-del-fn")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr?.functions.length) return;
      attr.functions.pop();
      markDirty();
      renderProps();
      bindPropsHandlers();
    });

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
      document.getElementById("status-counts").textContent = `${state.attributes.length} attrs · ${state.modes.length} modes`;
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
    document.title = `${state.name}${star} - Personality Builder Replica`;
  }

  function render() {
    renderTree();
    renderCatalog();
    renderProps();
    bindPropsHandlers();
    updateTitle();
    document.getElementById("status-text").textContent = statusMsg;
    document.getElementById("status-counts").textContent = `${state.attributes.length} attrs · ${state.modes.length} modes`;
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
      if (file) importD4(file);
      e.target.value = "";
    });

    document.addEventListener("keydown", (e) => {
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
  }

  boot();
})();
