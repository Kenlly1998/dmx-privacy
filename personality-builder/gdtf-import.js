(() => {
  "use strict";

  /**
   * GDTF / MVR → fixture model for the Personality Builder replica.
   * Depends on global JSZip. Does not export .gdtf/.mvr — only import → internal state → .d4.
   */

  const GDTF_ATTR_MAP = [
    [/^dimmer$/i, "Dimmer", "I"],
    [/^shutter|^strobe/i, "Shutter", "I"],
    [/^pan$/i, "Pan", "P"],
    [/^tilt$/i, "Tilt", "P"],
    [/coloradd_r|colorrgb_r|^red$/i, "Red", "C"],
    [/coloradd_g|colorrgb_g|^green$/i, "Green", "C"],
    [/coloradd_b|colorrgb_b|^blue$/i, "Blue", "C"],
    [/coloradd_w|colorrgb_w|^white$/i, "White", "C"],
    [/coloradd_a|amber/i, "Amber", "C"],
    [/colosub_c|cyan/i, "Cyan", "C"],
    [/colosub_m|magenta/i, "Magenta", "C"],
    [/colosub_y|yellow/i, "Yellow", "C"],
    [/^cto$|colortemp|ctc/i, "CTO", "C"],
    [/^zoom$/i, "Zoom", "B"],
    [/^focus$/i, "Focus", "B"],
    [/^iris$/i, "Iris", "B"],
    [/^frost$/i, "Frost", "B"],
    [/^prism/i, "Prism", "B"],
    [/^gobo1rot|^gobo1_pos/i, "Gobo1Rot", "G"],
    [/^gobo1/i, "Gobo1", "G"],
    [/^gobo2rot|^gobo2_pos/i, "Gobo2Rot", "G"],
    [/^gobo2/i, "Gobo2", "G"],
    [/^control|^fixture.?global/i, "Control", "S"],
  ];

  function parseXml(text) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("XML inválido");
    }
    return doc;
  }

  function parseDmxValue(raw) {
    if (raw == null || raw === "") return null;
    const s = String(raw).trim();
    const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return { value: Number(m[1]), bytes: Number(m[2]) || 1 };
    if (/^\d+$/.test(s)) return { value: Number(s), bytes: 1 };
    return null;
  }

  function maxForBytes(bytes) {
    const b = Math.max(1, Number(bytes) || 1);
    return b >= 2 ? 65535 : 255;
  }

  function mapAttrId(gdtfName, used) {
    const name = String(gdtfName || "Generic").trim();
    let base = "Generic";
    let group = "S";
    for (const [re, id, g] of GDTF_ATTR_MAP) {
      if (re.test(name)) {
        base = id;
        group = g;
        break;
      }
    }
    if (base === "Generic") {
      base = name.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "Generic";
      if (/^[0-9]/.test(base)) base = `A_${base}`;
    }
    let id = base;
    let n = 2;
    while (used.has(id)) {
      id = `${base}${n++}`;
    }
    used.add(id);
    return { id, group, pretty: name };
  }

  function channelSetsToFunctions(channelFunctionEl, bytes) {
    const sets = [...channelFunctionEl.querySelectorAll(":scope > ChannelSet")];
    const fnName = channelFunctionEl.getAttribute("Name") || channelFunctionEl.getAttribute("Attribute") || "Function";
    const max = maxForBytes(bytes);
    if (!sets.length) {
      const from = parseDmxValue(channelFunctionEl.getAttribute("DMXFrom")) || { value: 0, bytes };
      return [
        {
          id: "1",
          name: fnName,
          dmx: `${from.value}~${max}`,
          display: fnName,
        },
      ];
    }
    const parsed = sets.map((el, i) => {
      const from = parseDmxValue(el.getAttribute("DMXFrom")) || { value: 0, bytes };
      return {
        el,
        i,
        from: from.value,
        name: el.getAttribute("Name") || `${fnName} ${i + 1}`,
      };
    });
    parsed.sort((a, b) => a.from - b.from);
    return parsed.map((p, idx) => {
      const next = parsed[idx + 1];
      const end = next ? Math.max(p.from, next.from - 1) : max;
      return {
        id: String(idx + 1),
        name: p.name,
        dmx: `${p.from}~${end}`,
        display: p.name,
      };
    });
  }

  function guessColour(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("red") || n === "r") return "255,0,0";
    if (n.includes("green") || n === "g") return "0,255,0";
    if (n.includes("blue") || n === "b") return "0,0,255";
    if (n.includes("white") || n === "w") return "255,255,255";
    if (n.includes("amber")) return "255,180,0";
    if (n.includes("open")) return "255,255,255";
    return undefined;
  }

  /**
   * @returns fixture-shaped object (manufacturer, name, attributes, modes, …)
   */
  function fixtureFromGdtfDoc(doc, opts = {}) {
    const ft =
      doc.querySelector("FixtureType") ||
      doc.querySelector("GDTF > FixtureType") ||
      doc.documentElement;
    if (!ft || ft.localName === "parsererror") {
      throw new Error("GDTF sin FixtureType");
    }

    const manufacturer =
      ft.getAttribute("Manufacturer") ||
      ft.getAttribute("ManufacturerName") ||
      opts.manufacturer ||
      "";
    const name = ft.getAttribute("Name") || opts.name || "GDTF Fixture";
    const shortName = (ft.getAttribute("ShortName") || name).slice(0, 10);

    const attrUsed = new Set();
    const attrByGdtf = new Map(); // gdtf attribute name → our attr
    const attributes = [];

    function ensureAttr(gdtfAttrName) {
      const key = String(gdtfAttrName || "").trim();
      if (!key) return null;
      if (attrByGdtf.has(key)) return attrByGdtf.get(key);
      const mapped = mapAttrId(key, attrUsed);
      const pretty =
        [...doc.querySelectorAll("AttributeDefinitions Attribute")].find(
          (a) => a.getAttribute("Name") === key
        )?.getAttribute("Pretty") || mapped.pretty;
      const attr = {
        id: mapped.id,
        name: pretty || mapped.id,
        group: mapped.group,
        bank: "",
        page: "1",
        wheel: mapped.group === "I" ? "Dimmer" : mapped.group === "P" ? mapped.id : "Wheel 1",
        resolution: "8-bit",
        functions: [],
        locate: "1:100",
        powerOn: mapped.id === "Dimmer" ? "1:0" : "1:100",
        gdtfName: key,
      };
      attributes.push(attr);
      attrByGdtf.set(key, attr);
      return attr;
    }

    const modes = [];
    const modeEls = [...doc.querySelectorAll("DMXModes > DMXMode")];
    for (const modeEl of modeEls) {
      const modeName = modeEl.getAttribute("Name") || `Mode ${modes.length + 1}`;
      const includes = [];
      let maxOffset = 0;

      for (const chEl of modeEl.querySelectorAll(":scope > DMXChannels > DMXChannel")) {
        const offsetRaw = chEl.getAttribute("Offset") || "";
        const offsets = String(offsetRaw)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^\d+$/.test(s));
        if (!offsets.length) continue;
        const channelOffset = offsets.join(",");
        const bytes = offsets.length >= 2 ? 2 : 1;
        for (const o of offsets) maxOffset = Math.max(maxOffset, Number(o));

        const logical =
          chEl.querySelector(":scope > LogicalChannel") ||
          chEl.querySelector("LogicalChannel");
        const gdtfAttr =
          logical?.getAttribute("Attribute") ||
          chEl.querySelector("ChannelFunction")?.getAttribute("Attribute") ||
          "";
        const attr = ensureAttr(gdtfAttr);
        if (!attr) continue;
        if (bytes >= 2) attr.resolution = "16-bit";

        const fnEls = [...chEl.querySelectorAll("ChannelFunction")];
        if (fnEls.length && !attr.functions.length) {
          const merged = [];
          for (const fnEl of fnEls) {
            const part = channelSetsToFunctions(fnEl, bytes);
            for (const f of part) {
              const colour = guessColour(f.name) || guessColour(attr.id);
              if (colour) f.colour = colour;
              merged.push({ ...f, id: String(merged.length + 1) });
            }
          }
          attr.functions = merged.length
            ? merged
            : [
                {
                  id: "1",
                  name: attr.name,
                  dmx: `0~${maxForBytes(bytes)}`,
                  display: `'%.1f%%',0.0~100.0`,
                  colour: guessColour(attr.id),
                },
              ];
        }

        if (!includes.some((i) => i.id === attr.id)) {
          includes.push({
            id: attr.id,
            channelOffset,
            wheel: "",
            virtualControl: "",
          });
        }
      }

      for (const attr of attributes) {
        if (!attr.functions.length) {
          const max = attr.resolution === "16-bit" ? 65535 : 255;
          attr.functions = [
            {
              id: "1",
              name: attr.name,
              dmx: `0~${max}`,
              display: `'%.1f%%',0.0~100.0`,
              colour: guessColour(attr.id),
            },
          ];
        }
      }

      modes.push({
        name: modeName,
        id: "",
        channels: maxOffset || includes.length,
        includes,
        cells: {
          rows: 1,
          cols: 4,
          channelsPerCell: 3,
          startOffset: 1,
          order: "row-ltr",
          modeLink: "",
          masterIds: [],
          customOrder: [],
          cells: [],
        },
        hidden: false,
      });
    }

    return {
      manufacturer,
      name,
      shortName,
      personalityVersion: "0",
      tags: "gdtf-import",
      updateVersionOnDirty: true,
      attributes,
      modes,
      _source: "gdtf",
    };
  }

  async function readZip(buf) {
    if (typeof JSZip === "undefined") throw new Error("JSZip no cargado");
    return JSZip.loadAsync(buf);
  }

  function findDescriptionPath(zip) {
    const names = Object.keys(zip.files);
    const exact = names.find((n) => /(^|\/)description\.xml$/i.test(n) && !zip.files[n].dir);
    if (exact) return exact;
    return names.find((n) => /\.xml$/i.test(n) && !zip.files[n].dir && /gdtf|fixture/i.test(n));
  }

  async function importGdtfArrayBuffer(buf, opts = {}) {
    const zip = await readZip(buf);
    const path = findDescriptionPath(zip);
    if (!path) throw new Error("GDTF sin description.xml");
    const text = await zip.file(path).async("string");
    const doc = parseXml(text);
    return fixtureFromGdtfDoc(doc, opts);
  }

  async function importGdtfTextOrBuffer(input, opts = {}) {
    if (typeof input === "string") {
      const doc = parseXml(input);
      return fixtureFromGdtfDoc(doc, opts);
    }
    return importGdtfArrayBuffer(input, opts);
  }

  /**
   * List embedded GDTF fixtures inside an MVR (zip).
   * @returns {Promise<Array<{ path: string, label: string, buffer: ArrayBuffer }>>}
   */
  async function listMvrGdtfs(buf) {
    const zip = await readZip(buf);
    const out = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      if (!/\.gdtf$/i.test(path)) continue;
      const buffer = await entry.async("arraybuffer");
      const base = path.split("/").pop().replace(/\.gdtf$/i, "");
      out.push({ path, label: base.replace(/@/g, " / "), buffer });
    }
    // Some MVRs store unpacked description.xml under fixture folders
    if (!out.length) {
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        if (!/(^|\/)description\.xml$/i.test(path)) continue;
        const text = await entry.async("string");
        // wrap as fake gdtf zip in memory
        const inner = new JSZip();
        inner.file("description.xml", text);
        const buffer = await inner.generateAsync({ type: "arraybuffer" });
        out.push({ path, label: path.replace(/\/description\.xml$/i, ""), buffer });
      }
    }
    return out;
  }

  async function importMvrArrayBuffer(buf, pickPath) {
    const list = await listMvrGdtfs(buf);
    if (!list.length) throw new Error("MVR sin fixtures GDTF embebidos");
    let chosen = list[0];
    if (pickPath) {
      chosen = list.find((f) => f.path === pickPath) || chosen;
    }
    const fixture = await importGdtfArrayBuffer(chosen.buffer, { name: chosen.label });
    fixture.tags = `mvr-import:${chosen.path}`;
    fixture._source = "mvr";
    fixture._mvrFixture = chosen.path;
    fixture._mvrChoices = list.map((f) => ({ path: f.path, label: f.label }));
    return fixture;
  }

  window.PB_IMPORT = {
    fixtureFromGdtfDoc,
    importGdtfArrayBuffer,
    importGdtfTextOrBuffer,
    listMvrGdtfs,
    importMvrArrayBuffer,
    parseXml,
  };
})();
