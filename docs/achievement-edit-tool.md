# achievement_edit Tool

`achievement_edit` is the project-local tool wrapper for the protagonist-only achievement system.

## Actions

| Action | Purpose |
|--------|---------|
| `init` | Create or normalize `progression/achievements.json` for a directory card. |
| `status` | Return only panel-legal visible status: unlocked achievements, current character status, claimable rewards. |
| `build-rd100` | Build a shuffled `.rd100` world table using archived=3 slots, unarchived=2 slots, random anime/game fill. |
| `roll-world` | Build/use `.rd100`, roll one world slot, and record the roll. |
| `claim` | Move one pending reward into claimed state and update dedupe ids. |
| `validate` | Validate achievement state, visible panel limits, duplicate rewards, and instant candidate examples. |

## World Random Rules

- Archived worlds occupy 3 slots each and do not need web verification for work existence.
- Unarchived worlds occupy 2 slots each and require web verification when hit.
- Remaining `.rd100` slots are filled with `randomAnimeGameWorld` and require web verification when hit.
- Slots are always shuffled, not grouped by source.
- If a candidate world fails current-world-level suitability, it is excluded and effectively replaced by random anime/game fill.

## Duplicate Rules

- The tool checks `ownedRewardIds`, `claimedRewardIds`, and `pendingRewardIds`.
- `claim` refuses duplicate reward ids.
- If all generated concrete candidates from a world are duplicates, reroll the world in narrative use.
- There is no base reward pool; reward candidates are generated instantly after the world/type rolls.
- Reward content is independent from achievement content; achievement only grants the roll/claim entitlement.

## Example

```json
{ "action": "build-rd100", "card": "hero", "currentWorldRating": "N6 城镇级", "currentWorldTopRating": "N8 山脉/区域级" }
```

```json
{ "action": "claim", "card": "hero", "rewardId": "reward-naruto-substitution-jutsu-001" }
```
