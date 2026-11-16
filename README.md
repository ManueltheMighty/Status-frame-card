# Status Frame Card

**English** · [Deutsch](README.de.md)

A wrapper card for Home Assistant Lovelace. It puts a **rule-based frame, glow, animation and background** around any other card (or a whole group of cards) without changing their size. Rules look at entities, areas, domains or device classes, so one frame can react to "any light in the living room is on", "any battery below 20 %" or "any smoke detector triggered".

Everything is configured in the **visual editor**. No templates, no card-mod needed.

<img width="540" height="386" alt="image" src="https://github.com/user-attachments/assets/5ac285a3-53d2-446c-bd9b-41010cd3801b" />
<img width="215" height="126" alt="image" src="https://github.com/user-attachments/assets/ec245ac6-8328-4e44-b7a5-1f306680b4fd" />
<img width="219" height="205" alt="image" src="https://github.com/user-attachments/assets/756dd1e2-62ab-48f9-b671-3ae890a40429" />


## Features

- Wraps one or several cards, chosen like in a stack card (vertical or horizontal).
- Card size and layout stay untouched, clicks go straight through to the inner cards.
- Rules by **area**, **domain**, **device class**, single **entities**, with an exclude list.
- Conditions: state (several values allowed), attribute, above / below, "any" or "all" entities.
- Effects: colour, border width, glow, background, animations (pulse, blink, glow, breathe).
- **First matching rule wins**, so the order of the list is the priority.
- Works with every card type, including custom cards.

## Installation

### HACS / Marketplace (recommended)

1. Open **Settings → Marketplace** (Home Assistant 2026.11 and newer) or **HACS** (older versions).
2. Search for **Status Frame Card** and download it.
3. Reload the browser (Ctrl+F5).

[![Open your Home Assistant instance and show this repository.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ManueltheMighty&repository=Status-frame-card&category=plugin)

### Custom repository (fallback)

Use this if the card does not show up in the search yet.

1. In the Marketplace or in HACS open the menu (three dots) → **Custom repositories**.
2. Add `https://github.com/ManueltheMighty/Status-frame-card` with category **Dashboard**.
3. Download **Status Frame Card** and reload the browser (Ctrl+F5).

### Manual

1. Download `Status-frame-card.js` from the [latest release](https://github.com/ManueltheMighty/Status-frame-card/releases/latest).
2. Copy it to `/config/www/Status-frame-card.js`.
3. Settings → Dashboards → ⋮ → **Resources** → add `/local/Status-frame-card.js` as **JavaScript module**.
4. Reload the browser (Ctrl+F5).

## Usage

1. Edit a dashboard → **Add card**. In Home Assistant 2026.6+ the dialog opens on *By entity*: switch to the **By card** tab (or *Browse all cards*) and search for **Status Frame Card**. Alternatively pick a light, switch, binary sensor or battery sensor under *By entity* and choose the card from the **Community** section. For entities that belong to an area you also get an **Area** variant that wraps the area card with rules for the whole area.
2. Choose the card(s) to wrap, like in a stack card.
3. Add rules. Move important ones (alarms) to the top with ▲ / ▼.

![The visual editor](https://raw.githubusercontent.com/ManueltheMighty/Status-frame-card/main/images/editor.png)

### YAML example

```yaml
type: custom:status-frame-card
cards:
  - type: area
    area: living_room
    display_type: picture
rules:
  - name: Smoke alarm
    area: living_room
    domain: binary_sensor
    device_class: smoke
    state: "on"
    color: "#ff0000"
    animation: pulse
    speed: 1
    background: "rgba(255,0,0,.2)"
  - name: Motion
    area: living_room
    domain: binary_sensor
    device_class: motion
    state: "on"
    color: "#ff0000"
    animation: blink
    speed: 0.8
    glow: 15
  - name: Battery empty
    area: living_room
    domain: sensor
    device_class: battery
    below: 10
    color: "#ff0000"
    animation: pulse
  - name: Battery low
    area: living_room
    domain: sensor
    device_class: battery
    below: 20
    color: "#ff4d4d"
    glow: 12
  - name: Light on
    area: living_room
    domain: light
    state: "on"
    color: "#ffea00"
    glow: 12
```

Several cards next to each other:

```yaml
type: custom:status-frame-card
stack: horizontal
cards:
  - type: tile
    entity: sensor.washing_machine_power
  - type: tile
    entity: sensor.dryer_power
rules:
  - entities: [sensor.washing_machine_power, sensor.dryer_power]
    above: 5
    color: "#00bcd4"
    animation: glow
```

## Options

### Card

| Option | Type | Default | Description |
|---|---|---|---|
| `cards` | list | – | Cards inside the frame. |
| `stack` | `vertical` \| `horizontal` | `vertical` | Arrangement if there is more than one card. |
| `title` | string | – | Optional heading above the cards, shown like in a stack card. |
| `rules` | list | – | Rules, first match wins. |
| `default_border` | CSS | none | Border when no rule matches, e.g. `1px solid rgba(255,255,255,.1)`. |
| `card` | card | – | Deprecated single-card form of `cards`. |

### Rule

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | string | – | Label in the editor. |
| `area` | area id | – | All entities of this area (entity or its device). |
| `domain` | string | – | e.g. `light`, `binary_sensor`. |
| `device_class` | string | – | e.g. `battery`, `motion`, `smoke`. |
| `entities` | list | – | Additional single entities, taken as they are. |
| `exclude` | list | – | Entities to leave out. |
| `state` | string | – | Wanted state. Several values separated by comma: `on,open`. |
| `attribute` | string | – | Compare this attribute instead of the state. |
| `above` / `below` | number | – | Numeric comparison. |
| `match` | `any` \| `all` | `any` | One or all entities must match. |
| `color` | CSS colour | primary colour | `#hex`, `rgba(…)` or `var(--error-color)`. |
| `width` | number | `2` | Border width in px. |
| `glow` | number | – | Glow radius in px. |
| `animation` | `none` \| `pulse` \| `blink` \| `glow` \| `breathe` | `none` | |
| `speed` | number | `1.5` | Animation duration in seconds. |
| `background` | CSS | – | Background over the card, e.g. `rgba(255,0,0,.2)`. |

**How the source works:** `area`, `domain` and `device_class` form a filter that all must satisfy. `entities` are added on top and are not filtered. A rule without any source matches nothing.

## Area overlay

For a wrapped **area card** (`display_type: picture`) the card can make the area card compact: fixed aspect ratio, name and info as a darkened bar over the picture. No card-mod and no theme needed, and it is set per card.

```yaml
type: custom:status-frame-card
area_overlay:
  enabled: true
  aspect_ratio: 3/2   # also 4/3 or 16/9
  darken: 0.45        # 0 = transparent, 1 = black
  blur: 0             # px, 0 = off
  min_height: 56      # height of the info bar in px
cards:
  - type: area
    area: kitchen
    display_type: picture
rules: []
```

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Turns the overlay on. |
| `aspect_ratio` | text | `3/2` | Width/height, e.g. `3/2`, `4/3`, `16/9`. Invalid values fall back to `3/2`. |
| `darken` | number | `0.45` | Darkness of the info bar, 0 to 1. |
| `blur` | number | `0` | Blur behind the bar in px, 0 to 40. |
| `min_height` | number | `56` | Minimum height of the info bar in px. |
| `image_fit` | `cover` \| `contain` \| `fill` | `cover` | How the picture fits the card. `cover` fills the card and crops the picture. |
| `zoom` | number | `1` | Zoom factor, 1 to 3. Try `1.2` if the picture does not fill the card. |
| `image_position` | `center` \| `top` \| `bottom` \| `left` \| `right` | `center` | Which part of the picture stays visible when cropping or zooming. |

In the sections view the card gives up the grid rows while the overlay is on, so the compact card does not leave a gap. Its height then follows the aspect ratio, and the row setting of the layout editor has no effect on it. The width still works.

It only applies if the card wraps **exactly one area card** and has no `title`. It adjusts the inside of Home Assistant's area card, so a Home Assistant update can change how it looks. If you see a gap below the picture after an update, please open an issue with a screenshot.

## Troubleshooting

- **Card is not in the card picker:** check that the resource type is *JavaScript module*, reload with Ctrl+F5 (add `?v=2` to the resource URL after updates), and search for "Status" at the bottom of the picker.
- **Card still missing in the picker:** make sure the file is loaded only **once** (not as a manual resource *and* via HACS) and run `customElements.get('status-frame-card')` in the browser console. `undefined` means the file did not load.
- **File not found (404):** file names are case-sensitive on Linux. The file is called `Status-frame-card.js` (capital S), and the resource URL must use exactly the same spelling.
- **No frame at all:** open the browser console and look for errors. Check that a rule really matches: Developer tools → Template → `{{ area_entities('living_room') }}`.
- **Frame is always on:** a switch or sensor in the area has the wanted state permanently (for example "internet access" switches). Narrow the rule with `domain`, or put the entity in `exclude`.
- **Area is not found:** use the area **ID** (e.g. `living_room`), not the display name. The editor's area picker takes care of this.
- Entities without an area and without a device with an area are not found by `area`; list them under `entities`.

## Development

No build step. The card is a single file, `Status-frame-card.js`. A syntax check runs with `node --check Status-frame-card.js`.

Releases: bump `SFC_VERSION` in the file and `CHANGELOG.md`, tag `vX.Y.Z`, publish a GitHub release. The workflow attaches the file to the release.

## License

[MIT](LICENSE)
