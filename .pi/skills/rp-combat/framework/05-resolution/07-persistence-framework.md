## 7. 状态持久化框架

角色、世界、会话需要持久化数据，供前端展示和后续 RP 使用。

### 7.1 角色状态

```json
{
  "identity": {},
  "attributes": {
    "output": 0,
    "durability": 0,
    "reaction": 0,
    "control": 0,
    "perception": 0,
    "mentalStrength": 0,
    "computation": 0
  },
  "lifeGrade": "",
  "resistances": [],
  "resources": [],
  "abilities": [],
  "talents": [],
  "knowledge": [],
  "items": [],
  "conditions": [],
  "combatProfile": {}
}
```

### 7.2 世界状态

```json
{
  "world": {},
  "powerSystems": [],
  "factions": [],
  "energyEnvironment": {},
  "publicEvents": [],
  "hiddenEvents": [],
  "rules": []
}
```

### 7.3 会话状态

```json
{
  "currentWorldId": "",
  "currentLocation": "",
  "currentTime": "",
  "activeCharacters": [],
  "knownPowerSystems": [],
  "activeConflicts": [],
  "stateChanges": [],
  "combatLogs": []
}
```

---

