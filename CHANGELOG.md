# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), versions follow [Semantic Versioning](https://semver.org/).

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
