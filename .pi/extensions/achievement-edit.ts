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

const Params = Type.Object({
  action: StringEnum(["init", "status", "build-rd100", "roll-world", "claim", "validate"] as const, { description: "Achievement tool action" }),
  card: Type.Optional(Type.String({ description: "Registered card key or directory path. Default: protagonist" })),
  cardPath: Type.Optional(Type.String({ description: "Directory card path relative to project root" })),
  currentWorldRating: Type.Optional(Type.Any({ description: "Current world N rating" })),
  currentWorldTopRating: Type.Optional(Type.Any({ description: "Current world top N rating" })),
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

function resolveCard(params: any): { key: string; dir: string } {
  if (params.cardPath) return { key: params.card || params.cardPath, dir: safePath(params.cardPath) };
  const wanted = params.card || "protagonist";
  const cfg = existsSync(CONFIG) ? readJson(CONFIG) : {};
  for (const group of [cfg.cards || {}, cfg.npcs || {}]) for (const [key, def] of Object.entries(group) as any) if (key === wanted || (def.aliases || []).includes(wanted)) return { key, dir: join(ROOT, def.path) };
  if (cfg.allowUnregisteredCardFiles && !wanted.endsWith(".json")) return { key: wanted, dir: safePath(wanted) };
  throw new Error("Unknown directory card: " + wanted);
}
function stateFile(cardDir: string): string { return join(cardDir, "progression", "achievements.json"); }
function normalizeState(state: any, characterId: string): any { state.characterId = state.characterId || characterId; for (const k of ["achievements", "rewardRolls", "pendingClaims", "claimedRewards", "ownedRewardIds", "claimedRewardIds", "pendingRewardIds", "worldRollTables", "auditLog"]) state[k] = state[k] || []; return state; }
function defaultState(characterId: string): any { const base = existsSync(TEMPLATE) ? readJson(TEMPLATE) : { schema: "rp-achievements-v1", mode: "protagonist-exclusive-cheat-achievement-system", owner: "protagonist-only", visibility: "hidden-by-default", panel: { defaultVisible: false, requiresManualOpen: true, hasActiveAbility: false, visibleSections: ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"], hiddenSections: [] }, settings: { rerollOnDuplicate: true } }; return normalizeState(base, characterId); }
function loadState(file: string): any { if (!existsSync(file)) throw new Error("Achievement state not found; run init first: " + rel(file)); return normalizeState(readJson(file), "protagonist"); }

function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle<T>(arr: T[]): T[] { const out = [...arr]; for (let i = out.length - 1; i > 0; i--) { const j = rand(0, i); [out[i], out[j]] = [out[j], out[i]]; } return out; }
function worldList(file: string): any[] { if (!existsSync(file)) return []; const data = readJson(file); return Array.isArray(data) ? data : (data.worlds || []); }
function buildRd100(currentWorldRating: any, currentWorldTopRating: any): any {
  const allArchived = worldList(ARCHIVED), allUnarchived = worldList(UNARCHIVED);
  const archived = allArchived.filter(w => w.ratingMismatch !== true), unarchived = allUnarchived.filter(w => w.ratingMismatch !== true);
  const rejectedForRating = [...allArchived, ...allUnarchived].filter(w => w.ratingMismatch === true);
  let slots: any[] = [];
  for (const w of archived) for (let i = 0; i < 3; i++) slots.push({ source: "archivedWorld", requiresWebVerification: false, ...w, world: w.name || w.world });
  for (const w of unarchived) for (let i = 0; i < 2; i++) slots.push({ source: "unarchivedWorld", requiresWebVerification: true, ...w, world: w.name || w.world });
  slots = shuffle(slots).slice(0, 100);
  while (slots.length < 100) slots.push({ source: "randomAnimeGameWorld", world: null, requiresWebVerification: true });
  return { id: "rd100-" + new Date().toISOString(), type: ".rd100", currentWorldRating: currentWorldRating || null, currentWorldTopRating: currentWorldTopRating || null, slots: shuffle(slots).map((s, i) => ({ roll: i + 1, ...s })), shuffle: true, rejectedForRating };
}
function visibleStatus(state: any): any { return { panel: { defaultVisible: false, requiresManualOpen: true, visibleSections: ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"] }, unlockedAchievements: (state.achievements || []).filter((a: any) => a.state === "unlocked" || a.unlockedAt).map((a: any) => ({ id: a.id, name: a.name, tier: a.tier, unlockedAt: a.unlockedAt })), currentCharacterStatus: { characterId: state.characterId, enabled: !!state.enabled, currentWorldRating: state.currentWorldRating || null, currentWorldTopRating: state.currentWorldTopRating || null }, claimableRewards: (state.pendingClaims || []).map((r: any) => ({ rewardId: r.rewardId || r.id, name: r.name, state: r.state || "pendingClaim", achievementId: r.achievementId })) }; }
function uniquePush(arr: any[], value: any): void { if (value && !arr.includes(value)) arr.push(value); }
function claim(state: any, rewardId: string): any { const idx = (state.pendingClaims || []).findIndex((r: any) => String(r.rewardId || r.id) === rewardId); if (idx < 0) throw new Error("Pending reward not found: " + rewardId); if ((state.claimedRewardIds || []).includes(rewardId) || (state.ownedRewardIds || []).includes(rewardId)) throw new Error("Reward already claimed/owned: " + rewardId); const pending = state.pendingClaims.splice(idx, 1)[0]; state.pendingRewardIds = (state.pendingRewardIds || []).filter((id: string) => id !== rewardId); const claimed = { ...pending, rewardId, state: "claimed", claimedAt: new Date().toISOString() }; state.claimedRewards.push(claimed); uniquePush(state.claimedRewardIds, rewardId); uniquePush(state.ownedRewardIds, rewardId); state.auditLog.push({ at: claimed.claimedAt, action: "claim", rewardId }); return claimed; }
function validateState(state: any) { const errors: string[] = [], warnings: string[] = []; if (state.owner !== "protagonist-only") errors.push("owner must be protagonist-only"); if (state.visibility !== "hidden-by-default") errors.push("visibility must be hidden-by-default"); const allowed = ["unlockedAchievements", "currentCharacterStatus", "claimableRewards"]; for (const x of state.panel?.visibleSections || []) if (!allowed.includes(x)) errors.push("illegal panel visible section: " + x); const ids = [...(state.ownedRewardIds || []), ...(state.claimedRewardIds || []), ...(state.pendingRewardIds || [])]; const dupes = ids.filter((id, i) => id && ids.indexOf(id) !== i); if (dupes.length) warnings.push("duplicate reward ids across sets: " + [...new Set(dupes)].join(", ")); return { ok: errors.length === 0, errors, warnings }; }
function validateExamples() { const errors: string[] = [], files: string[] = []; if (!existsSync(EXAMPLES)) return { ok: true, errors, files }; for (const name of readdirSync(EXAMPLES)) { if (!name.endsWith(".json")) continue; const file = join(EXAMPLES, name); files.push(rel(file)); try { const doc = readJson(file); const e = doc.candidate || doc; if (doc.exampleOnly !== true) errors.push(`${rel(file)} must be marked exampleOnly`); if (doc.generationMode !== "instantGeneratedCandidate") errors.push(`${rel(file)} must use instantGeneratedCandidate`); if (!e.id) errors.push(`${rel(file)} candidate missing id`); if (!e.canon?.required) errors.push(`${rel(file)} ${e.id || "candidate"} missing canon.required`); if (!e.rewardRating?.rating) errors.push(`${rel(file)} ${e.id || "candidate"} missing rewardRating.rating`); } catch (err: any) { errors.push(`${rel(file)} parse failed: ${err.message}`); } } return { ok: errors.length === 0, errors, files }; }

export default function (pi: ExtensionAPI) {
  pi.registerTool({ name: "achievement_edit", label: "Achievement Edit", description: "Project-local protagonist achievement tool: init/status/build-rd100/roll-world/claim/validate.", parameters: Params, async execute(_id, params, _signal, _onUpdate, _ctx) {
    const max = cap(params.maxBytes);
    try {
      const card = resolveCard(params), file = stateFile(card.dir), doBackup = params.backup !== false;
      if (params.action === "init") { const exists = existsSync(file); const state = exists ? loadState(file) : defaultState(card.key); if (params.currentWorldRating) state.currentWorldRating = params.currentWorldRating; if (params.currentWorldTopRating) state.currentWorldTopRating = params.currentWorldTopRating; let b: string | undefined; if (!params.dryRun) { if (doBackup && exists) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, action: "init", file: rel(file), state, dryRun: !!params.dryRun }, { ok: true, backupPath: b && rel(b) }, max); }
      const state = loadState(file);
      if (params.action === "status") return jsonOut({ ok: true, file: rel(file), status: visibleStatus(state) }, { ok: true }, max);
      if (params.action === "build-rd100") { const table = buildRd100(params.currentWorldRating || state.currentWorldRating, params.currentWorldTopRating || state.currentWorldTopRating); state.worldRollTables.push(table); if (params.currentWorldRating) state.currentWorldRating = params.currentWorldRating; if (params.currentWorldTopRating) state.currentWorldTopRating = params.currentWorldTopRating; let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, table }, { ok: true, backupPath: b && rel(b), dryRun: !!params.dryRun }, max); }
      if (params.action === "roll-world") { const table = buildRd100(params.currentWorldRating || state.currentWorldRating, params.currentWorldTopRating || state.currentWorldTopRating); const roll = params.roll ? Math.max(1, Math.min(100, Math.floor(params.roll))) : rand(1, 100); const selected = table.slots.find((s: any) => s.roll === roll); const record = { id: "world-roll-" + new Date().toISOString(), tableId: table.id, roll, selected }; state.worldRollTables.push(table); state.rewardRolls.push(record); let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, roll: record, requiresWebVerification: !!selected?.requiresWebVerification }, { ok: true, backupPath: b && rel(b), dryRun: !!params.dryRun }, max); }
      if (params.action === "claim") { if (!params.rewardId) throw new Error("claim requires rewardId"); const claimed = claim(state, params.rewardId); let b: string | undefined; if (!params.dryRun) { if (doBackup) b = backupFile(file); writeJson(file, state); } return jsonOut({ ok: true, claimed, dryRun: !!params.dryRun }, { ok: true, backupPath: b && rel(b) }, max); }
      if (params.action === "validate") { const s = validateState(state), p = validateExamples(); return jsonOut({ ok: s.ok && p.ok, state: s, instantCandidateExamples: p }, { ok: s.ok && p.ok }, max); }
      throw new Error("Unknown action: " + params.action);
    } catch (err: any) { return fail(err.message || String(err), max); }
  } });
}
