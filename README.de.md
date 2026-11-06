# Status Frame Card

[English](README.md) · **Deutsch**

Eine Wrapper-Karte für Home Assistant Lovelace. Sie legt einen **regelbasierten Rahmen, Glow, Animation und Hintergrund** um jede andere Karte (oder eine ganze Gruppe von Karten), ohne deren Größe zu verändern. Die Regeln schauen auf Entitäten, Bereiche, Domains oder Geräteklassen. So kann ein Rahmen reagieren auf "irgendein Licht im Wohnzimmer ist an", "irgendeine Batterie unter 20 %" oder "irgendein Rauchmelder hat ausgelöst".

Alles wird im **grafischen Editor** eingestellt. Keine Templates, kein card-mod nötig.

<img width="540" height="386" alt="image" src="https://github.com/user-attachments/assets/1b66e392-7030-49df-915d-58a61fadc4fb" />
<img width="219" height="205" alt="image" src="https://github.com/user-attachments/assets/ed4c2b01-1fdf-4c9b-9410-77f067864045" />


## Funktionen

- Umschließt eine oder mehrere Karten, ausgewählt wie bei einer Stapelkarte (untereinander oder nebeneinander).
- Größe und Layout der Karten bleiben unverändert, Klicks gehen direkt an die innere Karte.
- Regeln nach **Bereich**, **Domain**, **Geräteklasse** und einzelnen **Entitäten**, mit Ausschlussliste.
- Bedingungen: Zustand (auch mehrere Werte), Attribut, größer / kleiner als, "irgendeine" oder "alle" Entitäten.
- Effekte: Farbe, Rahmenbreite, Leuchten, Hintergrund und Animationen (Pulsieren, Blinken, Glühen, Atmen).
- **Die erste passende Regel gewinnt**, die Reihenfolge der Liste ist also die Priorität.
- Funktioniert mit jedem Kartentyp, auch mit Custom-Karten.

## Installation

### HACS / Marketplace (empfohlen)

1. **Einstellungen → Marketplace** öffnen (Home Assistant 2026.11 und neuer) oder **HACS** (ältere Versionen).
2. Nach **Status Frame Card** suchen und herunterladen.
3. Browser neu laden (Strg+F5).

[![Öffnet deine Home-Assistant-Instanz und zeigt dieses Repository.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ManueltheMighty&repository=Status-frame-card&category=plugin)

### Benutzerdefiniertes Repository (Ausweichweg)

Nutze das, wenn die Karte in der Suche noch nicht auftaucht.

1. Im Marketplace oder in HACS das Menü (drei Punkte) → **Benutzerdefinierte Repositories** öffnen.
2. `https://github.com/ManueltheMighty/Status-frame-card` mit der Kategorie **Dashboard** hinzufügen.
3. **Status Frame Card** herunterladen und den Browser neu laden (Strg+F5).

### Manuell

1. `Status-frame-card.js` aus dem [neuesten Release](https://github.com/ManueltheMighty/Status-frame-card/releases/latest) herunterladen.
2. Nach `/config/www/Status-frame-card.js` kopieren.
3. Einstellungen → Dashboards → ⋮ → **Ressourcen** → `/local/Status-frame-card.js` als **JavaScript-Modul** hinzufügen.
4. Browser neu laden (Strg+F5).

## Benutzung

1. Dashboard bearbeiten → **Karte hinzufügen**. Ab Home Assistant 2026.6 öffnet der Dialog auf *Nach Entität*: Wechsle zum Reiter **Nach Karte** (oder *Alle Karten durchsuchen*) und suche nach **Status Frame Card**. Alternativ wählst du unter *Nach Entität* ein Licht, einen Schalter, einen Binärsensor oder einen Batteriesensor und nimmst die Karte aus dem Abschnitt **Community**. Gehört die Entität zu einem Bereich, gibt es zusätzlich eine **Bereichs**-Variante, die die Bereichskarte mit Regeln für den ganzen Bereich umschließt.
2. Die zu umschließenden Karten auswählen, wie bei einer Stapelkarte.
3. Regeln hinzufügen. Wichtige (Alarme) mit ▲ / ▼ nach oben schieben.

![Der grafische Editor](https://raw.githubusercontent.com/ManueltheMighty/Status-frame-card/main/images/editor.png)

### YAML-Beispiel

```yaml
type: custom:status-frame-card
cards:
  - type: area
    area: wohnzimmer
    display_type: picture
rules:
  - name: Rauchalarm
    area: wohnzimmer
    domain: binary_sensor
    device_class: smoke
    state: "on"
    color: "#ff0000"
    animation: pulse
    speed: 1
    background: "rgba(255,0,0,.2)"
  - name: Bewegung
    area: wohnzimmer
    domain: binary_sensor
    device_class: motion
    state: "on"
    color: "#ff0000"
    animation: blink
    speed: 0.8
    glow: 15
  - name: Batterie leer
    area: wohnzimmer
    domain: sensor
    device_class: battery
    below: 10
    color: "#ff0000"
    animation: pulse
  - name: Batterie schwach
    area: wohnzimmer
    domain: sensor
    device_class: battery
    below: 20
    color: "#ff4d4d"
    glow: 12
  - name: Licht an
    area: wohnzimmer
    domain: light
    state: "on"
    color: "#ffea00"
    glow: 12
  - name: Lampe an einer Steckdose
    entities: [switch.leuchte_wohnzimmer_tv]
    state: "on"
    color: "#ffea00"
    glow: 12
```

Mehrere Karten nebeneinander:

```yaml
type: custom:status-frame-card
stack: horizontal
cards:
  - type: tile
    entity: sensor.waschmaschine_leistung
  - type: tile
    entity: sensor.trockner_leistung
rules:
  - entities: [sensor.waschmaschine_leistung, sensor.trockner_leistung]
    above: 5
    color: "#00bcd4"
    animation: glow
```

## Optionen

### Karte

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `cards` | Liste | – | Karten im Rahmen. |
| `stack` | `vertical` \| `horizontal` | `vertical` | Anordnung bei mehr als einer Karte. |
| `rules` | Liste | – | Regeln, die erste passende gewinnt. |
| `default_border` | CSS | keiner | Rahmen, wenn keine Regel passt, z. B. `1px solid rgba(255,255,255,.1)`. |
| `card` | Karte | – | Veraltete Einzelkarten-Form von `cards`. |

### Regel

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `name` | Text | – | Bezeichnung im Editor. |
| `area` | Bereichs-ID | – | Alle Entitäten dieses Bereichs (Entität oder ihr Gerät). |
| `domain` | Text | – | z. B. `light`, `binary_sensor`. |
| `device_class` | Text | – | z. B. `battery`, `motion`, `smoke`. |
| `entities` | Liste | – | Zusätzliche Einzelentitäten, unverändert übernommen. |
| `exclude` | Liste | – | Auszuschließende Entitäten. |
| `state` | Text | – | Gewünschter Zustand. Mehrere Werte mit Komma: `on,open`. |
| `attribute` | Text | – | Dieses Attribut statt des Zustands vergleichen. |
| `above` / `below` | Zahl | – | Zahlenvergleich. |
| `match` | `any` \| `all` | `any` | Eine oder alle Entitäten müssen zutreffen. |
| `color` | CSS-Farbe | Primärfarbe | `#hex`, `rgba(…)` oder `var(--error-color)`. |
| `width` | Zahl | `2` | Rahmenbreite in px. |
| `glow` | Zahl | – | Leuchtradius in px. |
| `animation` | `none` \| `pulse` \| `blink` \| `glow` \| `breathe` | `none` | |
| `speed` | Zahl | `1.5` | Dauer der Animation in Sekunden. |
| `background` | CSS | – | Hintergrund über der Karte, z. B. `rgba(255,0,0,.2)`. |

**So funktioniert die Quelle:** `area`, `domain` und `device_class` bilden einen Filter, den alle erfüllen müssen. `entities` kommen zusätzlich dazu und werden nicht gefiltert. Eine Regel ohne jede Quelle trifft nichts.

## Fehlersuche

- **Karte fehlt im Kartenwähler:** Ressourcentyp muss *JavaScript-Modul* sein, mit Strg+F5 neu laden (nach Updates `?v=2` an die Ressourcen-URL hängen) und ganz unten im Wähler nach "Status" suchen.
- **Karte fehlt weiterhin im Wähler:** Die Datei darf nur **einmal** geladen werden (nicht als manuelle Ressource *und* über HACS). In der Browser-Konsole `customElements.get('status-frame-card')` ausführen, `undefined` heißt: Die Datei wurde nicht geladen.
- **Datei nicht gefunden (404):** Dateinamen unterscheiden unter Linux zwischen Groß- und Kleinschreibung. Die Datei heißt `Status-frame-card.js` (großes S), die Ressourcen-URL muss exakt gleich geschrieben sein.
- **Gar kein Rahmen:** Browser-Konsole auf Fehler prüfen. Prüfen, ob eine Regel wirklich trifft: Entwicklerwerkzeuge → Template → `{{ area_entities('wohnzimmer') }}`.
- **Rahmen ist immer an:** Ein Schalter oder Sensor im Bereich hat dauerhaft den gewünschten Zustand (zum Beispiel "Internetzugang"-Schalter). Die Regel mit `domain` eingrenzen oder die Entität bei `exclude` eintragen.
- **Bereich wird nicht gefunden:** Die Bereichs-**ID** verwenden (z. B. `wohnzimmer`), nicht den Anzeigenamen. Die Bereichsauswahl im Editor erledigt das automatisch.
- Entitäten ohne Bereich und ohne Gerät mit Bereich findet `area` nicht, sie gehören unter `entities`.

## Entwicklung

Es gibt keinen Build-Schritt. Die Karte ist eine einzelne Datei, `Status-frame-card.js`. Die Syntaxprüfung läuft mit `node --check Status-frame-card.js`.

Releases: `SFC_VERSION` in der Datei und `CHANGELOG.md` anheben, Tag `vX.Y.Z` setzen, GitHub-Release veröffentlichen. Der Workflow hängt die Datei an das Release.

## Lizenz

[MIT](LICENSE)
