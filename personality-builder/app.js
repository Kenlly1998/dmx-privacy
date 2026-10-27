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

  const ATTR_CATALOG = [
    { id: "Dimmer", name: "Dimmer", group: "I", glyph: "DIM" },
    { id: "Shutter", name: "Shutter", group: "I", glyph: "SHU" },
    { id: "Pan", name: "Pan", group: "P", glyph: "PAN" },
    { id: "Tilt", name: "Tilt", group: "P", glyph: "TLT" },
    { id: "Red", name: "Red", group: "C", glyph: "R" },
    { id: "Green", name: "Green", group: "C", glyph: "G" },
    { id: "Blue", name: "Blue", group: "C", glyph: "B" },
    { id: "White", name: "White", group: "C", glyph: "W" },
    { id: "Amber", name: "Amber", group: "C", glyph: "A" },
    { id: "Cyan", name: "Cyan", group: "C", glyph: "C" },
    { id: "Magenta", name: "Magenta", group: "C", glyph: "M" },
    { id: "Yellow", name: "Yellow", group: "C", glyph: "Y" },
    { id: "Colour1", name: "Colour 1", group: "C", glyph: "COL" },
    { id: "Gobo1", name: "Gobo 1", group: "G", glyph: "GB1" },
    { id: "Gobo2", name: "Gobo 2", group: "G", glyph: "GB2" },
    { id: "Zoom", name: "Zoom", group: "B", glyph: "ZOM" },
    { id: "Focus", name: "Focus", group: "B", glyph: "FCS" },
    { id: "Iris", name: "Iris", group: "B", glyph: "IRS" },
    { id: "Prism", name: "Prism", group: "E", glyph: "PRM" },
    { id: "Frost", name: "Frost", group: "E", glyph: "FRS" },
    { id: "Control", name: "Control", group: "S", glyph: "CTL" },
    { id: "Generic1", name: "Generic 1", group: "S", glyph: "G1" },
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

  const MODE_TEMPLATES = [
    { name: "1ch", channels: 1 },
    { name: "3ch", channels: 3 },
    { name: "4ch", channels: 4 },
    { name: "6ch", channels: 6 },
    { name: "8ch", channels: 8 },
    { name: "12ch", channels: 12 },
    { name: "16ch", channels: 16 },
    { name: "Standard", channels: 0 },
    { name: "Extended", channels: 0 },
  ];

  /** @type {FixtureState} */
  let state = createEmptyFixture();
  let selection = { kind: "fixture" };
  let catalogTab = "attributes";
  let propsTab = "properties";
  let statusMsg = "Listo.";

  /**
   * @typedef {{ id: string, name: string, dmx: string, display: string, colour?: string }} Func
   * @typedef {{ id: string, name: string, group: string, resolution: '8-bit'|'16-bit'|'None', functions: Func[], locate: string }} Attr
   * @typedef {{ name: string, channels: number, includes: { id: string, channelOffset: string, wheel: string }[] }} Mode
   * @typedef {{ manufacturer: string, name: string, shortName: string, attributes: Attr[], modes: Mode[] }} FixtureState
   */

  function createEmptyFixture() {
    return {
      manufacturer: "Avo",
      name: "Fixture 1",
      shortName: "Fixture1",
      attributes: [],
      modes: [],
    };
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function setStatus(msg) {
    statusMsg = msg;
    const el = document.getElementById("status-text");
    if (el) el.textContent = msg;
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function findAttr(id) {
    return state.attributes.find((a) => a.id === id);
  }

  function findMode(name) {
    return state.modes.find((m) => m.name === name);
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
    if (state.attributes.some((a) => a.id === item.id)) {
      setStatus(`El atributo ${item.id} ya existe (ID único).`);
      return;
    }
    const resolution = item.id === "Pan" || item.id === "Tilt" ? "16-bit" : "8-bit";
    state.attributes.push({
      id: item.id,
      name: item.name,
      group: item.group,
      resolution,
      functions: [defaultFunctionFor(item.id)],
      locate: "1:100",
    });
    selection = { kind: "attribute", id: item.id };
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
    setStatus(`Función añadida a ${attr.name}: ${fn.name}`);
    render();
  }

  function addModeFromTemplate(tpl) {
    let name = tpl.name;
    let n = 2;
    while (state.modes.some((m) => m.name === name)) {
      name = `${tpl.name} ${n++}`;
    }
    state.modes.push({
      name,
      channels: tpl.channels || state.attributes.filter((a) => a.resolution !== "None").length,
      includes: [],
    });
    selection = { kind: "mode", name };
    setStatus(`Modo creado: ${name}`);
    render();
  }

  function addAttrToSelectedMode(attrId) {
    if (selection.kind !== "mode") {
      setStatus("Selecciona un modo para asignar atributos.");
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
    const wheel =
      attr.id === "Dimmer" ? "1" : attr.group === "P" ? (attr.id === "Pan" ? "2" : "3") : String(10 + mode.includes.length);
    mode.includes.push({ id: attrId, channelOffset: offset, wheel });
    mode.channels = Math.max(
      mode.channels,
      ...mode.includes.flatMap((i) =>
        String(i.channelOffset || "")
          .split(",")
          .map(Number)
          .filter(Boolean)
      ),
      0
    );
    propsTab = "channels";
    setStatus(`${attrId} → modo ${mode.name} @ ${offset || "virtual"}`);
    render();
  }

  function exportD4() {
    const xml = serializeD4(state);
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    const safeMan = state.manufacturer.replace(/[^\w\- ]+/g, "").trim() || "Manufacturer";
    const safeName = state.name.replace(/[^\w\- ]+/g, "").trim() || "Fixture";
    a.href = URL.createObjectURL(blob);
    a.download = `${safeMan}_${safeName}.d4`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`Exportado ${a.download}`);
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
    lines.push(`  <Manual Filename="" Summary="" />`);
    lines.push(`  <Control>`);
    for (const attr of fx.attributes) {
      lines.push(`    <Attribute ID="${xmlAttr(attr.id)}" Name="${xmlAttr(attr.name)}" Description="" Group="${attr.group}">`);
      lines.push(`      <Locate Locate="${xmlAttr(attr.locate)}" PowerOn="${xmlAttr(attr.locate)}" />`);
      attr.functions.forEach((fn, idx) => {
        const colour = fn.colour ? ` Colour="${fn.colour}"` : "";
        const intensity = attr.group === "I" && attr.id === "Dimmer" ? ` Intensity="0~0"` : "";
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
      lines.push(`  </Mode>`);
    }
    lines.push(`</Fixture>`);
    return lines.join("\n") + "\n";
  }

  function xmlAttr(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
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
      next.attributes.push({
        id: attrEl.getAttribute("ID") || uid("Attr"),
        name: attrEl.getAttribute("Name") || "",
        group: attrEl.getAttribute("Group") || "S",
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
      next.modes.push({
        name: modeEl.getAttribute("Name") || "Mode",
        channels: Number(modeEl.getAttribute("Channels") || includes.length),
        includes,
      });
    }
    state = next;
    selection = { kind: "fixture" };
    setStatus(`Importado: ${state.manufacturer} / ${state.name}`);
    render();
  }

  function newFixture() {
    state = createEmptyFixture();
    selection = { kind: "fixture" };
    catalogTab = "attributes";
    propsTab = "properties";
    setStatus("Nuevo fixture (File → New).");
    render();
  }

  function renderTree() {
    const root = document.getElementById("tree");
    const attrOpen = selection.kind === "attribute" || selection.kind === "attributes";
    const modeOpen = selection.kind === "mode" || selection.kind === "modes";

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
          .map((inc) => {
            return `<li><div class="node" data-kind="mode-attr" data-mode="${esc(m.name)}" data-id="${esc(
              inc.id
            )}"><span class="twist"></span><span class="icon">·</span>${esc(inc.id)} <span style="opacity:.7">@${esc(
              inc.channelOffset || "virt"
            )}</span></div></li>`;
          })
          .join("");
        return `<li>
          <div class="node ${sel}" data-kind="mode" data-name="${esc(m.name)}"><span class="twist">▾</span><span class="icon">☰</span>${esc(
            m.name
          )} (${m.channels})</div>
          <ul>${kids}</ul>
        </li>`;
      })
      .join("");

    root.innerHTML = `
      <li><div class="node ${selection.kind === "fixture" ? "selected" : ""}" data-kind="fixture"><span class="twist">▾</span><span class="icon">💡</span>${esc(
        state.name
      )}</div>
        <ul>
          <li><div class="node" data-kind="meta"><span class="twist"></span><span class="icon">ℹ</span>History / Manual / Physical</div></li>
          <li>
            <div class="node ${selection.kind === "attributes" ? "selected" : ""}" data-kind="attributes"><span class="twist">${
              attrOpen ? "▾" : "▸"
            }</span><span class="icon">▤</span>Attributes</div>
            <ul>${attrNodes}</ul>
          </li>
          <li><div class="node" data-kind="macros"><span class="twist"></span><span class="icon">⌘</span>Macros</div></li>
          <li>
            <div class="node ${selection.kind === "modes" ? "selected" : ""}" data-kind="modes"><span class="twist">${
              modeOpen ? "▾" : "▸"
            }</span><span class="icon">☰</span>Modes</div>
            <ul>${modeNodes}</ul>
          </li>
          <li><div class="node" data-kind="palettes"><span class="twist"></span><span class="icon">▣</span>Palettes</div></li>
        </ul>
      </li>`;
  }

  function renderCatalog() {
    const body = document.getElementById("catalog-body");
    const tabs = document.querySelectorAll("#catalog-tabs button");
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === catalogTab));

    if (catalogTab === "attributes") {
      body.innerHTML = `<div class="catalog-grid">${ATTR_CATALOG.map(
        (item) => `
        <div class="catalog-item" draggable="true" data-type="attr" data-id="${esc(item.id)}">
          <div class="glyph">${esc(item.glyph)}</div>
          <div class="label">${esc(item.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>
      <p class="empty">Clic en + / doble clic / arrastra al árbol para añadir.</p>`;
    } else if (catalogTab === "functions") {
      body.innerHTML = `<div class="catalog-grid">${FUNC_CATALOG.map(
        (fn, i) => `
        <div class="catalog-item" draggable="true" data-type="func" data-index="${i}">
          <div class="glyph">ƒ</div>
          <div class="label">${esc(fn.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>
      <p class="empty">Selecciona un atributo y pulsa + para añadir la función.</p>`;
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
          <p class="empty">Con un Mode seleccionado, pulsa + para mapear ChannelOffset.</p>`
        : `<p class="empty">Aún no hay atributos creados.</p>`;
    } else if (catalogTab === "modes") {
      body.innerHTML = `<div class="catalog-grid">${MODE_TEMPLATES.map(
        (m, i) => `
        <div class="catalog-item" data-type="mode-tpl" data-index="${i}">
          <div class="glyph">${m.channels || "M"}</div>
          <div class="label">${esc(m.name)}</div>
          <button type="button" class="add-btn" data-add>+</button>
        </div>`
      ).join("")}</div>
      <p class="empty">Pulsa + para crear un modo; luego Created Attributes → +.</p>`;
    }
  }

  function renderProps() {
    const body = document.getElementById("props-body");
    const tabs = document.querySelectorAll("#props-tabs button");
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === propsTab));

    if (propsTab === "properties") {
      body.innerHTML = renderPropertiesTab();
      return;
    }
    if (propsTab === "dmx") {
      body.innerHTML = renderDmxTab();
      return;
    }
    if (propsTab === "channels") {
      body.innerHTML = renderChannelsTab();
      return;
    }
    if (propsTab === "wheels") {
      body.innerHTML = renderWheelsTab();
      return;
    }
    if (propsTab === "locate") {
      body.innerHTML = renderLocateTab();
    }
  }

  function renderPropertiesTab() {
    if (selection.kind === "fixture" || selection.kind === "meta") {
      return `
        <table class="prop-grid">
          <tr><th colspan="2">Fixture</th></tr>
          <tr><td class="label">Manufacturer</td><td><input id="p-man" value="${esc(state.manufacturer)}" /></td></tr>
          <tr><td class="label">Name</td><td><input id="p-name" value="${esc(state.name)}" /></td></tr>
          <tr><td class="label">Display Name</td><td><input id="p-short" maxlength="10" value="${esc(state.shortName)}" /></td></tr>
        </table>`;
    }
    if (selection.kind === "attribute") {
      const a = findAttr(selection.id);
      if (!a) return `<p class="empty">Atributo no encontrado.</p>`;
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
            <select id="p-res">
              ${["8-bit", "16-bit", "None"]
                .map((r) => `<option value="${r}" ${r === a.resolution ? "selected" : ""}>${r}</option>`)
                .join("")}
            </select>
          </td></tr>
        </table>`;
    }
    if (selection.kind === "mode") {
      const m = findMode(selection.name);
      if (!m) return `<p class="empty">Modo no encontrado.</p>`;
      return `
        <table class="prop-grid">
          <tr><th colspan="2">Mode</th></tr>
          <tr><td class="label">Name</td><td><input id="p-mname" value="${esc(m.name)}" /></td></tr>
          <tr><td class="label">Channels</td><td><input id="p-mch" type="number" min="0" value="${m.channels}" /></td></tr>
        </table>
        <p class="empty">Usa la pestaña Channels / Created Attributes para el patch.</p>`;
    }
    if (selection.kind === "attributes") {
      return `<p class="empty">Elige atributos en el catálogo (doble clic) para añadirlos al fixture.</p>`;
    }
    if (selection.kind === "modes") {
      return `<p class="empty">Elige una plantilla de Modes en el catálogo (doble clic).</p>`;
    }
    return `<p class="empty">Selecciona un nodo en Navigation Pane.</p>`;
  }

  function renderDmxTab() {
    if (selection.kind !== "attribute") {
      return `<p class="empty">Selecciona un atributo para editar DMX Values.</p>`;
    }
    const a = findAttr(selection.id);
    if (!a) return "";
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
    if (selection.kind !== "mode") {
      return `<p class="empty">Selecciona un Mode para ver ChannelOffset.</p>`;
    }
    const m = findMode(selection.name);
    if (!m) return "";
    if (!m.includes.length) {
      return `<p class="empty">Arrastra Created Attributes al modo (o doble clic con el modo seleccionado).</p>`;
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
    return `<div class="channels-list">
      <div class="channel-row" style="font-weight:600;color:var(--muted)"><span> </span><span>Attribute</span><span>Offset</span><span>Wheel</span></div>
      ${rows}
    </div>`;
  }

  function renderWheelsTab() {
    const mode =
      selection.kind === "mode" ? findMode(selection.name) : state.modes[0];
    if (!mode) return `<p class="empty">Crea un modo primero.</p>`;
    const slots = { 1: [], 2: [], 3: [] };
    for (const inc of mode.includes) {
      const w = Number(inc.wheel);
      const page = w >= 1 && w <= 3 ? w : ((w - 1) % 3) + 1;
      if (!slots[page]) slots[page] = [];
      slots[page].push(inc.id);
    }
    return `<div class="wheel-board">
      ${[1, 2, 3]
        .map(
          (n) => `<div class="wheel-slot"><h4>Wheel ${n} (page)</h4>${
            (slots[n] || []).map((id) => `<span class="wheel-chip">${esc(id)}</span>`).join("") ||
            '<span class="empty">vacío</span>'
          }</div>`
        )
        .join("")}
    </div>
    <p class="empty">Modo: ${esc(mode.name)}. Mapeo simplificado (réplica MVP).</p>`;
  }

  function renderLocateTab() {
    if (!state.attributes.length) return `<p class="empty">Sin atributos.</p>`;
    const rows = state.attributes
      .map(
        (a) => `
      <tr>
        <td>${esc(a.name)}</td>
        <td><input data-loc-id="${esc(a.id)}" value="${esc(a.locate)}" /></td>
      </tr>`
      )
      .join("");
    return `<table class="dmx-table"><thead><tr><th>Attribute</th><th>Locate (fn:percent)</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function bindPropsHandlers() {
    const syncFixtureFields = () => {
      const man = document.getElementById("p-man");
      const name = document.getElementById("p-name");
      const short = document.getElementById("p-short");
      if (man) state.manufacturer = man.value;
      if (name) {
        state.name = name.value;
        if (short && !short.dataset.touched) {
          state.shortName = state.name.slice(0, 10);
          short.value = state.shortName;
        }
      }
      if (short) state.shortName = short.value.slice(0, 10);
      renderTree();
      updateTitle();
    };
    ["p-man", "p-name", "p-short"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        if (id === "p-short") el.dataset.touched = "1";
        syncFixtureFields();
      });
      el.addEventListener("change", syncFixtureFields);
    });
    const aid = document.getElementById("p-aid");
    if (aid && selection.kind === "attribute") {
      const oldId = selection.id;
      aid.addEventListener("change", () => {
        const attr = findAttr(oldId);
        if (!attr) return;
        const neu = aid.value.trim();
        if (!neu || state.attributes.some((a) => a.id === neu && a !== attr)) {
          setStatus("ID inválido o duplicado.");
          aid.value = oldId;
          return;
        }
        attr.id = neu;
        for (const m of state.modes) {
          for (const inc of m.includes) if (inc.id === oldId) inc.id = neu;
        }
        selection = { kind: "attribute", id: neu };
        render();
      });
    }
    const aname = document.getElementById("p-aname");
    if (aname && selection.kind === "attribute") {
      aname.addEventListener("change", () => {
        const attr = findAttr(selection.id);
        if (attr) {
          attr.name = aname.value;
          renderTree();
        }
      });
    }
    const group = document.getElementById("p-group");
    if (group && selection.kind === "attribute") {
      group.addEventListener("change", () => {
        const attr = findAttr(selection.id);
        if (attr) attr.group = group.value;
      });
    }
    const res = document.getElementById("p-res");
    if (res && selection.kind === "attribute") {
      res.addEventListener("change", () => {
        const attr = findAttr(selection.id);
        if (attr) attr.resolution = res.value;
      });
    }
    const mname = document.getElementById("p-mname");
    if (mname && selection.kind === "mode") {
      const old = selection.name;
      mname.addEventListener("change", () => {
        const mode = findMode(old);
        if (!mode) return;
        mode.name = mname.value;
        selection = { kind: "mode", name: mode.name };
        render();
      });
    }
    const mch = document.getElementById("p-mch");
    if (mch && selection.kind === "mode") {
      mch.addEventListener("change", () => {
        const mode = findMode(selection.name);
        if (mode) mode.channels = Number(mch.value) || 0;
      });
    }

    document.querySelectorAll("[data-dmx-i]").forEach((input) => {
      input.addEventListener("change", () => {
        const attr = findAttr(selection.id);
        if (!attr) return;
        const i = Number(input.dataset.dmxI);
        const fn = attr.functions[i];
        if (!fn) return;
        const field = input.dataset.f;
        if (field === "name") fn.name = input.value;
        if (field === "display") fn.display = input.value;
        if (field === "start" || field === "end") {
          const start = document.querySelector(`[data-dmx-i="${i}"][data-f="start"]`)?.value || "0";
          const end = document.querySelector(`[data-dmx-i="${i}"][data-f="end"]`)?.value || "255";
          fn.dmx = `${start}~${end}`;
        }
      });
    });

    document.getElementById("btn-add-fn")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr) return;
      attr.functions.push({
        id: String(attr.functions.length + 1),
        name: "Raw DMX",
        dmx: "0~255",
        display: "'Raw DMX %.f',0~255",
      });
      renderProps();
      bindPropsHandlers();
    });
    document.getElementById("btn-del-fn")?.addEventListener("click", () => {
      const attr = findAttr(selection.id);
      if (!attr || !attr.functions.length) return;
      attr.functions.pop();
      renderProps();
      bindPropsHandlers();
    });

    document.querySelectorAll("[data-ch-i]").forEach((input) => {
      input.addEventListener("change", () => {
        const mode = findMode(selection.name);
        if (!mode) return;
        const i = Number(input.dataset.chI);
        const inc = mode.includes[i];
        if (!inc) return;
        if (input.dataset.f === "offset") inc.channelOffset = input.value;
        if (input.dataset.f === "wheel") inc.wheel = input.value;
        renderTree();
      });
    });

    document.querySelectorAll("[data-loc-id]").forEach((input) => {
      input.addEventListener("change", () => {
        const attr = findAttr(input.dataset.locId);
        if (attr) attr.locate = input.value;
      });
    });
  }

  function updateTitle() {
    document.getElementById("title-fixture").textContent = `${state.manufacturer} — ${state.name}`;
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
    if (kind === "fixture" || kind === "meta") selection = { kind: "fixture" };
    else if (kind === "attributes") {
      selection = { kind: "attributes" };
      catalogTab = "attributes";
    } else if (kind === "attribute") selection = { kind: "attribute", id: node.dataset.id };
    else if (kind === "modes") {
      selection = { kind: "modes" };
      catalogTab = "modes";
    } else if (kind === "mode") selection = { kind: "mode", name: node.dataset.name };
    else if (kind === "mode-attr") selection = { kind: "attribute", id: node.dataset.id };
    else if (kind === "macros" || kind === "palettes") {
      setStatus(`${kind}: pendiente en MVP (réplica).`);
      return;
    }
    if (kind === "attribute") propsTab = "properties";
    if (kind === "mode") propsTab = "channels";
    render();
  }

  function activateCatalogItem(item) {
    if (!item) return;
    if (item.dataset.type === "attr") {
      const cat = ATTR_CATALOG.find((a) => a.id === item.dataset.id);
      if (cat) addAttributeFromCatalog(cat);
    } else if (item.dataset.type === "func") {
      addFunctionToSelected(FUNC_CATALOG[Number(item.dataset.index)]);
    } else if (item.dataset.type === "mode-tpl") {
      addModeFromTemplate(MODE_TEMPLATES[Number(item.dataset.index)]);
    } else if (item.dataset.type === "created") {
      addAttrToSelectedMode(item.dataset.id);
    }
  }

  function onCatalogActivate(e) {
    const item = e.target.closest(".catalog-item");
    if (!item) return;
    // Prefer explicit add control; otherwise dblclick / Enter
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
    document.getElementById("btn-import").addEventListener("click", () => {
      document.getElementById("file-import").click();
    });
    document.getElementById("file-import").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) importD4(file);
      e.target.value = "";
    });

    document.getElementById("catalog-body").addEventListener("dragstart", (e) => {
      const item = e.target.closest(".catalog-item");
      if (!item) return;
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: item.dataset.type,
          id: item.dataset.id,
          index: item.dataset.index,
        })
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

  // Demo seed matching Quick Start spirit
  function seedDemo() {
    state = createEmptyFixture();
    state.manufacturer = "Avo";
    state.name = "1200 Wash";
    state.shortName = "1200 Wash";
    selection = { kind: "fixture" };
  }

  seedDemo();
  wire();
  render();
})();
