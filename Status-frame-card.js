/*!
 * Status Frame Card v0.3.4
 * Wrapper-Karte: legt einen regelbasierten Rahmen/Glow/Animation über eine
 * beliebige andere Lovelace-Karte, ohne deren Größe zu verändern.
 * Mehrere Karten wie bei einer Stapelkarte (cards + stack), Konfiguration komplett über den Editor.
 */
const SFC_VERSION = "0.3.4";

/* Registrierung für den Kartenwähler ganz am Anfang: Der Eintrag existiert auch dann,
   wenn weiter unten etwas schiefgeht, und wird bei doppeltem Laden nicht verdoppelt. */
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "status-frame-card")) {
  window.customCards.push({
    type: "status-frame-card",
    name: "Status Frame Card",
    description: "Regelbasierter Rahmen, Glow und Animation um jede beliebige Karte.",
    preview: false,
    // Neuer Kartenwähler (HA 2026.6+): erscheint unter "Community", sobald eine passende Entität gewählt wird
    getEntitySuggestion: (hass, entityId) => {
      const domain = entityId.split(".")[0];
      const dc = hass.states[entityId]?.attributes?.device_class;
      const frame = (cards, rules) => ({
        type: "custom:status-frame-card",
        cards,
        rules,
      });

      // Variante 1: nur diese Entität
      let rule = null;
      if (["light", "switch", "input_boolean", "fan"].includes(domain))
        rule = { state: "on", color: "#ffea00", glow: 12 };
      else if (domain === "binary_sensor")
        rule = { state: "on", color: "#ff0000", animation: "pulse" };
      else if (domain === "sensor" && dc === "battery")
        rule = { below: 20, color: "#ff4d4d", glow: 12 };
      if (!rule) return null;
      const single = {
        config: frame([{ type: "tile", entity: entityId }], [{ entities: [entityId], ...rule }]),
      };

      // Variante 2: der ganze Bereich der Entität (Area-Karte mit Regeln für den Bereich)
      const ent = hass.entities?.[entityId];
      const areaId = ent?.area_id || hass.devices?.[ent?.device_id]?.area_id;
      const area = areaId ? hass.areas?.[areaId] : null;
      if (!area) return single;
      const areaCard = { type: "area", area: areaId };
      if (area.picture) areaCard.display_type = "picture";
      const areaVariant = {
        config: frame([areaCard], [
          { name: "Rauch", area: areaId, domain: "binary_sensor", device_class: "smoke", state: "on",
            color: "#ff0000", animation: "pulse", speed: 1, background: "rgba(255,0,0,.2)" },
          { name: "Batterie leer", area: areaId, domain: "sensor", device_class: "battery", below: 10,
            color: "#ff0000", animation: "pulse" },
          { name: "Batterie schwach", area: areaId, domain: "sensor", device_class: "battery", below: 20,
            color: "#ff4d4d", glow: 12 },
          { name: "Licht an", area: areaId, domain: "light", state: "on", color: "#ffea00", glow: 12 },
        ]),
      };
      return [
        { ...single, label: "Entität" },
        { ...areaVariant, label: "Bereich " + (area.name || areaId) },
      ];
    },
    documentationURL: "https://github.com/ManueltheMighty/Status-frame-card",
  });
}

const has = (v) =>
  v !== undefined && v !== null && v !== "" && !(typeof v === "number" && isNaN(v));

const clean = (o) => {
  const r = {};
  for (const [k, v] of Object.entries(o || {})) {
    if (!has(v)) continue;
    if (Array.isArray(v) && !v.length) continue;
    r[k] = v;
  }
  return r;
};

/* ------------------------------------------------------------------ */
/* Karte                                                               */
/* ------------------------------------------------------------------ */

class StatusFrameCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("status-frame-card-editor");
  }

  static getStubConfig() {
    return {
      cards: [{ type: "markdown", content: "Umschlossene Karten im Editor ersetzen" }],
      rules: [{ domain: "light", state: "on", color: "#ffea00", glow: 12 }],
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    this._config = config;
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML = `
        <style>
          :host { display:block; }
          #wrap { position:relative; border-radius:var(--ha-card-border-radius,12px); }
          #fx { position:absolute; inset:0; border-radius:inherit; pointer-events:none;
                z-index:1; transition:border-color .3s ease, background .3s ease, box-shadow .3s ease;
                box-sizing:border-box; }
          .ph { padding:16px; color:var(--secondary-text-color); text-align:center;
                border:1px dashed var(--divider-color); border-radius:inherit; }
          @keyframes pulse   { 0%{box-shadow:0 0 0 0 var(--c)} 70%{box-shadow:0 0 0 12px transparent} 100%{box-shadow:0 0 0 0 transparent} }
          @keyframes blink   { 0%,49%{opacity:1} 50%,100%{opacity:.1} }
          @keyframes glow    { 0%,100%{box-shadow:0 0 6px var(--c)} 50%{box-shadow:0 0 18px var(--c)} }
          @keyframes breathe { 0%,100%{opacity:1} 50%{opacity:.35} }
        </style>
        <div id="wrap"><div id="fx"></div></div>`;
    }
    const key = JSON.stringify([this._cards(config), config.stack || "vertical"]);
    if (key !== this._cardKey) {
      this._cardKey = key;
      this._buildInner(key);
    }
    this._update();
  }

  _cards(config) {
    if (Array.isArray(config.cards)) return config.cards;
    return config.card ? [config.card] : []; // Abwärtskompatibel zu v0.2
  }

  async _buildInner(key) {
    const wrap = this._root.getElementById("wrap");
    if (this._inner) {
      this._inner.remove();
      this._inner = null;
    }
    const cards = this._cards(this._config);
    if (!cards.length || !cards[0].type) {
      const ph = document.createElement("div");
      ph.className = "ph";
      ph.textContent = "Status Frame Card: bitte Karten wählen";
      this._inner = ph;
      wrap.prepend(ph);
      return;
    }
    const helpers = await window.loadCardHelpers();
    if (key !== this._cardKey) return; // inzwischen veraltet
    const cfg =
      cards.length === 1
        ? cards[0]
        : { type: this._config.stack === "horizontal" ? "horizontal-stack" : "vertical-stack", cards };
    const el = helpers.createCardElement(cfg);
    if (this._hass) el.hass = this._hass;
    this._inner = el;
    wrap.prepend(el);
  }

  set hass(hass) {
    this._hass = hass;
    if (this._inner && "hass" in this._inner) this._inner.hass = hass;
    this._update();
  }

  /* Entitäten, die zu einer Regel gehören */
  _ids(rule) {
    const h = this._hass;
    const exclude = new Set([].concat(rule.exclude || []));
    const out = new Set();
    if (rule.area || rule.domain || rule.device_class) {
      for (const id of Object.keys(h.states)) {
        if (rule.domain && !id.startsWith(rule.domain + ".")) continue;
        if (rule.device_class && h.states[id].attributes.device_class !== rule.device_class) continue;
        if (rule.area) {
          const e = h.entities?.[id];
          const area = e?.area_id || h.devices?.[e?.device_id]?.area_id;
          if (area !== rule.area) continue;
        }
        out.add(id);
      }
    }
    for (const id of [].concat(rule.entities || [])) out.add(id);
    return [...out].filter((id) => !exclude.has(id));
  }

  _match(rule, id) {
    const s = this._hass.states[id];
    if (!s) return false;
    const v = has(rule.attribute) ? s.attributes[rule.attribute] : s.state;
    if (has(rule.state)) {
      const wanted = String(rule.state).split(",").map((x) => x.trim());
      if (!wanted.includes(String(v))) return false;
    }
    if (has(rule.above) && !(parseFloat(v) > Number(rule.above))) return false;
    if (has(rule.below) && !(parseFloat(v) < Number(rule.below))) return false;
    return true;
  }

  _ruleHit(rule) {
    const ids = this._ids(rule);
    if (!ids.length) return false;
    return rule.match === "all"
      ? ids.every((id) => this._match(rule, id))
      : ids.some((id) => this._match(rule, id));
  }

  _update() {
    const fx = this._root?.getElementById("fx");
    if (!fx || !this._hass || !this._config) return;
    const hit = (this._config.rules || []).find((r) => this._ruleHit(r)); // erste gewinnt
    fx.style.setProperty("--c", hit ? hit.color || "var(--primary-color)" : "transparent");
    fx.style.border = hit
      ? `${has(hit.width) ? hit.width : 2}px solid var(--c)`
      : this._config.default_border || "none";
    fx.style.boxShadow = hit && Number(hit.glow) > 0 ? `0 0 ${hit.glow}px var(--c)` : "none";
    const anim = hit && hit.animation && hit.animation !== "none" ? hit.animation : null;
    fx.style.animation = anim ? `${anim} ${has(hit.speed) ? hit.speed : 1.5}s infinite` : "none";
    fx.style.background = hit?.background || "none";
  }

  getCardSize() {
    return this._inner?.getCardSize?.() || 3;
  }
  getGridOptions() {
    return this._inner?.getGridOptions?.() || {};
  }
  getLayoutOptions() {
    return this._inner?.getLayoutOptions?.() || {};
  }
}
if (!customElements.get("status-frame-card")) customElements.define("status-frame-card", StatusFrameCard);

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

const LABELS = {
  name: "Bezeichnung (optional)",
  area: "Bereich",
  domain: "Domain",
  device_class: "Geräteklasse",
  entities: "Einzelne Entitäten",
  exclude: "Entitäten ausschließen",
  state: "Zustand",
  attribute: "Attribut (statt Zustand)",
  above: "Wert größer als",
  below: "Wert kleiner als",
  match: "Regel gilt, wenn",
  color: "Farbe",
  width: "Rahmenbreite (px)",
  glow: "Leuchten (px)",
  animation: "Animation",
  speed: "Dauer (s)",
  background: "Hintergrund",
  default_border: "Standard-Rahmen (CSS, optional)",
  stack: "Anordnung bei mehreren Karten",
};

const HELPERS = {
  area: "Alle Entitäten dieses Bereichs, optional gefiltert durch Domain/Geräteklasse",
  entities: "Zusätzlich zum Filter oder allein",
  state: "Mehrere Werte mit Komma, z. B. on,open",
  above: "Für Zahlenwerte, z. B. Batterie",
  color: "#hex, rgba(…) oder var(--error-color)",
  background: "z. B. rgba(255,0,0,.2)",
  default_border: "z. B. 1px solid rgba(255,255,255,.1). Leer = kein Rahmen",
};

const DOMAINS = [
  "light", "switch", "binary_sensor", "sensor", "climate", "cover", "lock",
  "media_player", "person", "device_tracker", "fan", "input_boolean",
  "alarm_control_panel", "vacuum", "camera", "update",
];
const DEVICE_CLASSES = [
  "battery", "motion", "occupancy", "presence", "smoke", "gas", "carbon_monoxide",
  "moisture", "door", "window", "opening", "problem", "safety", "tamper",
  "vibration", "connectivity", "plug", "running", "temperature", "humidity", "power",
];

const NUM = { number: { mode: "box", step: "any" } };

const SCHEMA_SOURCE = [
  { name: "name", selector: { text: {} } },
  { name: "area", selector: { area: {} } },
  {
    type: "grid", name: "", schema: [
      { name: "domain", selector: { select: { options: DOMAINS, custom_value: true, mode: "dropdown" } } },
      { name: "device_class", selector: { select: { options: DEVICE_CLASSES, custom_value: true, mode: "dropdown" } } },
    ],
  },
  { name: "entities", selector: { entity: { multiple: true } } },
  { name: "exclude", selector: { entity: { multiple: true } } },
];

const SCHEMA_COND = [
  {
    type: "grid", name: "", schema: [
      { name: "state", selector: { text: {} } },
      { name: "attribute", selector: { text: {} } },
      { name: "above", selector: NUM },
      { name: "below", selector: NUM },
    ],
  },
  {
    name: "match",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "any", label: "mindestens eine Entität zutrifft" },
          { value: "all", label: "alle Entitäten zutreffen" },
        ],
      },
    },
  },
];

const SCHEMA_EFFECT = [
  { name: "color", selector: { text: {} } },
  {
    type: "grid", name: "", schema: [
      { name: "width", selector: NUM },
      { name: "glow", selector: NUM },
      {
        name: "animation",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "none", label: "Keine" },
              { value: "pulse", label: "Pulsieren" },
              { value: "blink", label: "Blinken" },
              { value: "glow", label: "Glühen" },
              { value: "breathe", label: "Atmen" },
            ],
          },
        },
      },
      { name: "speed", selector: NUM },
    ],
  },
  { name: "background", selector: { text: {} } },
];

const SCHEMA_GENERAL = [
  {
    name: "stack",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "vertical", label: "Untereinander" },
          { value: "horizontal", label: "Nebeneinander" },
        ],
      },
    },
  },
  { name: "default_border", selector: { text: {} } },
];

class StatusFrameCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    if (JSON.stringify(config) === this._lastEmitted && this._built) return; // eigene Änderung
    try {
      this._build();
    } catch (err) {
      console.error("[status-frame-card] Editor-Fehler:", err);
      this.innerHTML = `<p style="color:var(--error-color)"><b>Status Frame Card: Editor konnte nicht aufgebaut werden.</b><br>${String(
        (err && err.message) || err
      )}<br>Bitte die Browser-Konsole prüfen. Die Karte selbst läuft weiter, Konfiguration per YAML.</p>`;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.querySelectorAll("ha-form, hui-stack-card-editor").forEach((el) => (el.hass = hass));
  }
  set lovelace(l) {
    this._lovelace = l;
    this.querySelectorAll("hui-stack-card-editor").forEach((el) => (el.lovelace = l));
  }

  /* ---------- Aufbau ---------- */

  _build() {
    this._built = true;
    this._cards = this._config.cards || (this._config.card ? [this._config.card] : []);
    this._stack = this._config.stack;
    this._rules = (this._config.rules || []).map((r) => ({ ...r }));
    this._defaultBorder = this._config.default_border;
    this._openIdx = null;

    this.innerHTML = `
      <style>
        .sfc h3 { margin:16px 0 4px; font-size:1rem; }
        .sfc .hint { margin:0 0 8px; color:var(--secondary-text-color); font-size:.85rem; }
        .sfc .rule { border:1px solid var(--divider-color); border-radius:8px; margin-bottom:8px; overflow:hidden; }
        .sfc .head { display:flex; align-items:center; gap:8px; padding:6px 8px; background:var(--secondary-background-color); }
        .sfc .head .title { flex:1; background:none; border:none; color:var(--primary-text-color);
                            text-align:left; font:inherit; cursor:pointer; padding:6px 0; }
        .sfc .sw { width:32px; height:28px; padding:0; border:1px solid var(--divider-color); border-radius:6px; background:none; cursor:pointer; }
        .sfc .ib { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; padding:4px 6px; border-radius:6px; }
        .sfc .ib:hover { background:var(--divider-color); color:var(--primary-text-color); }
        .sfc .ib.del:hover { color:var(--error-color); }
        .sfc .body { display:none; padding:4px 12px 12px; }
        .sfc .rule.open .body { display:block; }
        .sfc h4 { margin:12px 0 6px; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; color:var(--secondary-text-color); }
        .sfc .btn { margin-top:4px; padding:8px 14px; border-radius:8px; border:1px solid var(--primary-color);
                    background:none; color:var(--primary-color); cursor:pointer; font:inherit; }
        .sfc .cardbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .sfc textarea { width:100%; min-height:140px; box-sizing:border-box; font-family:monospace; }
        .sfc .row { display:flex; gap:8px; align-items:center; }
        .sfc input.txt { flex:1; padding:8px; border-radius:6px; border:1px solid var(--divider-color);
                         background:var(--card-background-color); color:var(--primary-text-color); font:inherit; }
      </style>
      <div class="sfc">
        <h3>Umschlossene Karten</h3>
        <div id="cardbox"></div>
        <h3>Regeln</h3>
        <p class="hint">Reihenfolge = Priorität: die erste passende Regel gewinnt. Wichtiges nach oben.</p>
        <div id="rules"></div>
        <button class="btn" id="add">+ Regel hinzufügen</button>
        <h3>Allgemein</h3>
        <div id="general"></div>
      </div>`;

    this.querySelector("#add").addEventListener("click", () => {
      this._rules.push({ color: "#ffea00", glow: 12 });
      this._openIdx = this._rules.length - 1;
      this._renderRules();
      this._emit();
    });

    const gen = this._form(
      SCHEMA_GENERAL,
      { stack: this._stack, default_border: this._defaultBorder },
      (v) => {
        this._stack = v.stack;
        this._defaultBorder = v.default_border;
        this._emit();
      }
    );
    this.querySelector("#general").append(gen);

    this._renderCardBox();
    this._renderRules();
  }

  _form(schema, data, onChange) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.data = data;
    f.hass = this._hass;
    f.computeLabel = (s) => LABELS[s.name] || s.name;
    f.computeHelper = (s) => HELPERS[s.name] || "";
    f.addEventListener("value-changed", (e) => {
      e.stopPropagation();
      onChange(e.detail.value);
    });
    return f;
  }

  _emit() {
    const cfg = clean({
      ...this._config,
      card: undefined,
      cards: this._cards,
      stack: this._stack,
      rules: this._rules.map(clean),
      default_border: this._defaultBorder,
    });
    this._config = cfg;
    this._lastEmitted = JSON.stringify(cfg);
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true })
    );
  }

  /* ---------- Umschlossene Karten (wie bei der Stapelkarte) ---------- */

  async _renderCardBox() {
    const box = this.querySelector("#cardbox");
    box.innerHTML = "";

    // Den Editor der Stapelkarte von HA wiederverwenden (Tabs, Kartenwähler, Verschieben, Löschen)
    let ed = null;
    let why = "";
    try {
      // HA lädt Karten bei Bedarf nach: Stapelkarte einmal erzeugen, damit sie sicher registriert ist
      if (!customElements.get("hui-vertical-stack-card") && window.loadCardHelpers) {
        const helpers = await window.loadCardHelpers();
        helpers.createCardElement({ type: "vertical-stack", cards: [] });
      }
      const Stack = await Promise.race([
        customElements.whenDefined("hui-vertical-stack-card"),
        new Promise((r) => setTimeout(() => r(null), 2500)),
      ]);
      if (Stack && Stack.getConfigElement) {
        ed = await Stack.getConfigElement();
        if (ed) {
          ed.hass = this._hass;
          ed.lovelace = this._lovelace;
          ed.setConfig({ type: "vertical-stack", cards: this._cards });
        }
      } else {
        why = "Stapelkarte nicht gefunden";
      }
    } catch (err) {
      console.error("[status-frame-card] Stapel-Editor konnte nicht geladen werden:", err);
      why = String((err && err.message) || err);
      ed = null;
    }
    if (box !== this.querySelector("#cardbox")) return; // Editor wurde inzwischen neu aufgebaut

    if (ed) {
      ed.hass = this._hass;
      ed.lovelace = this._lovelace;
      ed.addEventListener("config-changed", (e) => {
        e.stopPropagation(); // sonst hält HA die Stapel-Konfig für die der Wrapper-Karte
        const c = e.detail && e.detail.config;
        if (c && Array.isArray(c.cards)) {
          this._cards = c.cards;
          this._emit();
        }
      });
      box.append(ed);
      return;
    }

    // Fallback: Kartenliste als JSON bearbeiten
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = `Der HA-Stapel-Editor ist nicht verfügbar${why ? " (" + why + ")" : ""}. Karten als JSON-Liste bearbeiten:`;
    box.append(note);
    const ta = document.createElement("textarea");
    ta.value = JSON.stringify(this._cards, null, 2);
    ta.addEventListener("change", () => {
      try {
        const v = JSON.parse(ta.value);
        if (Array.isArray(v)) {
          this._cards = v;
          this._emit();
        }
      } catch (_) { /* ungültiges JSON ignorieren */ }
    });
    box.append(ta);
  }

  /* ---------- Regeln ---------- */

  _areaName(id) {
    return this._hass?.areas?.[id]?.name || id;
  }

  _title(r, i) {
    if (r.name) return `${i + 1}. ${r.name}`;
    const p = [];
    if (r.area) p.push(this._areaName(r.area));
    if (r.domain) p.push(r.domain);
    if (r.device_class) p.push(r.device_class);
    if (r.entities && r.entities.length)
      p.push(r.entities.length === 1 ? r.entities[0] : `${r.entities.length} Entitäten`);
    let t = p.join(" · ") || "Neue Regel";
    if (has(r.state)) t += ` = ${r.state}`;
    if (has(r.below)) t += ` < ${r.below}`;
    if (has(r.above)) t += ` > ${r.above}`;
    return `${i + 1}. ${t}`;
  }

  _renderRules() {
    const list = this.querySelector("#rules");
    list.innerHTML = "";
    this._rules.forEach((_, i) => list.append(this._ruleEl(i)));
  }

  _move(i, d) {
    const j = i + d;
    if (j < 0 || j >= this._rules.length) return;
    [this._rules[i], this._rules[j]] = [this._rules[j], this._rules[i]];
    this._openIdx = j;
    this._renderRules();
    this._emit();
  }

  _ruleEl(i) {
    const el = document.createElement("div");
    el.className = "rule" + (this._openIdx === i ? " open" : "");

    const head = document.createElement("div");
    head.className = "head";

    const sw = document.createElement("input");
    sw.type = "color";
    sw.className = "sw";
    sw.title = "Farbe wählen";

    const title = document.createElement("button");
    title.className = "title";
    title.addEventListener("click", () => el.classList.toggle("open"));

    const mk = (cls, txt, tip, fn) => {
      const b = document.createElement("button");
      b.className = "ib " + cls;
      b.textContent = txt;
      b.title = tip;
      b.addEventListener("click", fn);
      return b;
    };
    head.append(
      sw,
      title,
      mk("", "▲", "Nach oben (höhere Priorität)", () => this._move(i, -1)),
      mk("", "▼", "Nach unten", () => this._move(i, 1)),
      mk("del", "✕", "Regel löschen", () => {
        this._rules.splice(i, 1);
        this._openIdx = null;
        this._renderRules();
        this._emit();
      })
    );

    const body = document.createElement("div");
    body.className = "body";
    const forms = [];

    const onChange = (v) => {
      this._rules[i] = clean(v);
      refresh();
      this._emit();
    };
    const section = (txt, schema) => {
      const h = document.createElement("h4");
      h.textContent = txt;
      const f = this._form(schema, this._rules[i], onChange);
      forms.push(f);
      body.append(h, f);
    };
    section("Quelle – welche Entitäten", SCHEMA_SOURCE);
    section("Bedingung", SCHEMA_COND);
    section("Effekt", SCHEMA_EFFECT);

    const refresh = () => {
      const r = this._rules[i];
      title.textContent = this._title(r, i);
      const c = r.color || "";
      sw.value = /^#[0-9a-f]{6}$/i.test(c) ? c : "#888888";
      sw.style.opacity = c && !/^#[0-9a-f]{6}$/i.test(c) ? ".5" : "1";
      forms.forEach((f) => (f.data = r));
    };
    sw.addEventListener("input", () => {
      this._rules[i] = { ...this._rules[i], color: sw.value };
      refresh();
      this._emit();
    });

    el.append(head, body);
    refresh();
    return el;
  }
}
if (!customElements.get("status-frame-card-editor")) customElements.define("status-frame-card-editor", StatusFrameCardEditor);

console.info(
  `%c STATUS-FRAME-CARD %c v${SFC_VERSION} `,
  "color:#fff;background:#03a9f4;font-weight:700",
  "color:#03a9f4;background:#fff"
);
