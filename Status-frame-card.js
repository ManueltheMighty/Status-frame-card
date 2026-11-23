/*!
 * Status Frame Card v0.6.0
 * Wrapper-Karte: legt einen regelbasierten Rahmen/Glow/Animation über eine
 * beliebige andere Lovelace-Karte, ohne deren Größe zu verändern.
 * Mehrere Karten wie bei einer Stapelkarte (cards + stack), Konfiguration komplett über den Editor.
 * Neu in 0.4.0: area_overlay – kompakte Area-Karte (festes Seitenverhältnis, Infoleiste als
 * abgedunkeltes Overlay über dem Bild), pro Karte einstellbar, ganz ohne card_mod/Theme.
 */
const SFC_VERSION = "0.6.0";

/* Registrierung für den Kartenwähler ganz am Anfang: Der Eintrag existiert auch dann,
   wenn weiter unten etwas schiefgeht, und wird bei doppeltem Laden nicht verdoppelt. */
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "status-frame-card")) {
  window.customCards.push({
    type: "status-frame-card",
    name: "Status Frame Card",
    description: "Regelbasierter Rahmen, Glow und Animation um jede beliebige Karte.",
    preview: true, // Live-Vorschau der Karte im Kartenwähler (nutzt getStubConfig)
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

/* ---- Layout / Stil (config.style) ----
   Hintergrund, Transparenz, Weichzeichner, Rand, Schatten und Textfarbe für die umschlossenen Karten.
   Nur geprüfte Werte: Farben müssen gültige CSS-Farben sein (kein url(), keine Bilder), Zahlen werden
   begrenzt, Auswahlwerte stammen aus festen Listen. */
const clampNum = (v, def, min, max) => {
  const n = Number(v);
  return has(v) && isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

const safeColor = (v) => {
  if (typeof v !== "string") return null;
  const c = v.trim();
  if (!c || c.length > 120 || /url\s*\(|[;{}<>\\]/i.test(c)) return null;
  if (typeof CSS !== "undefined" && CSS.supports) return CSS.supports("color", c) ? c : null;
  return /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9\s.,%/-]+\)|var\(--[a-z0-9_-]+\))$/i.test(c) ? c : null;
};

/* Hintergrundbild: nur Dateien aus dem lokalen Ordner /config/www (URL /local/...).
   Keine externen Adressen, keine data:-URIs, keine Pfadtricks, nur Bildendungen. */
const safeLocalImage = (v) => {
  if (typeof v !== "string") return null;
  const c = v.trim();
  if (c.length > 200 || !/^\/local\/[A-Za-z0-9._\-\/]+\.(png|jpe?g|webp|gif|avif|svg)$/i.test(c)) return null;
  if (c.includes("..") || c.includes("//")) return null;
  return c;
};

const STYLE_SHADOWS = {
  none: "none",
  soft: "0 4px 16px rgba(0,0,0,.18)",
  strong: "0 8px 28px rgba(0,0,0,.35)",
};

const STYLE_PRESETS = {
  glass: { background: "var(--card-background-color, #1c1c1c)", opacity: 0.35, blur: 16, radius: 16,
           border_width: 1, border_color: "rgba(255,255,255,.2)", shadow: "soft" },
  dark: { background: "#121417", opacity: 0.85, blur: 0, radius: 12,
          border_width: 1, border_color: "rgba(255,255,255,.06)", shadow: "none" },
  light: { background: "#ffffff", opacity: 0.9, blur: 0, radius: 12,
           border_width: 1, border_color: "rgba(0,0,0,.08)", shadow: "soft", text_color: "#1b1b1b" },
  outline: { background: "transparent", opacity: 1, blur: 0, radius: 12,
             border_width: 1, border_color: "var(--divider-color, rgba(128,128,128,.4))", shadow: "none" },
  minimal: { background: "transparent", opacity: 1, blur: 0, radius: 12, border_width: 0, shadow: "none" },
};

/* Liefert die endgültigen, geprüften Werte oder null, wenn kein Layout aktiv ist. */
const resolveStyle = (st) => {
  if (!st || typeof st !== "object") return null;
  const preset = Object.prototype.hasOwnProperty.call(STYLE_PRESETS, st.preset) ? STYLE_PRESETS[st.preset] : null;
  const keys = ["background", "opacity", "blur", "radius", "border_width", "border_color", "shadow", "text_color"];
  const image = safeLocalImage(st.image);
  if (!preset && !image && !keys.some((k) => has(st[k]))) return null;
  const POS = /^(center|top|bottom|left|right)(\s+(center|top|bottom|left|right))?$/;
  const base = { ...(preset || {}) };
  const color = safeColor(st.background) || safeColor(base.background) || "var(--card-background-color, #1c1c1c)";
  const opacity = clampNum(st.opacity, has(base.opacity) ? base.opacity : 1, 0, 1);
  const pct = Math.round(opacity * 1000) / 10;
  const shadowKey = Object.prototype.hasOwnProperty.call(STYLE_SHADOWS, st.shadow) ? st.shadow
    : Object.prototype.hasOwnProperty.call(STYLE_SHADOWS, base.shadow) ? base.shadow : "none";
  return {
    background: opacity >= 1 ? color : `color-mix(in srgb, ${color} ${pct}%, transparent)`,
    blur: clampNum(st.blur, has(base.blur) ? base.blur : 0, 0, 40),
    radius: clampNum(st.radius, has(base.radius) ? base.radius : 12, 0, 48),
    borderWidth: clampNum(st.border_width, has(base.border_width) ? base.border_width : 0, 0, 8),
    borderColor: safeColor(st.border_color) || safeColor(base.border_color) || "var(--divider-color, rgba(128,128,128,.4))",
    shadow: STYLE_SHADOWS[shadowKey],
    textColor: safeColor(st.text_color) || safeColor(base.text_color) || null,
    image,
    imageSize: st.image_size === "contain" ? "contain" : "cover",
    imagePosition: typeof st.image_position === "string" && POS.test(st.image_position.trim().toLowerCase())
      ? st.image_position.trim().toLowerCase() : "center",
    imageOpacity: clampNum(st.image_opacity, 1, 0, 1),
    imageDim: clampNum(st.image_dim, 0, 0, 1),
  };
};

/* Overlay-CSS für die Area-Karte von Home Assistant (hui-area-card).
   Alle Werte werden geprüft und begrenzt, damit nichts Unerwartetes im CSS landet. */
const overlayFit = (o) => (["cover", "contain", "fill"].includes(o.image_fit) ? o.image_fit : "cover");

const overlayRatio = (o) => {
  const ratio = String(has(o.aspect_ratio) ? o.aspect_ratio : "3/2").trim().replace(/:/g, "/");
  return /^\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?$/.test(ratio) ? ratio : "3/2";
};

const overlayCss = (o) => {
  const ratio = overlayRatio(o);
  const num = (v, def, min, max) => {
    const n = Number(v);
    return has(v) && isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const darken = num(o.darken, 0.45, 0, 1);
  const blur = num(o.blur, 0, 0, 40);
  const minH = num(o.min_height, 56, 0, 300);
  const zoom = num(o.zoom, 1, 1, 3);
  let pos = String(has(o.image_position) ? o.image_position : "center").trim().toLowerCase();
  if (!/^(center|top|bottom|left|right)(\s+(center|top|bottom|left|right))?$/.test(pos)) pos = "center";
  const fit = overlayFit(o);
  return `
    ha-card { position:relative; overflow:hidden; aspect-ratio:${ratio} !important; height:auto !important; }
    .header { position:absolute; inset:0; height:100% !important; padding:0 !important; z-index:0; }
    .header .picture, .header hui-image { position:absolute; inset:0; height:100%; width:100%; }
    .header .picture { background-size:${fit === "fill" ? "100% 100%" : fit} !important; background-position:${pos} !important; }
    ${zoom !== 1 ? `.header .picture, .header hui-image { transform:scale(${zoom}); transform-origin:${pos}; }` : ""}
    ha-tile-container {
      position:absolute !important; left:0; right:0; bottom:0; z-index:2;
      min-height:${minH}px;
      background:rgba(0,0,0,${darken});
      ${blur > 0 ? `-webkit-backdrop-filter:blur(${blur}px); backdrop-filter:blur(${blur}px);` : ""}
      --primary-text-color:#fff;
      --secondary-text-color:rgba(255,255,255,.8);
    }`;
};

/* ------------------------------------------------------------------ */
/* Karte                                                               */
/* ------------------------------------------------------------------ */

class StatusFrameCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("status-frame-card-editor");
  }

  /* Startkonfiguration und Vorschau im Kartenwähler: eine echte Entität, deren Zustand die Regel
     erfüllt, damit der Rahmen in der Vorschau sofort sichtbar ist. */
  static getStubConfig(hass, entities, entitiesFallback) {
    const all = [...(entities || []), ...(entitiesFallback || [])];
    const st = (id) => hass?.states?.[id]?.state;
    const id =
      all.find((e) => e.startsWith("light.") && st(e) === "on") ||
      all.find((e) => e.startsWith("switch.") && st(e) === "on") ||
      all.find((e) => e.startsWith("light.")) ||
      all[0] ||
      "sun.sun";
    return {
      cards: [{ type: "tile", entity: id }],
      rules: [
        { entities: [id], state: st(id) ?? "on", color: "#ffea00", glow: 12, animation: "glow" },
      ],
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
          /* Layout: eigene Hintergrundebene hinter den Karten (Farbe, Deckkraft, Weichzeichner, Rand, Schatten) */
          #bg { position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:0; display:none; box-sizing:border-box; overflow:hidden; }
          #bgimg { position:absolute; inset:0; display:none; background-repeat:no-repeat; }
          #wrap.styled #bg { display:block; }
          #wrap.styled > :not(#bg):not(#fx):not(#orbit) { position:relative; z-index:1; }
          #fx { position:absolute; inset:0; border-radius:inherit; pointer-events:none;
                z-index:1; transition:border-color .3s ease, background .3s ease, box-shadow .3s ease;
                box-sizing:border-box; }
          .ph { padding:16px; color:var(--secondary-text-color); text-align:center;
                border:1px dashed var(--divider-color); border-radius:inherit; }
          @keyframes pulse   { 0%{box-shadow:0 0 0 0 var(--c)} 70%{box-shadow:0 0 0 12px transparent} 100%{box-shadow:0 0 0 0 transparent} }
          @keyframes blink   { 0%,49%{opacity:1} 50%,100%{opacity:.1} }
          @keyframes glow    { 0%,100%{box-shadow:0 0 6px var(--c)} 50%{box-shadow:0 0 18px var(--c)} }
          @keyframes breathe { 0%,100%{opacity:1} 50%{opacity:.35} }
          /* Umlaufender Lichtpunkt: Punkte folgen einem Pfad entlang des Rahmens (offset-path) */
          #orbit { position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:2; display:none; }
          #orbit.on { display:block; }
          #orbit .dot { position:absolute; top:0; left:0; border-radius:50%; background:var(--c);
                        offset-path:var(--path); offset-rotate:0deg; offset-anchor:center;
                        animation:sfc-orbit var(--spd, 4s) linear infinite; will-change:offset-distance; }
          #orbit .dot.head { background:#fff; width:7px; height:7px; box-shadow:0 0 8px 3px var(--c); }
          @keyframes sfc-orbit { from { offset-distance:0% } to { offset-distance:100% } }
          @media (prefers-reduced-motion: reduce) { #orbit .dot { animation:none; } }
        </style>
        <div id="wrap"><div id="bg"><div id="bgimg"></div></div><div id="fx"></div><div id="orbit"></div></div>`;
      this._buildOrbit();
    }
    const key = JSON.stringify([this._cards(config), config.stack || "vertical", config.title || ""]);
    if (key !== this._cardKey) {
      this._cardKey = key;
      this._buildInner(key);
    }
    this._applyStyle();
    this._update();
    this._applyOverlay();
  }

  connectedCallback() {
    this._applyOverlay();
  }

  /* Layout anwenden: eigene Hintergrundebene, die umschlossenen HA-Karten werden über
     CSS-Variablen durchsichtig und randlos gestellt (Variablen vererben sich durch Shadow-DOM). */
  _applyStyle() {
    const wrap = this._root?.getElementById("wrap");
    const bg = this._root?.getElementById("bg");
    const img = this._root?.getElementById("bgimg");
    if (!wrap || !bg || !img) return;
    const vars = ["--ha-card-background", "--ha-card-border-width", "--ha-card-box-shadow",
                  "--ha-card-border-radius", "--primary-text-color", "--secondary-text-color"];
    const m = resolveStyle(this._config && this._config.style);
    this._orbitKey = null; // Eckenradius kann sich geändert haben
    if (!m) {
      wrap.classList.remove("styled");
      vars.forEach((v) => wrap.style.removeProperty(v));
      bg.removeAttribute("style");
      img.removeAttribute("style");
      return;
    }
    wrap.classList.add("styled");
    bg.style.background = m.background;
    bg.style.backdropFilter = bg.style.webkitBackdropFilter = m.blur > 0 ? `blur(${m.blur}px)` : "none";
    bg.style.border = m.borderWidth > 0 ? `${m.borderWidth}px solid ${m.borderColor}` : "none";
    bg.style.boxShadow = m.shadow;
    if (m.image) {
      // Der Pfad ist durch safeLocalImage auf harmlose Zeichen beschränkt und kann die Anführungszeichen nicht verlassen
      const dim = m.imageDim > 0 ? `linear-gradient(rgba(0,0,0,${m.imageDim}), rgba(0,0,0,${m.imageDim})), ` : "";
      img.style.backgroundImage = `${dim}url("${m.image}")`;
      img.style.backgroundSize = m.imageDim > 0 ? `100% 100%, ${m.imageSize}` : m.imageSize;
      img.style.backgroundPosition = m.imageDim > 0 ? `center, ${m.imagePosition}` : m.imagePosition;
      img.style.opacity = String(m.imageOpacity);
      img.style.display = "block";
    } else {
      img.removeAttribute("style");
    }
    wrap.style.setProperty("--ha-card-background", "transparent");
    wrap.style.setProperty("--ha-card-border-width", "0px");
    wrap.style.setProperty("--ha-card-box-shadow", "none");
    wrap.style.setProperty("--ha-card-border-radius", m.radius + "px");
    if (m.textColor) {
      wrap.style.setProperty("--primary-text-color", m.textColor);
      wrap.style.setProperty("--secondary-text-color", `color-mix(in srgb, ${m.textColor} 70%, transparent)`);
    } else {
      wrap.style.removeProperty("--primary-text-color");
      wrap.style.removeProperty("--secondary-text-color");
    }
  }

  /* Lichtpunkt mit Schweif: ein heller Kopf und acht kleinere, blassere Punkte dahinter */
  _buildOrbit() {
    const o = this._root.getElementById("orbit");
    this._dots = [];
    for (let k = 8; k >= 1; k--) {
      const d = document.createElement("div");
      d.className = "dot";
      d.style.width = d.style.height = (6.2 - k * 0.4).toFixed(1) + "px";
      d.style.opacity = (0.9 - k * 0.1).toFixed(1);
      d.style.boxShadow = "0 0 6px 1px var(--c)";
      o.append(d);
      this._dots[k] = d;
    }
    const head = document.createElement("div");
    head.className = "dot head";
    o.append(head);
    this._dots[0] = head;
  }

  /* hit = passende Regel mit animation "orbit", sonst null */
  _setOrbit(hit) {
    const o = this._root?.getElementById("orbit");
    if (!o) return;
    if (!hit) {
      o.classList.remove("on");
      this._orbitKey = null;
      return;
    }
    const wn = Number(hit.width);
    const w = has(hit.width) && isFinite(wn) ? Math.min(20, Math.max(0, wn)) : 2;
    const sn = Number(hit.speed);
    const spd = has(hit.speed) && isFinite(sn) ? Math.min(60, Math.max(0.5, sn)) : 4;
    const color = hit.color || "var(--primary-color)";
    const key = [w, spd, color].join("|");
    if (key !== this._orbitKey) {
      this._orbitKey = key;
      let r = parseFloat(getComputedStyle(this._root.getElementById("wrap")).borderRadius);
      if (!isFinite(r) || String(getComputedStyle(this._root.getElementById("wrap")).borderRadius).includes("%")) r = 12;
      o.style.setProperty("--path", `inset(${w / 2}px round ${Math.max(0, r - w / 2)}px)`);
      o.style.setProperty("--c", color);
      o.style.setProperty("--spd", spd + "s");
      // Schweifpunkte laufen zeitlich versetzt hinter dem Kopf (negative Verzögerung = Phase)
      this._dots.forEach((d, k) => (d.style.animationDelay = `${-(spd * (1 - k * 0.005))}s`));
    }
    o.classList.add("on");
  }

  /* Area-Overlay: Style in den Shadow-DOM der inneren Area-Karte einbringen.
     Läuft idempotent bei jedem Aufruf (Konfiguration, hass, Verbinden), weil die innere Karte
     asynchron entsteht und ihr Shadow-DOM erst nach dem Verbinden existiert. */
  _applyOverlay() {
    const o = this._config && this._config.area_overlay;
    const el = this._inner;
    const root = el && el.shadowRoot;
    if (!root) return;
    const on = !!(o && o.enabled === true && el.localName === "hui-area-card");
    const css = on ? overlayCss(o) : null;
    if (on) {
      const fit = overlayFit(o);
      root.querySelectorAll("hui-image").forEach((im) => {
        if (im.fitMode !== fit) im.fitMode = fit;
      });
    }

    if (window.CSSStyleSheet && "adoptedStyleSheets" in root) {
      if (css) {
        if (!this._ovSheet) this._ovSheet = new CSSStyleSheet();
        if (this._ovCss !== css) {
          this._ovSheet.replaceSync(css);
          this._ovCss = css;
        }
        if (!root.adoptedStyleSheets.includes(this._ovSheet))
          root.adoptedStyleSheets = [...root.adoptedStyleSheets, this._ovSheet];
      } else if (this._ovSheet && root.adoptedStyleSheets.includes(this._ovSheet)) {
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter((x) => x !== this._ovSheet);
      }
    } else {
      // Fallback für sehr alte Browser: normales <style>-Element
      let st = root.querySelector("style[data-sfc-overlay]");
      if (css) {
        if (!st) {
          st = document.createElement("style");
          st.setAttribute("data-sfc-overlay", "");
          root.append(st);
        }
        if (st.textContent !== css) st.textContent = css;
      } else if (st) st.remove();
    }
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
    const title = has(this._config.title) ? this._config.title : undefined;
    const cfg =
      cards.length === 1 && !title
        ? cards[0]
        : {
            type: this._config.stack === "horizontal" ? "horizontal-stack" : "vertical-stack",
            cards,
            ...(title ? { title } : {}),
          };
    const el = helpers.createCardElement(cfg);
    if (this._hass) el.hass = this._hass;
    this._inner = el;
    wrap.prepend(el);
    this._applyOverlay();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._inner && "hass" in this._inner) this._inner.hass = hass;
    this._update();
    this._applyOverlay();
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
    const orbit = anim === "orbit";
    fx.style.animation = anim && !orbit ? `${anim} ${has(hit.speed) ? hit.speed : 1.5}s infinite` : "none";
    this._setOrbit(orbit ? hit : null);
    fx.style.background = hit?.background || "none";
  }

  /* Area-Overlay aktiv? Aus der Konfiguration abgeleitet, damit es schon vor dem Aufbau der inneren Karte stimmt. */
  _overlayWanted() {
    const c = this._config;
    if (!c) return false;
    const o = c.area_overlay;
    const cards = this._cards(c);
    return !!(o && o.enabled === true && cards.length === 1 && cards[0].type === "area" && !has(c.title));
  }

  getCardSize() {
    if (this._overlayWanted()) {
      // Masonry-Ansicht: Höhe aus Breite und Seitenverhältnis schätzen (1 Einheit = 50 px)
      const [a, b] = overlayRatio(this._config.area_overlay).split("/").map(Number);
      const ratio = b ? a / b : a;
      return Math.max(1, Math.ceil((this.offsetWidth || 300) / ratio / 50));
    }
    return this._inner?.getCardSize?.() || 3;
  }
  getGridOptions() {
    let g = this._inner?.getGridOptions?.();
    if (g && Object.keys(g).length) this._grid = g;
    else g = this._grid || {};
    if (this._overlayWanted()) {
      // Ohne "rows" ignoriert die Karte die Zeilen des Rasters und nimmt ihre natürliche Höhe.
      // Sonst bleibt im Sections-Raster Platz für die ursprüngliche, höhere Area-Karte frei.
      const { rows, min_rows, max_rows, ...rest } = g;
      return { columns: 6, ...rest };
    }
    return g;
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
  preset: "Layout-Vorlage",
  opacity: "Deckkraft des Hintergrunds",
  radius: "Eckenradius (px)",
  border_width: "Randbreite (px)",
  border_color: "Randfarbe",
  shadow: "Schatten",
  text_color: "Textfarbe",
  enabled: "Area-Overlay aktivieren",
  aspect_ratio: "Seitenverhältnis",
  darken: "Abdunklung der Infoleiste",
  blur: "Weichzeichner (px)",
  min_height: "Mindesthöhe der Infoleiste (px)",
  image_fit: "Bildanpassung",
  zoom: "Zoom",
  image_position: "Bildausschnitt",
};

const HELPERS = {
  area: "Alle Entitäten dieses Bereichs, optional gefiltert durch Domain/Geräteklasse",
  entities: "Zusätzlich zum Filter oder allein",
  state: "Mehrere Werte mit Komma, z. B. on,open",
  above: "Für Zahlenwerte, z. B. Batterie",
  color: "#hex, rgba(…) oder var(--error-color)",
  background: "z. B. rgba(255,0,0,.2)",
  speed: "Dauer einer Animation (Standard 1,5). Bei „Umlaufend“ die Dauer eines Umlaufs (Standard 4)",
  default_border: "z. B. 1px solid rgba(255,255,255,.1). Leer = kein Rahmen",
  enabled: "Gilt nur, wenn die umschlossene Karte genau eine Area-Karte ist",
  aspect_ratio: "z. B. 3/2, 4/3 oder 16/9. Leer = 3/2",
  darken: "0 = durchsichtig, 1 = schwarz (Standard 0,45)",
  blur: "0 = aus. Weichzeichnet das Bild hinter der Leiste",
  zoom: "1 = kein Zoom. Füllt das Bild die Karte nicht, z. B. 1,2 probieren",
  image_position: "Welcher Teil des Bildes beim Zoomen/Zuschneiden sichtbar bleibt",
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
              { value: "orbit", label: "Umlaufend (Lichtpunkt)" },
            ],
          },
        },
      },
      { name: "speed", selector: NUM },
    ],
  },
  { name: "background", selector: { text: {} } },
];

const SCHEMA_OVERLAY = [
  { name: "enabled", selector: { boolean: {} } },
  { name: "aspect_ratio", selector: { text: {} } },
  {
    type: "grid", name: "", schema: [
      { name: "darken", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
      { name: "blur", selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } },
    ],
  },
  { name: "min_height", selector: { number: { min: 0, max: 200, step: 1, mode: "box" } } },
  {
    name: "image_fit",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "cover", label: "Ausfüllen (zuschneiden)" },
          { value: "contain", label: "Einpassen (Rand möglich)" },
          { value: "fill", label: "Strecken" },
        ],
      },
    },
  },
  {
    type: "grid", name: "", schema: [
      { name: "zoom", selector: { number: { min: 1, max: 3, step: 0.05, mode: "slider" } } },
      {
        name: "image_position",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "center", label: "Mitte" },
              { value: "top", label: "Oben" },
              { value: "bottom", label: "Unten" },
              { value: "left", label: "Links" },
              { value: "right", label: "Rechts" },
            ],
          },
        },
      },
    ],
  },
];

const SCHEMA_STYLE = [
  {
    name: "preset",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "none", label: "Kein Layout" },
          { value: "glass", label: "Glas (durchscheinend)" },
          { value: "dark", label: "Dunkel" },
          { value: "light", label: "Hell" },
          { value: "outline", label: "Nur Rahmen" },
          { value: "minimal", label: "Ohne Hintergrund" },
        ],
      },
    },
  },
  { name: "background", selector: { text: {} } },
  { name: "image", selector: { text: {} } },
  {
    type: "grid", name: "", schema: [
      {
        name: "image_size",
        selector: { select: { mode: "dropdown", options: [
          { value: "cover", label: "Ausfüllen (zuschneiden)" },
          { value: "contain", label: "Einpassen" },
        ] } },
      },
      {
        name: "image_position",
        selector: { select: { mode: "dropdown", options: [
          { value: "center", label: "Mitte" }, { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" },
          { value: "left", label: "Links" }, { value: "right", label: "Rechts" },
        ] } },
      },
      { name: "image_opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
      { name: "image_dim", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
    ],
  },
  {
    type: "grid", name: "", schema: [
      { name: "opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
      { name: "blur", selector: { number: { min: 0, max: 40, step: 1, mode: "slider" } } },
      { name: "radius", selector: { number: { min: 0, max: 48, step: 1, mode: "slider" } } },
      { name: "border_width", selector: { number: { min: 0, max: 8, step: 1, mode: "slider" } } },
    ],
  },
  {
    type: "grid", name: "", schema: [
      { name: "border_color", selector: { text: {} } },
      { name: "text_color", selector: { text: {} } },
    ],
  },
  {
    name: "shadow",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "none", label: "Kein Schatten" },
          { value: "soft", label: "Weich" },
          { value: "strong", label: "Kräftig" },
        ],
      },
    },
  },
];

// Eigene Beschriftungen für das Layout (Namen wie "background" und "blur" gibt es auch bei Regeln/Overlay)
const STYLE_LABELS = {
  background: "Hintergrundfarbe",
  blur: "Weichzeichner hinter der Karte (px)",
  image: "Hintergrundbild (Pfad unter /local/)",
  image_size: "Bildgröße",
  image_position: "Bildausschnitt",
  image_opacity: "Deckkraft des Bildes",
  image_dim: "Abdunklung des Bildes",
};
const STYLE_HELPERS = {
  background: "Nur Farben, z. B. #1c1c1c, rgb(…) oder var(--card-background-color). Leer = Farbe der Vorlage",
  opacity: "0 = durchsichtig, 1 = deckend. Wirkt nur auf den Hintergrund, nicht auf Texte",
  blur: "Weichzeichnet, was hinter der Karte liegt (Glas-Effekt). Kostet auf schwachen Geräten Leistung",
  border_color: "Nur Farben",
  text_color: "Nur Farben. Leer = Farbe des Themes",
  image: "z. B. /local/hintergruende/wohnzimmer.jpg. Nur Dateien aus /config/www. Sie sind ohne Anmeldung abrufbar, also keine privaten Bilder",
  image_position: "Welcher Teil des Bildes sichtbar bleibt",
  image_dim: "Dunkelt das Bild ab, damit Texte lesbar bleiben",
};

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
    this._cardTitle = this._config.title;
    this._rules = (this._config.rules || []).map((r) => ({ ...r }));
    this._defaultBorder = this._config.default_border;
    this._overlay = { ...(this._config.area_overlay || {}) };
    this._style = { ...(this._config.style || {}) };
    this._openIdx = null;
    if (!this._sections)
      this._sections = { cards: true, rules: true, overlay: this._overlay.enabled === true, style: Object.keys(this._style).length > 0, general: false };

    this.innerHTML = `
      <style>
        .sfc h3 { margin:16px 0 4px; font-size:1rem; }
        .sfc details.sec { margin:8px 0; border-top:1px solid var(--divider-color); }
        .sfc details.sec > summary { cursor:pointer; padding:12px 0; font-size:1rem; font-weight:500; }
        .sfc details.sec > .secbody { padding-bottom:8px; }
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
        <details class="sec" data-k="cards" ${this._sections.cards ? "open" : ""}>
          <summary>Umschlossene Karten</summary>
          <div class="secbody"><div id="cardbox"></div></div>
        </details>
        <details class="sec" data-k="rules" ${this._sections.rules ? "open" : ""}>
          <summary id="sum-rules">Regeln</summary>
          <div class="secbody">
            <p class="hint">Reihenfolge = Priorität: die erste passende Regel gewinnt. Wichtiges nach oben.</p>
            <div id="rules"></div>
            <button class="btn" id="add">+ Regel hinzufügen</button>
          </div>
        </details>
        <details class="sec" data-k="style" ${this._sections.style ? "open" : ""}>
          <summary id="sum-style">Layout</summary>
          <div class="secbody">
            <p class="hint">Hintergrund, Transparenz, Rand und Schatten der umschlossenen Karten. Eine Vorlage wählen und bei Bedarf einzelne Werte überschreiben.</p>
            <div id="style"></div>
          </div>
        </details>
        <details class="sec" data-k="overlay" ${this._sections.overlay ? "open" : ""}>
          <summary id="sum-overlay">Area-Overlay</summary>
          <div class="secbody">
            <p class="hint">Macht die umschlossene Area-Karte kompakter: festes Seitenverhältnis, Name und Infos als abgedunkeltes Overlay über dem Bild.</p>
            <div id="overlay"></div>
          </div>
        </details>
        <details class="sec" data-k="general" ${this._sections.general ? "open" : ""}>
          <summary>Allgemein</summary>
          <div class="secbody"><div id="general"></div></div>
        </details>
      </div>`;

    // Aufgeklappt/zugeklappt merken, auch wenn der Editor neu aufgebaut wird
    this.querySelectorAll("details.sec").forEach((d) =>
      d.addEventListener("toggle", () => (this._sections[d.dataset.k] = d.open))
    );

    this.querySelector("#add").addEventListener("click", () => {
      this._rules.push({ color: "#ffea00", glow: 12 });
      this._openIdx = this._rules.length - 1;
      this._renderRules();
      this._emit();
    });

    const st = this._form(SCHEMA_STYLE, this._style, (v) => {
      const c = clean(v);
      if (c.preset === "none") delete c.preset;
      this._style = c;
      this._updateBadges();
      this._emit();
    }, STYLE_LABELS, STYLE_HELPERS);
    this.querySelector("#style").append(st);

    const ov = this._form(SCHEMA_OVERLAY, this._overlay, (v) => {
      this._overlay = clean(v);
      this._updateBadges();
      this._emit();
    });
    this.querySelector("#overlay").append(ov);

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
    this._updateBadges();
  }

  _updateBadges() {
    const r = this.querySelector("#sum-rules");
    if (r) r.textContent = `Regeln (${this._rules.length})`;
    const l = this.querySelector("#sum-style");
    if (l) {
      const keys = Object.keys(this._style || {});
      l.textContent = `Layout · ${this._style && this._style.preset ? this._style.preset : keys.length ? "eigene Werte" : "aus"}`;
    }
    const o = this.querySelector("#sum-overlay");
    if (o) o.textContent = `Area-Overlay · ${this._overlay && this._overlay.enabled === true ? "an" : "aus"}`;
  }

  _form(schema, data, onChange, labels = {}, helpers = {}) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.data = data;
    f.hass = this._hass;
    f.computeLabel = (s) => labels[s.name] || LABELS[s.name] || s.name;
    f.computeHelper = (s) => helpers[s.name] || HELPERS[s.name] || "";
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
      title: this._cardTitle,
      rules: this._rules.map(clean),
      default_border: this._defaultBorder,
      area_overlay: Object.keys(this._overlay || {}).length ? this._overlay : undefined,
      style: Object.keys(this._style || {}).length ? this._style : undefined,
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
          ed.setConfig({ type: "vertical-stack", cards: this._cards, title: this._cardTitle });
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
          this._cardTitle = c.title;
          this._emit();
          // Wie bei HA üblich: neue Konfiguration an den Stapel-Editor zurückgeben, sonst setzt er z. B. den Titel zurück
          ed.setConfig({ type: "vertical-stack", cards: this._cards, title: this._cardTitle });
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
    this._updateBadges();
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
