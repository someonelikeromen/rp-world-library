import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ROOT = process.cwd();
const CONFIG = join(ROOT, ".pi", "rp-data-tools.json");
const TEMPLATE = join(ROOT, ".pi", "skills", "rp-combat", "framework", "card-template", "unified-character-v1", "progression", "achievements.json");
const ARCHIVED = join(ROOT, "data", "rp-achievements", "worlds.archived.json");
const UNARCHIVED = join(ROOT, "data", "rp-achievements", "worlds.unarchived-candidates.json");
const EXAMPLES = join(ROOT, "data", "rp-achievements", "examples", "instant-candidates");
const SETTINGS = join(ROOT, "data", "rp-achievements", "settings.json");

const Params = Type.Object({
  action: StringEnum(["init", "status", "build-rd100", "roll-world", "claim", "validate"] as const, { description: "Achievement tool action. Every action actively loads data/rp-achievements/settings.json first." }),
  card: Type.Optional(Type.String({ description: "Registered card key or directory path. Default: protagonist" })),
  cardPath: Type.Optional(Type.String({ description: "Directory card path relative to project root" })),
  currentWorldRating: Type.Optional(Type.Any({ description: "Current world N rating" })),
  currentWorldTopRating: Type.Optional(Type.Any({ description: "Current world top N rating" })),
  currentWorld: Type.Optional(Type.Any({ description: "Optional current world exposure object, e.g. {name, hasEnergySystem:false}" })),
  experiencedWorlds: Type.Optional(Type.Array(Type.Any(), { description: "Optional worlds already experienced by protagonist, used only for energy exposure gate" })),
  worldExposure: Type.Optional(Type.Any({ description: "Optional full world exposure state override" })),
  roll: Type.Optional(Type.Number({ description: "Explicit d100 roll" })),
  rewardId: Type.Optional(Type.String({ description: "Reward id for claim" })),
  dryRun: Type.Optional(Type.Boolean({ description: "Preview without writing" })),
  backup: Type.Optional(Type.Boolean({ description: "Backup before mutation. Default true" })),
  maxBytes: Type.Optional(Type.Number({ description: "Max returned bytes" })),
});

function readJson(file: string): any { return JSON.parse(readFileSync(file, "utf8")); }
function writeJson(file: string, value: any): void { mkdirSync(dirname(file), { recursive: true }); const tmp = file + ".tmp-" + process.pid + "-" + Date.now(); writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", "utf8"); renameSync(tmp, file); }
function rel(file: string): string { return file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/"); }
function cap(n?: number): number { return Number.isFinite(n as number) ? Math.max(1000, Math.min(50000, Math.floor(n as number))) : 16000; }
function jsonOut(payload: unknown, details: Record<string, unknown>, max: number) { const raw = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2); const total = Buffer.byteLength(raw, "utf8"); const text = total <= max ? raw : raw.slice(0, max) + `\n\n[achievement_edit truncated: ${max}/${total} bytes shown]`; return { content: [{ type: "text" as const, text }], details: { ...details, truncation: { truncated: total > max, totalBytes: total, outputBytes: Math.min(max, total) } } }; }
function fail(message: string, max: number) { return jsonOut({ ok: false, error: message }, { ok: false }, max); }
function safePath(p: string): string { if (p.includes("..") || p.startsWith("/") || /^[A-Za-z]:/.test(p)) throw new Error("Unsafe path: " + p); return join(ROOT, p); }
function backupFile(file: string): string | undefined { if (!existsSync(file)) return undefined; const dir = join(ROOT, "backup", "achievement-edits"); mkdirSync(dir, { recursive: true }); const out = join(dir, new Date().toISOString().replace(/[:.]/g, "-") + "-" + file.split(/[\\/]/).pop()); writeFileSync(out, readFileSync(file, "utf8"), "utf8"); return out; }

function getAt(obj: any, dotPath: string): any { return String(dotPath || "").split(".").filter(Boolean).reduce((cur, key) => cur == null ? undefined : cur[key], obj); }
function normalizeToken(value: any): any { if (typeof value === "boolean") return value; if (value == null) return undefined; return String(value).trim().toLowerCase(); }
function tokenIn(list: any[] = [], value: any): boolean { const token = normalizeToken(value); return list.some(item => normalizeToken(item) === token); }

function loadAchievementSettings(): any {
  if (!existsSync(SETTINGS)) throw new Error("Achievement system settings not found: " + rel(SETTINGS));
  const settings = readJson(SETTINGS);
  if (settings.schema !== "rp-achievement-system-settings-v1") throw new Error("Unsupported achievement settings schema: " + settings.schema);
  if (settings.loadPolicy?.required !== true) throw new Error("Achievement settings must declare loadPolicy.required=true");
  if (settings.rewardGeneration?.globalRandomPool !== true) throw new Error("Achievement reward generation must keep globalRandomPool=true");
  if (!settings.rewardGeneration?.energyGate?.enabled) throw new Error("Achievement reward generation must enable energyGate");
  if (settings.ui?.theme !== "translucent-cyan-sci-fi") throw new Error("Achievement UI theme must be translucent-cyan-sci-fi");
  if (!Array.isArray(settings.requiredRewardProvenance) || settings.requiredRewardProvenance.length === 0) throw new Error("Achievement settings missing requiredRewardProvenance");
  return settings;
}
function settingsPublicSummary(settings: any): any { return { schema: settings.schema, version: settings.version, uiTheme: settings.ui?.theme, displayName: settings.ui?.displayName, globalRandomPool: settings.rewardGeneration?.globalRandomPool, energyGate: settings.rewardGeneration?.energyGate?.decision, requiredRewardProvenance: settings.requiredRewardProvenance }; }

function resolveCard(params: any): { key: string; dir: string } {
  if (params.cardPath) return { key: params.card || params.cardPath, dir: safePath(params.cardPath) };
  const wanted = params.card || "protagonist";
  const cfg = existsSync(CONFIG) ? readJson(CONFIG) : {};
  for (const group of [cfg.cards || {}, cfg.npcs || {}]) for (const [key, def] of Object.entries(group) as any) if (key === wanted || (def.aliases || []).includes(wanted)) return { key, dir: join(ROOT, def.path) };
  if (cfg.allowUnregisteredCardFiles && !wanted.endsWith(".json")) {
    const rels = [wanted, wanted.startsWith("card/") || wanted.startsWith("card\\") ? wanted : join("card", wanted)];
    for (const rp of rels) if (existsSync(safePath(rp))) return { key: wanted, dir: safePath(rp) };
  }
  throw new Error("Unknown directory card: " + wanted);
}
function stateFile(cardDir: string): string { return join(cardDir, "progression", "achievements.json"); }
function normalizeState(state: any, characterId: string, settings: any): any {
  state.characterId = state.characterId || characterId;
  for (const k of ["achievements", "rewardRolls", "pendingClaims", "claimedRewards", "ownedRewardIds", "claimedRewardIds", "pendingRewardIds", "worldRollTables", "auditLog", "instantCandidateRecords"]) state[k] = state[k] || [];
  state.panel = state.panel || {};
  state.panel.ui = settings.ui;
  state.panel.visibleSections = state.panel.visibleSections || ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"];
  state.systemSettings = { schema: settings.schema, version: settings.version, path: rel(SETTINGS), loadedAt: new Date().toISOString() };
  state.worldExposure = state.worldExposure || { currentWorld: null, experiencedWorlds: [], energyExposure: { hasEnergySystem: null, basis: [] } };
  return state;
}
function defaultState(characterId: string, settings: any): any { const base = existsSync(TEMPLATE) ? readJson(TEMPLATE) : { schema: "rp-achievements-v1", mode: "protagonist-exclusive-cheat-achievement-system", owner: "protagonist-only", visibility: "hidden-by-default", panel: { defaultVisible: false, requiresManualOpen: true, hasActiveAbility: false, visibleSections: ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"], hiddenSections: [] }, settings: { rerollOnDuplicate: true } }; return normalizeState(base, characterId, settings); }
function loadState(file: string, settings: any): any { if (!existsSync(file)) throw new Error("Achievement state not found; run init first: " + rel(file)); return normalizeState(readJson(file), "protagonist", settings); }
function applyExposureParams(state: any, params: any): void { if (params.worldExposure) state.worldExposure = params.worldExposure; state.worldExposure = state.worldExposure || {}; if (params.currentWorld) state.worldExposure.currentWorld = params.currentWorld; if (params.experiencedWorlds) state.worldExposure.experiencedWorlds = params.experiencedWorlds; }

function energyValue(value: any, settings: any): boolean | undefined { const gate = settings.rewardGeneration.energyGate; if (tokenIn(gate.energyValues, value)) return true; if (tokenIn(gate.noEnergyValues, value)) return false; return undefined; }
function worldEnergyValue(world: any, settings: any): boolean | undefined { if (!world || typeof world !== "object") return undefined; for (const key of ["hasEnergySystem", "energySystem", "energyType", "powerSystem"]) { const parsed = energyValue(world[key], settings); if (parsed !== undefined) return parsed; } if (world.energyProfile && typeof world.energyProfile === "object") return energyValue(world.energyProfile.hasEnergySystem ?? world.energyProfile.type ?? world.energyProfile.name, settings); return undefined; }
function evaluateEnergyExposure(state: any, settings: any): any {
  const gate = settings.rewardGeneration.energyGate;
  const values: boolean[] = [], basis: any[] = [];
  for (const p of gate.exposureStatePaths || []) { const value = getAt(state, p); const parsed = energyValue(value, settings); if (parsed !== undefined) { values.push(parsed); basis.push({ path: p, value, hasEnergySystem: parsed }); } }
  const currentWorld = state.worldExposure?.currentWorld || state.currentWorld;
  const curParsed = worldEnergyValue(currentWorld, settings);
  if (curParsed !== undefined) { values.push(curParsed); basis.push({ path: "worldExposure.currentWorld", value: currentWorld, hasEnergySystem: curParsed }); }
  const worlds = [...(state.worldExposure?.experiencedWorlds || []), ...(state.experiencedWorlds || []), ...(state.pastWorlds || [])];
  worlds.forEach((world: any, idx: number) => { const parsed = worldEnergyValue(world, settings); if (parsed !== undefined) { values.push(parsed); basis.push({ path: `experiencedWorlds[${idx}]`, value: world, hasEnergySystem: parsed }); } });
  const hasEnergySystem = values.includes(true);
  const allKnownNoEnergy = values.length > 0 && values.every(v => v === false);
  return { hasEnergySystem, allKnownNoEnergy, energyAllowed: hasEnergySystem || !allKnownNoEnergy, knownWorldCount: values.length, unknownExposure: values.length === 0, basis, decision: gate.decision };
}
function classifyRewardEnergy(reward: any, settings: any): any { const gate = settings.rewardGeneration.energyGate; if (reward?.energyClassification?.requiresEnergySystem === true || reward?.requiresEnergySystem === true) return { requiresEnergySystem: true, basis: ["explicit requiresEnergySystem"] }; if (reward?.energyClassification?.requiresEnergySystem === false || reward?.requiresEnergySystem === false) return { requiresEnergySystem: false, basis: ["explicit non-energy reward"] }; const typeRule = settings.rewardGeneration.rewardTypes?.[reward?.type] || {}; if (typeRule.defaultRequiresEnergySystem === true) return { requiresEnergySystem: true, basis: [`type ${reward.type} defaults to energy`] }; const text = JSON.stringify({ id: reward?.id, name: reward?.name, type: reward?.type, canon: reward?.canon, origin: reward?.origin, minimumUseGrant: reward?.minimumUseGrant }).toLowerCase(); const hits = (gate.energyRewardMarkers || []).filter((m: string) => text.includes(String(m).toLowerCase())); return { requiresEnergySystem: hits.length > 0, basis: hits.map((hit: string) => `marker:${hit}`) }; }
function shouldRerollReward(reward: any, state: any, settings: any): any { const classification = classifyRewardEnergy(reward, settings); const exposure = evaluateEnergyExposure(state, settings); const reroll = settings.rewardGeneration.energyGate.rerollEnergyRewardsWhenNoEnergyExposure === true && classification.requiresEnergySystem && exposure.allKnownNoEnergy && !exposure.hasEnergySystem; return { reroll, classification, exposure }; }

function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle<T>(arr: T[]): T[] { const out = [...arr]; for (let i = out.length - 1; i > 0; i--) { const j = rand(0, i); [out[i], out[j]] = [out[j], out[i]]; } return out; }
function worldList(file: string): any[] { if (!existsSync(file)) return []; const data = readJson(file); return Array.isArray(data) ? data : (data.worlds || []); }
function buildRd100(settings: any, currentWorldRating: any, currentWorldTopRating: any): any {
  const rd100 = settings.rd100 || {};
  const allArchived = worldList(ARCHIVED), allUnarchived = worldList(UNARCHIVED);
  const archived = allArchived.filter(w => w.ratingMismatch !== true), unarchived = allUnarchived.filter(w => w.ratingMismatch !== true);
  const rejectedForRating = [...allArchived, ...allUnarchived].filter(w => w.ratingMismatch === true);
  let slots: any[] = [];
  for (const w of archived) for (let i = 0; i < (rd100.archivedWorldSlots ?? 3); i++) slots.push({ source: "archivedWorld", requiresWebVerification: false, ...w, world: w.name || w.world });
  for (const w of unarchived) for (let i = 0; i < (rd100.unarchivedWorldSlots ?? 2); i++) slots.push({ source: "unarchivedWorld", requiresWebVerification: true, ...w, world: w.name || w.world });
  slots = shuffle(slots).slice(0, 100);
  while (slots.length < 100) slots.push({ source: rd100.fillRemainderWith || "randomAnimeGameWorld", world: null, requiresWebVerification: true });
  return { id: "rd100-" + new Date().toISOString(), type: ".rd100", settingsVersion: settings.version, currentWorldRating: currentWorldRating || null, currentWorldTopRating: currentWorldTopRating || null, slots: (rd100.shuffle === false ? slots : shuffle(slots)).map((s, i) => ({ roll: i + 1, ...s })), shuffle: rd100.shuffle !== false, rejectedForRating };
}

function rewardCore(entry: any): any { return entry?.reward || entry || {}; }
function rewardDisplay(entry: any, state: any, settings: any, fallbackState?: string): any {
  const reward = rewardCore(entry);
  const id = String(entry?.rewardId || reward.id || entry?.id || "");
  const decision = shouldRerollReward(reward, state, settings);
  return { rewardId: id, name: entry?.name || reward.name, type: reward.type, achievementId: entry?.achievementId || reward.achievementId || null, rewardState: entry?.state || reward.state || fallbackState || "unclaimed", claimed: (state.claimedRewardIds || []).includes(id) || (state.ownedRewardIds || []).includes(id) || entry?.state === "claimed", claimedAt: entry?.claimedAt || reward.claimedAt || null, sourceWorld: reward.origin?.sourceWorld || reward.canon?.work || null, originalOwner: reward.origin?.originalOwner || reward.canon?.holderOrUser || null, originalOwnerExperience: reward.origin?.originalOwnerExperience || null, realmOrStage: reward.origin?.realmOrStage || null, masteryLevel: reward.origin?.masteryLevel || null, protagonistCurrentUsability: reward.origin?.protagonistCurrentUsability || null, limitations: reward.origin?.limitations || null, energy: { requiresEnergySystem: decision.classification.requiresEnergySystem, rerollRequiredNow: decision.reroll, basis: decision.classification.basis }, reward };
}
function collectRewardDisplays(state: any, settings: any): any[] {
  const out: any[] = [];
  for (const a of state.achievements || []) for (const r of a.rewards || []) out.push(rewardDisplay({ ...r, achievementId: r.achievementId || a.id }, state, settings));
  for (const r of state.pendingClaims || []) out.push(rewardDisplay(r, state, settings, "pendingClaim"));
  for (const r of state.claimedRewards || []) out.push(rewardDisplay(r, state, settings, "claimed"));
  const seen = new Set<string>();
  return out.filter(r => { const key = r.rewardId + ":" + r.rewardState; if (seen.has(key)) return false; seen.add(key); return true; });
}
function visibleStatus(state: any, settings: any): any {
  const rewards = collectRewardDisplays(state, settings);
  const achievements = (state.achievements || []).map((a: any) => ({ id: a.id, name: a.name, tier: a.tier, condition: a.condition || a.description || null, progress: a.progress || null, state: a.state || (a.unlockedAt ? "unlocked" : "locked"), unlockedAt: a.unlockedAt || null, rewards: rewards.filter(r => r.achievementId === a.id).map(r => ({ rewardId: r.rewardId, name: r.name, rewardState: r.rewardState, claimed: r.claimed })) }));
  const energyGate = evaluateEnergyExposure(state, settings);
  return { panel: { defaultVisible: false, requiresManualOpen: true, hasActiveAbility: false, ui: settings.ui, displayMode: settings.ui.displayName || "半透明淡蓝色科幻光屏", visibleSections: settings.ui.sections, visibilityBoundary: settings.ui.visibilityBoundary }, achievements, rewards, claimStatus: { pending: rewards.filter(r => r.rewardState === "pendingClaim"), claimed: rewards.filter(r => r.claimed), pendingRewardIds: state.pendingRewardIds || [], claimedRewardIds: state.claimedRewardIds || [], ownedRewardIds: state.ownedRewardIds || [] }, characterStatus: { characterId: state.characterId, enabled: !!state.enabled, currentWorldRating: state.currentWorldRating || null, currentWorldTopRating: state.currentWorldTopRating || null, currentWorld: state.worldExposure?.currentWorld || null, experiencedWorlds: state.worldExposure?.experiencedWorlds || [], rewardCount: rewards.length }, energyGate, settings: settingsPublicSummary(settings) };
}
function uniquePush(arr: any[], value: any): void { if (value && !arr.includes(value)) arr.push(value); }
function validateReward(reward: any, state: any, settings: any): any { const errors: string[] = []; const allowedTypes = Object.keys(settings.rewardGeneration?.rewardTypes || {}); if (!allowedTypes.includes(reward?.type)) errors.push("invalid reward type: " + reward?.type); if (!reward?.canon?.required) errors.push("missing canon.required"); for (const key of ["sourceType", "work", "appearsAs", "evidence"]) if (!reward?.canon?.[key]) errors.push("missing canon." + key); for (const p of settings.requiredRewardProvenance || []) if (getAt(reward, p) == null || getAt(reward, p) === "") errors.push("missing " + p); const decision = shouldRerollReward(reward, state, settings); if (decision.reroll) errors.push("energy-gated reward must be rerolled under current no-energy exposure"); return { ok: errors.length === 0, errors, energyDecision: decision }; }
function claim(state: any, rewardId: string, settings: any): any { const idx = (state.pendingClaims || []).findIndex((r: any) => String(r.rewardId || r.id) === rewardId); if (idx < 0) throw new Error("Pending reward not found: " + rewardId); if ((state.claimedRewardIds || []).includes(rewardId) || (state.ownedRewardIds || []).includes(rewardId)) throw new Error("Reward already claimed/owned: " + rewardId); const pending = state.pendingClaims[idx]; const reward = rewardCore(pending); const validation = validateReward(reward, state, settings); if (!validation.ok) throw new Error("Pending reward failed achievement-system validation before claim: " + validation.errors.join("; ")); state.pendingClaims.splice(idx, 1); state.pendingRewardIds = (state.pendingRewardIds || []).filter((id: string) => id !== rewardId); const claimed = { ...pending, rewardId, state: "claimed", claimedAt: new Date().toISOString() }; state.claimedRewards.push(claimed); uniquePush(state.claimedRewardIds, rewardId); uniquePush(state.ownedRewardIds, rewardId); state.auditLog.push({ at: claimed.claimedAt, action: "claim", rewardId }); return claimed; }
function validateState(state: any, settings: any) { const errors: string[] = [], warnings: string[] = []; if (state.owner !== "protagonist-only") errors.push("owner must be protagonist-only"); if (state.visibility !== "hidden-by-default") errors.push("visibility must be hidden-by-default"); const allowed = ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"]; for (const x of state.panel?.visibleSections || []) if (!allowed.includes(x)) errors.push("illegal panel visible section: " + x); const ids = [...(state.ownedRewardIds || []), ...(state.claimedRewardIds || []), ...(state.pendingRewardIds || [])]; const dupes = ids.filter((id, i) => id && ids.indexOf(id) !== i); if (dupes.length) warnings.push("duplicate reward ids across sets: " + [...new Set(dupes)].join(", ")); for (const r of collectRewardDisplays(state, settings)) { const v = validateReward(r.reward, state, settings); if (!v.ok) errors.push(`reward ${r.rewardId || r.name}: ${v.errors.join("; ")}`); } return { ok: errors.length === 0, errors, warnings, energyGate: evaluateEnergyExposure(state, settings), settings: settingsPublicSummary(settings) }; }
function validateExamples(settings: any) { const errors: string[] = [], files: string[] = []; if (!existsSync(EXAMPLES)) return { ok: true, errors, files }; const dummyState = { worldExposure: { currentWorld: { name: "示例能量世界", hasEnergySystem: true }, experiencedWorlds: [] } }; for (const name of readdirSync(EXAMPLES)) { if (!name.endsWith(".json")) continue; const file = join(EXAMPLES, name); files.push(rel(file)); try { const doc = readJson(file); const e = doc.candidate || doc; if (doc.exampleOnly !== true) errors.push(`${rel(file)} must be marked exampleOnly`); if (doc.generationMode !== "instantGeneratedCandidate") errors.push(`${rel(file)} must use instantGeneratedCandidate`); const v = validateReward(e, dummyState, settings); if (!v.ok) errors.push(`${rel(file)} ${e.id || "candidate"}: ${v.errors.join("; ")}`); } catch (err: any) { errors.push(`${rel(file)} parse failed: ${err.message}`); } } return { ok: errors.length === 0, errors, files }; }

export default function (pi: ExtensionAPI) {
  pi.registerTool({ name: "achievement_edit", label: "Achievement Edit", description: "Project-local protagonist achievement tool. Every action loads data/rp-achievements/settings.json; status returns a translucent cyan sci-fi panel with achievements, rewards, claim state, character status, and energy-gate summary.", parameters: Params, async execute(_id, params, _signal, _onUpdate, _ctx) {
    const max = cap(params.maxBytes);
    try {
      const settings = loadAchievementSettings();
      const card = resolveCard(params), file = stateFile(card.dir), doBackup = params.backup !== false;
      if (params.action === "init") { const exists = existsSync(file); const state = exists ? loadState(file, settings) : defaultState(card.key, settings); if (params.currentWorldRating) state.currentWorldRating = params.currentWorldRating; if (params.currentWorldTopRating) state.currentWorldTopRating = params.currentWorldTopRating; applyExposureParams(state, params); let b: string | undefined; if (!params.dryRun) { if (doBackup && exists) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, action: "init", settings: settingsPublicSummary(settings), file: rel(file), display: visibleStatus(state, settings), state, dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), backupPath: b && rel(b) }, max); }
      const state = loadState(file, settings);
      applyExposureParams(state, params);
      if (params.action === "status") { const display = visibleStatus(state, settings); return jsonOut({ ok: true, file: rel(file), settings: settingsPublicSummary(settings), display, status: display }, { ok: true, settingsLoaded: rel(SETTINGS), uiTheme: settings.ui.theme }, max); }
      if (params.action === "build-rd100") { const table = buildRd100(settings, params.currentWorldRating || state.currentWorldRating, params.currentWorldTopRating || state.currentWorldTopRating); state.worldRollTables.push(table); if (params.currentWorldRating) state.currentWorldRating = params.currentWorldRating; if (params.currentWorldTopRating) state.currentWorldTopRating = params.currentWorldTopRating; let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, settings: settingsPublicSummary(settings), table }, { ok: true, settingsLoaded: rel(SETTINGS), backupPath: b && rel(b), dryRun: !!params.dryRun }, max); }
      if (params.action === "roll-world") { const table = buildRd100(settings, params.currentWorldRating || state.currentWorldRating, params.currentWorldTopRating || state.currentWorldTopRating); const roll = params.roll ? Math.max(1, Math.min(100, Math.floor(params.roll))) : rand(1, 100); const selected = table.slots.find((s: any) => s.roll === roll); const record = { id: "world-roll-" + new Date().toISOString(), tableId: table.id, roll, selected }; state.worldRollTables.push(table); state.rewardRolls.push(record); let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, settings: settingsPublicSummary(settings), roll: record, requiresWebVerification: !!selected?.requiresWebVerification }, { ok: true, settingsLoaded: rel(SETTINGS), backupPath: b && rel(b), dryRun: !!params.dryRun }, max); }
      if (params.action === "claim") { if (!params.rewardId) throw new Error("claim requires rewardId"); const claimed = claim(state, params.rewardId, settings); let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, settings: settingsPublicSummary(settings), claimed, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), backupPath: b && rel(b) }, max); }
      if (params.action === "validate") { const s = validateState(state, settings), p = validateExamples(settings); return jsonOut({ ok: s.ok && p.ok, settings: settingsPublicSummary(settings), state: s, instantCandidateExamples: p, display: visibleStatus(state, settings) }, { ok: s.ok && p.ok, settingsLoaded: rel(SETTINGS) }, max); }
      throw new Error("Unknown action: " + params.action);
    } catch (err: any) { return fail(err.message || String(err), max); }
  } });
}
