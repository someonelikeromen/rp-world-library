# Appearance / Ability / Combat-Effect Fix R1

Step: `visual-ability-fixer-r1`
Model declaration: `lt-yuyu/gpt-5.5`
Status: fixed; read-only audit pass follows in final report updates.

## Scope

All writes were kept under:

`campaigns/world-library/manual-curation/type-moon-p1-hybrid/fgo-script-pilot/`

No source imports, old curated archives, docs, skills, or repository code were modified. No shell/bash/python/node/deno/powershell/cmd or executable scripts were used.

## What was added

- `extracted/part1/<chapter>/appearance-signals/index.json`
- `extracted/part1/<chapter>/ability-signals/index.json`
- `extracted/part1/<chapter>/combat-effect-signals/index.json`
- `normalized/part1/<chapter>/appearances/records.json` and `not-found-index.json`
- `normalized/part1/<chapter>/abilities/records.json` and `not-found-index.json`
- `normalized/part1/<chapter>/combat-effects/records.json` and `not-found-index.json`
- `merged/appearances/part1/<chapter>/records.json`
- `merged/abilities/part1/<chapter>/records.json`
- `merged/combat-effects/part1/<chapter>/records.json`
- Layer indexes under `merged/appearances/`, `merged/abilities/`, and `merged/combat-effects/`
- Cross-reference indexes for chapters, characters, and events.

## Priority source-backed evidence captured

- Mash shield / Lord Chaldeas in Fuyuki.
- Siegfried Balmung and Saint George baptismal healing in Orleans.
- Flauros pillar form, Attila Grail/Noble Phantasm sequence, and Mash interception in Septem.
- Okeanos Ark divine-punishment plan, Asterios sacrifice, Drake naval assault, and Forneus summoning.
- London magic fog, Mordred armored introduction, Hyde transformation, Tesla lightning activation, and Solomon attack.
- America Karna named release, Sita sacrifice-healing, Nightingale support, and Medb’s twenty-eight Demon Pillar deployment.
- Camelot Arash Stella, Mash/Galahad release, Xuanzang gate-breaking strike, Mash holy-lance block, and Bedivere returning the holy sword.
- Babylonia black mud conversion, Anna/Gorgon mutual destruction, Uruk full-city fire, and King Hassan death-concept final kill.
- Solomon Demon Pillar shared-life network, mass Heroic Spirit arrival, Goetia light band, Mash sacrifice, Romani/Solomon Ars Nova, final duel, and Fou restoration.

## Not-found-in-source handling

Where the script names an activation or outcome but does not describe costume, full appearance, light/barrier shapes, attack choreography, or detailed animation, the field is explicitly marked `not-found-in-source` and the record carries `notFoundReason`.

## Known issues preserved

- Orleans duplicate raw `事件N` and missing raw `事件M` remain preserved.
- Okeanos Heracles continuity tension remains preserved.
- Solomon large support cast remains partial/key-fragment represented.
