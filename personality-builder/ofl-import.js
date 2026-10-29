(() => {
  "use strict";

  /**
   * Open Fixture Library (OFL) JSON → fixture model.
   * Multi-brand libraries published as fixture.json (Chauvet, Martin, generic, …).
   */

  const NAME_MAP = [
    [/^dimmer$/i, "Dimmer", "I"],
    [/^intensity$/i, "Dimmer", "I"],
    [/^shutter|^strobe/i, "Shutter", "I"],
    [/^pan$/i, "Pan", "P"],
    [/^tilt$/i, "Tilt", "P"],
    [/^red$/i, "Red", "C"],
    [/^green$/i, "Green", "C"],
    [/^blue$/i, "Blue", "C"],
    [/^white$/i, "White", "C"],
    [/^amber$/i, "Amber", "C"],
    [/^uv$|^ultraviolet$/i, "UV", "C"],
    [/^cyan$/i, "Cyan", "C"],
    [/^magenta$/i, "Magenta", "C"],
    [/^yellow$/i, "Yellow", "C"],
    [/^cold.?white|^cw$/i, "ColdWhite", "C"],
    [/^warm.?white|^ww$/i, "WarmWhite", "C"],
    [/^color.?macro/i, "Colour_Macro", "C"],
    [/^cto$|color.?temp|ctc/i, "CTO", "C"],
    [/^zoom$/i, "Zoom", "B"],
    [/^focus$/i, "Focus", "B"],
    [/^iris$/i, "Iris", "B"],
    [/^frost$/i, "Frost", "B"],
    [/^prism/i, "Prism", "B"],
    [/^gobo.?1.*rot/i, "Gobo1Rot", "G"],
    [/^gobo.?1/i, "Gobo1", "G"],
    [/^gobo.?2.*rot/i, "Gobo2Rot", "G"],
    [/^gobo.?2/i, "Gobo2", "G"],
    [/^control|fixture.?global|lamp.?control/i, "Control", "S"],
    [/^dimmer.?speed$/i, "DimmerSpeed", "S"],
    [/^program.?speed$|^speed$/i, "Speed", "S"],
    [/^auto(\s|$)|^auto.?programs?$/i, "Effect", "E"],
    [/^sound/i, "Sound", "S"],
  ];

  const COLOR_RGB = {
    Red: "255,0,0",
    Green: "0,255,0",
    Blue: "0,0,255",
    White: "255,255,255",
    Amber: "255,180,0",
    Cyan: "0,255,255",
    Magenta: "255,0,255",
    Yellow: "255,255,0",
    UV: "80,0,255",
    ColdWhite: "200,220,255",
    WarmWhite: "255,240,200",
  };

  function isOflFixture(obj) {
    if (!obj || typeof obj !== "object") return false;
    if (obj.$schema && /fixture\.json/i.test(String(obj.$schema))) return true;
    return !!(obj.availableChannels && Array.isArray(obj.modes));
  }

  function mapId(channelName, used) {
    const raw = String(channelName || "Generic").trim();
    let base = "Generic";
    let group = "S";
    for (const [re, id, g] of NAME_MAP) {
      if (re.test(raw)) {
        base = id;
        group = g;
        break;
      }
    }
    if (base === "Generic") {
      base = raw.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "Generic";
      if (/^[0-9]/.test(base)) base = `A_${base}`;
    }
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}${n++}`;
    used.add(id);
    return { id, group, name: raw };
  }

  function capabilityLabel(cap) {
    if (!cap || typeof cap !== "object") return "Raw DMX";
    if (cap.comment) return String(cap.comment);
    const type = cap.type || "";
    switch (type) {
      case "Intensity":
        return "Dimmer";
      case "ColorIntensity":
        return cap.color || "Color";
      case "ColorPreset":
        return cap.comment || cap.colors?.[0] || "Color Preset";
      case "ShutterStrobe":
        return cap.shutterEffect || "Strobe";
      case "Pan":
        return "Pan";
      case "Tilt":
        return "Tilt";
      case "Zoom":
        return "Zoom";
      case "Focus":
        return "Focus";
      case "Iris":
        return "Iris";
      case "Frost":
        return "Frost";
      case "Prism":
        return cap.comment || "Prism";
      case "WheelSlot":
        return cap.slotNumber != null ? `Slot ${cap.slotNumber}` : cap.comment || "Wheel";
      case "WheelRotation":
        return cap.wheelDirection === "CCW" ? "Rotate CCW" : "Rotate CW";
      case "Effect":
        return cap.effectName || cap.comment || "Effect";
      case "Speed":
        return "Speed";
      case "SoundSensitivity":
        return "Sound";
      case "Maintenance":
        return cap.comment || "Maintenance";
      case "NoFunction":
        return "No Function";
      default:
        return cap.comment || type || "Function";
    }
  }

  function capabilityColour(cap, attrId) {
    if (cap?.type === "ColorIntensity" && cap.color && COLOR_RGB[cap.color]) return COLOR_RGB[cap.color];
    if (COLOR_RGB[attrId]) return COLOR_RGB[attrId];
    return undefined;
  }

  function channelDefFunctions(chDef, attrId) {
    if (!chDef || typeof chDef !== "object") {
      return [{ id: "1", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255" }];
    }
    if (chDef.capability) {
      const name = capabilityLabel(chDef.capability);
      const colour = capabilityColour(chDef.capability, attrId);
      return [
        {
          id: "1",
          name,
          dmx: "0~255",
          display: name === "Dimmer" ? "'%.1f%%',0.0~100.0" : name,
          colour,
        },
      ];
    }
    const caps = Array.isArray(chDef.capabilities) ? chDef.capabilities : [];
    if (!caps.length) {
      return [{ id: "1", name: "Raw DMX", dmx: "0~255", display: "'Raw DMX %.f',0~255" }];
    }
    return caps.map((cap, i) => {
      const range = Array.isArray(cap.dmxRange) ? cap.dmxRange : [0, 255];
      const start = Number(range[0]) || 0;
      const end = Number(range[1]) || 255;
      const name = capabilityLabel(cap);
      const colour = capabilityColour(cap, attrId);
      return {
        id: String(i + 1),
        name,
        dmx: `${start}~${end}`,
        display: name,
        colour,
      };
    });
  }

  function buildFineAliasIndex(availableChannels) {
    /** fineName → coarseName */
    const fineToCoarse = new Map();
    for (const [coarse, def] of Object.entries(availableChannels || {})) {
      const aliases = def?.fineChannelAliases;
      if (!Array.isArray(aliases)) continue;
      for (const a of aliases) fineToCoarse.set(String(a), coarse);
    }
    return fineToCoarse;
  }

  function manufacturerFromMeta(ofl, opts = {}) {
    if (opts.manufacturer) return opts.manufacturer;
    if (ofl.manufacturerKey) return ofl.manufacturerKey;
    if (typeof ofl.manufacturer === "string") return ofl.manufacturer;
    // filename hint: OFL_chauvet-dj_slimpar-….json or fixtures/chauvet-dj/…
    if (opts.fileName) {
      const fn = String(opts.fileName);
      const ofl = fn.match(/^OFL_([A-Za-z0-9-]+)_/i);
      if (ofl) return ofl[1].replace(/-/g, " ");
      const pathMan = fn.match(/fixtures\/([^/]+)\//i);
      if (pathMan) return pathMan[1].replace(/-/g, " ");
    }
    return "";
  }

  function fixtureFromOfl(ofl, opts = {}) {
    if (!isOflFixture(ofl)) throw new Error("JSON no es un fixture OFL (availableChannels + modes)");

    const available = ofl.availableChannels || {};
    const fineToCoarse = buildFineAliasIndex(available);
    const usedIds = new Set();
    const attrByCoarse = new Map(); // coarse channel name → attr

    function ensureAttr(coarseName) {
      if (attrByCoarse.has(coarseName)) return attrByCoarse.get(coarseName);
      const mapped = mapId(coarseName, usedIds);
      const def = available[coarseName] || {};
      const attr = {
        id: mapped.id,
        name: mapped.name,
        group: mapped.group,
        bank: "",
        page: "1",
        wheel: mapped.group === "I" ? "Dimmer" : mapped.group === "P" ? mapped.id : "Wheel 1",
        resolution: "8-bit",
        functions: channelDefFunctions(def, mapped.id),
        locate: "1:100",
        powerOn: mapped.id === "Dimmer" ? "1:0" : "1:100",
        oflChannel: coarseName,
      };
      // Highlight/Lowlight defaults for colour wheels when Blue/Yellow exist — set later
      attrByCoarse.set(coarseName, attr);
      return attr;
    }

    const modes = [];
    for (const mode of ofl.modes || []) {
      const includes = [];
      /** coarseName → list of DMX offsets in this mode */
      const offsetsByCoarse = new Map();
      let dmxIndex = 0;

      for (const entry of mode.channels || []) {
        dmxIndex += 1;
        if (entry == null || entry === "") continue;
        // OFL matrix / duplicate channel objects — keep string names
        let chName = entry;
        if (typeof entry === "object") {
          chName = entry.insert || entry.name || JSON.stringify(entry);
        }
        chName = String(chName);
        const coarse = fineToCoarse.get(chName) || chName;
        // If it's a fine alias not listed under availableChannels keys, still bind to coarse
        if (!available[coarse] && !fineToCoarse.has(chName) && !available[chName]) {
          // unknown channel — create anyway
        }
        const attr = ensureAttr(coarse);
        if (!offsetsByCoarse.has(coarse)) offsetsByCoarse.set(coarse, []);
        offsetsByCoarse.get(coarse).push(dmxIndex);
        if (offsetsByCoarse.get(coarse).length >= 2) attr.resolution = "16-bit";
      }

      for (const [coarse, offs] of offsetsByCoarse) {
        const attr = attrByCoarse.get(coarse);
        if (!attr) continue;
        // Prefer coarse+fine as "1,2" style; if >2 keep all
        const channelOffset = offs.join(",");
        if (!includes.some((i) => i.id === attr.id)) {
          includes.push({
            id: attr.id,
            channelOffset,
            wheel: "",
            virtualControl: "",
          });
        }
      }

      const maxCh = (mode.channels || []).length;
      modes.push({
        name: mode.name || `Mode ${modes.length + 1}`,
        id: "",
        channels: Number(mode.shortName) || maxCh || includes.length,
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

    // Ensure every available channel referenced exists even if unused in modes
    for (const coarse of Object.keys(available)) {
      ensureAttr(coarse);
    }

    const attributes = [...attrByCoarse.values()];
    // Colour wheel locate helpers
    for (const a of attributes) {
      if (a.id === "Colour1" || /^Colour\d*$/i.test(a.id)) {
        const yellow = a.functions.findIndex((f) => /yellow/i.test(f.name));
        const blue = a.functions.findIndex((f) => /^blue$/i.test(f.name) || f.name === "Blue");
        if (yellow >= 0) a.highlight = String(yellow + 1);
        if (blue >= 0) a.lowlight = String(blue + 1);
      }
    }

    const man = manufacturerFromMeta(ofl, opts);
    const name = ofl.name || opts.name || "OFL Fixture";
    const cats = Array.isArray(ofl.categories) ? ofl.categories.join(", ") : "";

    return {
      manufacturer: man,
      name,
      shortName: (ofl.shortName || name).slice(0, 10),
      personalityVersion: "0",
      tags: ["ofl-import", cats].filter(Boolean).join(" · ").slice(0, 120),
      updateVersionOnDirty: true,
      attributes,
      modes,
      _source: "ofl",
    };
  }

  function parseOflJson(text, opts = {}) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("JSON inválido");
    }
    // OFL sometimes wraps as { "manufacturer/fixture": {…} } in exports — unwrap single root
    if (!isOflFixture(data) && data && typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length === 1 && isOflFixture(data[keys[0]])) {
        const key = keys[0];
        const man = key.includes("/") ? key.split("/")[0] : opts.manufacturer;
        return fixtureFromOfl(data[key], { ...opts, manufacturer: man || opts.manufacturer });
      }
    }
    return fixtureFromOfl(data, opts);
  }

  window.PB_IMPORT = Object.assign(window.PB_IMPORT || {}, {
    isOflFixture,
    fixtureFromOfl,
    parseOflJson,
  });
})();
