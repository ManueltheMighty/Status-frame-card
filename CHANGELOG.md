# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), versions follow [Semantic Versioning](https://semver.org/).

## [0.6.0]
### Added
- `style`: layout for the wrapped cards. Presets `glass`, `dark`, `light`, `outline` and `minimal`, plus `background` (colour), `opacity`, `blur`, `radius`, `border_width`, `border_color`, `shadow` (`none`, `soft`, `strong`) and `text_color`. A preset can be chosen and single values overridden. Available as a new collapsible "Layout" section in the editor.
- Only valid CSS colours are accepted (no `url()` or images), numbers are limited, and choices come from fixed lists.
- `style`: local background images. New options `image` (a path under `/local/`, so a file in `/config/www`), `image_size` (`cover`, `contain`), `image_position`, `image_opacity` and `image_dim` (darkens the picture so text stays readable). Also available in the editor.
- Only paths that start with `/local/` and end with an image extension are accepted. External addresses, `data:` URIs, `..` and other paths are rejected and make no request.
    
## [0.5.0]
### Added
- New animation `orbit`: a bright dot with a short tail travels around the frame, to show that something is running (for example a washing machine). `speed` sets the time of one lap (default 4 s). It is CSS only, follows the card's corner radius, and is switched off when the system asks for reduced motion.
- 
## [0.4.1]
### Added
- `area_overlay`: `image_fit` (`cover`, `contain`, `fill`; default `cover`), `zoom` (1 to 3) and `image_position` (`center`, `top`, `bottom`, `left`, `right`), so a picture that does not fill the card (for example 16:9 in a 3/2 card) can be filled, cropped or zoomed.
- Editor: the sections "Wrapped cards", "Rules", "Area overlay" and "General" can be collapsed and expanded. The state is remembered while the editor is open, and the headings show the number of rules and whether the overlay is on.
### Fixed
- With `area_overlay` enabled the card kept the grid height of the original, taller area card and left a gap below it in the sections view. The card now reports no `rows` to the grid and takes its natural height from the aspect ratio. The width stays as set. The card size for the masonry view is estimated from the aspect ratio.
- The grid options of the wrapped card are remembered, so the card keeps its width even if the layout asks before the inner card is built.
  
## [0.3.6]
### Fixed
- Editor failed with "this._title is not a function" since 0.3.5: the new card title property had the same name as an internal method. The property is now called `_cardTitle`.
  
## [0.3.5]
### Added
- Live preview in the card picker (`preview: true`). The default configuration now uses a real entity and a rule that matches it, so the frame is visible right away.
### Fixed
- The "Title" field of the card editor lost its value right after typing. The title is now saved (`title`) and shown above the cards like in a stack card.
  
## [0.3.4]
### Changed
- README: installation leads with search in HACS / Marketplace, custom repository is the fallback.

### Added
- Card picker suggestion for the whole area: for an entity that belongs to an area, a second suggestion "Area <name>" wraps an area card with ready-made rules for smoke, battery and lights of that area.

## [0.3.3]
### Added
- Suggestions for the card picker of Home Assistant 2026.6+ (`getEntitySuggestion`): after choosing a light, switch, binary sensor or battery sensor, the card is offered in the "Community" section with a ready-made rule.

## [0.3.2]
### Fixed
- Editor: the stack-card editor is now loaded on demand, so it also works when Home Assistant has not registered the stack card yet.
- Editor errors are shown in the editor and in the browser console instead of failing silently; the JSON fallback names the reason.

## [0.3.1]
### Fixed
- Card registration for the card picker now happens first in the file and cannot be duplicated; loading the file twice no longer aborts with "already defined".

## [0.3.0]
### Added
- Several cards inside the frame, chosen like in a stack card (`cards`, `stack: vertical | horizontal`).
- Editor reuses Home Assistant's stack-card editor (tabs, card picker, move, copy, delete).
### Changed
- `card` (single card) is deprecated but still works; it is converted to `cards` when saved in the editor.

## [0.2.0]
### Added
- Visual editor: rule list with colour picker, priority via up/down, grouped fields for source, condition and effect.
- Rule options `exclude`, `attribute`, `match` (`any` / `all`), `name`.
- Animation `breathe`.

## [0.1.0]
### Added
- First version: frame, glow, animation and background around any card, driven by entity rules (YAML only).
