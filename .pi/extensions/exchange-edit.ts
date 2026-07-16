import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ROOT = process.cwd();
const CONFIG = join(ROOT, ".pi", "rp-data-tools.json");
const SETTINGS = join(ROOT, "data", "rp-exchange", "settings.json");
const TEMPLATE = join(ROOT, ".pi", "skills", "rp-combat", "framework", "card-template", "unified-character-v1", "progression", "exchange.json");

type Action = "init" | "status" | "evaluate" | "price" | "grant-points" | "normalize-points" | "validate-entry" | "quote" | "add-entry" | "pending" | "complete" | "record-source" | "validate";

const Params = Type.Object({
  action: StringEnum(["init", "status", "evaluate", "price", "grant-points", "normalize-points", "validate-entry", "quote", "add-entry", "pending", "complete", "record-source", "validate"] as const, { description: "Exchange tool action. Pricing must be based on multi-world rating evaluation, then mapped by N tier only." }),
  card: Type.Optional(Type.String({ description: "Registered card key or directory path. Default: protagonist" })),
  cardPath: Type.Optional(Type.String({ description: "Directory card path relative to project root" })),
  enabled: Type.Optional(Type.Boolean({ description: "For init, set exchange enabled" })),
  rating: Type.Optional(Type.Any({ description: "Known N rating for price action, e.g. N12 or 12" })),
  pointLevel: Type.Optional(Type.Number({ description: "Reward point level, e.g. 1 means 1级奖励点" })),
  amount: Type.Optional(Type.Number({ description: "Reward point amount" })),
  reason: Type.Optional(Type.String({ description: "Reason for grant/transaction; must be a major-event reason" })),
  eventRef: Type.Optional(Type.String({ description: "Memory/event reference proving major-event reward source" })),
  entry: Type.Optional(Type.Any({ description: "Exchange entry object" })),
  entryId: Type.Optional(Type.String({ description: "Exchange entry id" })),
  sources: Type.Optional(Type.Array(Type.Any(), { description: "Source verification records for record-source" })),
  cardModuleUpdates: Type.Optional(Type.Array(Type.String(), { description: "Modules updated outside this tool after completion" })),
  memoryUpdates: Type.Optional(Type.Array(Type.String(), { description: "Memory files updated outside this tool after completion" })),
  dryRun: Type.Optional(Type.Boolean({ description: "Preview without writing" })),
  backup: Type.Optional(Type.Boolean({ description: "Backup before mutation. Default true" })),
  maxBytes: Type.Optional(Type.Number({ description: "Max returned bytes" })),
});

const N_LABELS = [
  "N0 普通人级", "N1 街头级", "N2 墙壁级", "N3 房屋级", "N4 建筑级", "N5 街区级", "N6 城镇级", "N7 城市级", "N8 山脉/区域级", "N9 国家/大陆板块级", "N10 大陆级", "N11 月球/小行星级", "N12 行星级", "N13 大行星/恒星表层级", "N14 恒星级", "N15 星系级", "N16 星系团级", "N17 可观测宇宙级", "N18 单体宇宙级", "N19 多宇宙级", "N20 大型多元宇宙级", "N21 无限多元宇宙级", "N22 高维多元级", "N23 复杂高维结构级", "N24 外层/超维叙事结构级"
];
const RATING_DIMENSIONS = ["overall", "offense", "defense", "durability", "reaction", "mobility", "control", "perception", "mental", "hax", "resistance", "resource"];
const ALLOWED_TYPES = new Set(["physique_bloodline", "energy_foundation", "foundation_based_ability", "non_foundation_body_soul_technique", "item", "knowledge", "contract"]);
const ALLOWED_CONTRACT_SUBTYPES = new Set(["familiar_contract", "specific_character_summon_contract", "teammate_world_travel_contract"]);
const FORBIDDEN_HINTS = ["system", "系统", "情报", "攻略", "未来剧情", "秘密", "碎片", "残缺", "试用", "弱化", "单招"];
const FORBIDDEN_GRANT_HINTS = ["资源转换", "出售", "卖出", "献祭", "金钱购买", "购买", "刷", "普通任务", "日常训练", "重复劳动"];

function readJson(file: string): any { return JSON.parse(readFileSync(file, "utf8")); }
function writeJson(file: string, value: any): void { mkdirSync(dirname(file), { recursive: true }); const tmp = file + ".tmp-" + process.pid + "-" + Date.now(); writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n", "utf8"); renameSync(tmp, file); }
function rel(file: string): string { return file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/"); }
function cap(n?: number): number { return Number.isFinite(n as number) ? Math.max(1000, Math.min(50000, Math.floor(n as number))) : 16000; }
function jsonOut(payload: unknown, details: Record<string, unknown>, max: number) { const raw = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2); const total = Buffer.byteLength(raw, "utf8"); const text = total <= max ? raw : raw.slice(0, max) + `\n\n[exchange_edit truncated: ${max}/${total} bytes shown]`; return { content: [{ type: "text" as const, text }], details: { ...details, truncation: { truncated: total > max, totalBytes: total, outputBytes: Math.min(max, total) } } }; }
function fail(message: string, max: number) { return jsonOut({ ok: false, error: message }, { ok: false }, max); }
function safePath(p: string): string { if (p.includes("..") || p.startsWith("/") || /^[A-Za-z]:/.test(p)) throw new Error("Unsafe path: " + p); return join(ROOT, p); }
function backupFile(file: string): string | undefined { if (!existsSync(file)) return undefined; const dir = join(ROOT, "backup", "exchange-edits"); mkdirSync(dir, { recursive: true }); const out = join(dir, new Date().toISOString().replace(/[:.]/g, "-") + "-" + file.split(/[\\/]/).pop()); writeFileSync(out, readFileSync(file, "utf8"), "utf8"); return out; }
function now(): string { return new Date().toISOString(); }
function id(prefix: string): string { return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`; }

function loadSettings(): any {
  if (!existsSync(SETTINGS)) throw new Error("Exchange settings not found: " + rel(SETTINGS));
  const s = readJson(SETTINGS);
  if (s.schema !== "rp-exchange-settings-v1") throw new Error("Unsupported exchange settings schema: " + s.schema);
  if (s.owner !== "protagonist-only") throw new Error("Exchange settings owner must be protagonist-only");
  if (!s.priceByN || !s.currency?.conversionRate) throw new Error("Exchange settings missing priceByN/currency");
  return s;
}
function settingsSummary(settings: any): any { return { schema: settings.schema, version: settings.version, conversionRate: settings.currency.conversionRate, pricingPrinciple: "evaluate by multi-world framework, then price only by resulting N tier", allowedTypes: settings.allowedTypes, allowedContractSubtypes: settings.allowedContractSubtypes }; }

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
function stateFile(cardDir: string): string { return join(cardDir, "progression", "exchange.json"); }

function pointName(level: number): string { if (!Number.isInteger(level) || level < 1) throw new Error("pointLevel must be positive integer"); return `${level}级奖励点`; }
function parseN(value: any): number {
  if (typeof value === "number") { if (!Number.isInteger(value) || value < 0 || value > 24) throw new Error("Invalid N rating: " + value); return value; }
  if (value && typeof value === "object") return parseN(value.n ?? value.N ?? value.rating ?? value.overall);
  const m = String(value || "").match(/N\s*(\d{1,2})/i);
  if (!m) throw new Error("Invalid N rating: " + value);
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 0 || n > 24) throw new Error("Invalid N rating: " + value);
  return n;
}
function tryParseN(value: any): number | undefined { try { if (value === undefined || value === null || value === "") return undefined; return parseN(value); } catch { return undefined; } }
function priceForN(nValue: any, settings: any): any { const n = parseN(nValue); const row = settings.priceByN[`N${n}`]; if (!row) throw new Error("Missing price for N" + n); return { n, label: N_LABELS[n], amount: row.amount, pointLevel: row.pointLevel, display: `${row.amount}个${pointName(row.pointLevel)}` }; }
function zeroBalances(maxLevel = 5): any { const b: any = {}; for (let i = 1; i <= maxLevel; i++) b[pointName(i)] = 0; return b; }
function normalizeBalances(balances: any = {}, settings: any, maxLevel = 5): any { const rate = settings.currency.conversionRate; const out = zeroBalances(maxLevel); for (let i = 1; i <= maxLevel; i++) out[pointName(i)] = Number(balances[pointName(i)] || 0); for (let i = 1; i < maxLevel; i++) { const k = pointName(i), next = pointName(i + 1), carry = Math.floor(out[k] / rate); if (carry > 0) { out[k] -= carry * rate; out[next] += carry; } } return out; }
function canAfford(balances: any, price: any, settings: any): boolean { const rate = settings.currency.conversionRate; const maxLevel = Math.max(5, price.pointLevel); const b = normalizeBalances(balances, settings, maxLevel); let total = 0; for (let level = price.pointLevel; level <= maxLevel; level++) total += b[pointName(level)] * (rate ** (level - price.pointLevel)); return total >= price.amount; }
function deductPrice(balances: any, price: any, settings: any): any { if (!canAfford(balances, price, settings)) throw new Error("Insufficient reward points"); const rate = settings.currency.conversionRate; const maxLevel = Math.max(5, price.pointLevel); const b = normalizeBalances(balances, settings, maxLevel); let totalBase = 0; for (let level = 1; level <= maxLevel; level++) totalBase += b[pointName(level)] * (rate ** (level - 1)); totalBase -= price.amount * (rate ** (price.pointLevel - 1)); const out: any = {}; for (let level = maxLevel; level >= 1; level--) { const unit = rate ** (level - 1); out[pointName(level)] = Math.floor(totalBase / unit); totalBase %= unit; } return out; }
function addPoints(balances: any, amount: number, pointLevel: number, settings: any): any { if (!Number.isInteger(amount) || amount <= 0) throw new Error("amount must be positive integer"); const b = normalizeBalances(balances, settings); b[pointName(pointLevel)] = Number(b[pointName(pointLevel)] || 0) + amount; return normalizeBalances(b, settings); }

function normalizeState(state: any, characterId: string, settings: any): any {
  state.schema = state.schema || "rp-exchange-state-v1";
  state.enabled = !!state.enabled;
  state.owner = state.owner || "protagonist-only";
  state.characterId = state.characterId || characterId;
  state.mode = state.mode || { achievementIntegration: false, achievementRewardsConvertedToExchangePoints: false };
  state.currency = state.currency || {};
  state.currency.conversionRate = state.currency.conversionRate || settings.currency.conversionRate;
  for (const key of ["balances", "lifetimeEarned", "lifetimeSpent"]) state.currency[key] = normalizeBalances(state.currency[key] || {}, settings);
  for (const k of ["unlockedEntries", "pendingExchanges", "completedExchanges", "transactions", "sourceVerifications", "auditLog"]) state[k] = Array.isArray(state[k]) ? state[k] : [];
  state.systemSettings = { schema: settings.schema, version: settings.version, path: rel(SETTINGS), loadedAt: now() };
  return state;
}
function defaultState(characterId: string, settings: any): any { const base = existsSync(TEMPLATE) ? readJson(TEMPLATE) : { schema: "rp-exchange-state-v1", enabled: false, owner: "protagonist-only", currency: { conversionRate: settings.currency.conversionRate, balances: zeroBalances(), lifetimeEarned: zeroBalances(), lifetimeSpent: zeroBalances() }, unlockedEntries: [], pendingExchanges: [], completedExchanges: [], transactions: [], sourceVerifications: [], auditLog: [] }; return normalizeState(base, characterId, settings); }
function loadState(file: string, settings: any): any { if (!existsSync(file)) throw new Error("Exchange state not found; run init first: " + rel(file)); return normalizeState(readJson(file), "protagonist", settings); }

function validateType(entry: any): string[] {
  const errors: string[] = [];
  if (!ALLOWED_TYPES.has(entry?.type)) errors.push("invalid exchange type: " + entry?.type);
  if (entry?.type === "knowledge" && (entry.subtype === "information" || entry.subtype === "plot_intelligence")) errors.push("knowledge exchange must not include intelligence/information");
  if (entry?.type === "contract" && !ALLOWED_CONTRACT_SUBTYPES.has(entry?.subtype)) errors.push("invalid contract subtype: " + entry?.subtype);
  return errors;
}
function validateCompleteness(entry: any): string[] {
  const c = entry?.completeness || {};
  const errors: string[] = [];
  if (c.isCompleteUnit !== true) errors.push("exchange entry must be a complete unit");
  if (c.notFragment !== true) errors.push("exchange entry must not be fragment");
  if (c.notTrial !== true) errors.push("exchange entry must not be trial version");
  if (c.notWeakened !== true) errors.push("exchange entry must not be weakened version");
  const text = `${entry?.name || ""} ${entry?.description || ""} ${c.notes || ""}`;
  for (const hint of FORBIDDEN_HINTS) if (text.includes(hint)) errors.push("forbidden exchange hint: " + hint);
  return errors;
}
function validateSource(entry: any): string[] {
  const s = entry?.source || {};
  const errors: string[] = [];
  if (s.status === "archived") {
    if (!Array.isArray(s.refs) || s.refs.length < 1) errors.push("archived exchange entry requires world_query ref/sourceRef");
    if (s.verificationStatus !== "verified") errors.push("archived exchange entry must be verified");
  } else if (s.status === "unarchived") {
    const sources = Array.isArray(s.webSources) ? s.webSources : [];
    if (sources.length < 2) errors.push("unarchived exchange entry requires at least two independent sources");
    if (s.verificationStatus !== "verified") errors.push("unarchived exchange entry must be double-source verified");
    for (const src of sources) if (!src.url || !src.title || !src.fetchedAt || !src.summary) errors.push("each web source requires url/title/fetchedAt/summary");
  } else errors.push("source.status must be archived or unarchived");
  return errors;
}
function validateEntryBasic(entry: any): any { const errors: string[] = []; if (!entry || typeof entry !== "object") errors.push("entry must be object"); if (!entry?.id) errors.push("entry.id required"); if (!entry?.name) errors.push("entry.name required"); errors.push(...validateType(entry), ...validateCompleteness(entry), ...validateSource(entry)); return { ok: errors.length === 0, errors }; }

function evaluateEntry(entry: any): any {
  const missingEvidence: string[] = [];
  const warnings: string[] = [];
  const ev = entry?.evaluation || {};
  const dims = ev.dimensions || entry?.rating?.dimensions || {};
  const dimRatings: any = {};
  for (const [k, v] of Object.entries(dims)) {
    const n = tryParseN(v);
    if (n !== undefined) dimRatings[k] = { n, label: N_LABELS[n], raw: v };
    else warnings.push(`dimension ${k} has invalid N rating`);
  }
  const parsedDims = Object.values(dimRatings).map((x: any) => x.n);
  let n = tryParseN(ev.pricingRating ?? ev.overall ?? ev.rating ?? ev.n ?? entry?.rating?.n ?? entry?.rating?.overall);
  if (n === undefined && parsedDims.length > 0) n = Math.max(...parsedDims);
  if (n === undefined) missingEvidence.push("missing evaluated overall N rating or dimension ratings");
  const basis = ev.basis || entry?.rating?.evidence || entry?.evidence?.basis || entry?.evidence?.summary;
  if (!basis) missingEvidence.push("missing evaluation basis/evidence summary");
  if (parsedDims.length === 0) missingEvidence.push("missing multi-world rating dimensions");
  const knownDims = Object.keys(dimRatings).filter(k => RATING_DIMENSIONS.includes(k));
  if (knownDims.length === 0 && parsedDims.length > 0) warnings.push("dimension names do not match standard multi-world framework dimensions");
  if (ev.evaluationMethod !== "multi-world-evaluation-method-v1") missingEvidence.push("missing evaluationMethod: multi-world-evaluation-method-v1; read 02-rating/02-evaluation-method.md before assigning N tier");
  if (ev.framework && ev.framework !== "multi-world-combat-rating") warnings.push("evaluation.framework should be multi-world-combat-rating");
  if (ev.ratingSystem && ev.ratingSystem !== "multi-world-rating-system-n0-n24-v1") warnings.push("evaluation.ratingSystem should be multi-world-rating-system-n0-n24-v1");
  return { ok: missingEvidence.length === 0, rating: n !== undefined ? { n, label: N_LABELS[n] } : null, dimensions: dimRatings, basis: basis || null, confidence: ev.confidence || "unspecified", missingEvidence, warnings, framework: ev.framework || "multi-world-combat-rating", evaluationMethod: ev.evaluationMethod || null, ratingSystem: ev.ratingSystem || null, principle: "先读取 02-evaluation-method.md 按多世界评价方式估出兑换项自身 N 层级，再读取 03-rating-system.md 映射等级并只按层级查价格表" };
}
function quoteEntry(entry: any, state: any | undefined, settings: any): any {
  const basic = validateEntryBasic(entry);
  const evaluation = evaluateEntry(entry);
  const errors = [...basic.errors, ...evaluation.missingEvidence.map((x: string) => "evaluation: " + x)];
  const price = evaluation.rating ? priceForN(evaluation.rating.n, settings) : null;
  const afford = state && price ? canAfford(state.currency?.balances || {}, price, settings) : undefined;
  return { ok: errors.length === 0, errors, entryId: entry?.id, name: entry?.name, type: entry?.type, evaluation, price, afford };
}
function publicEntry(entry: any): any { return { id: entry.id, name: entry.name, type: entry.type, subtype: entry.subtype || null, rating: entry.rating || entry.evaluation?.rating || null, price: entry.price || null, source: { worldName: entry.source?.worldName, status: entry.source?.status, verificationStatus: entry.source?.verificationStatus, refs: entry.source?.refs || [], webSourceCount: Array.isArray(entry.source?.webSources) ? entry.source.webSources.length : 0 }, completeness: entry.completeness ? { isCompleteUnit: entry.completeness.isCompleteUnit, notFragment: entry.completeness.notFragment, notTrial: entry.completeness.notTrial, notWeakened: entry.completeness.notWeakened } : null }; }
function visibleStatus(state: any, settings: any): any { return { enabled: state.enabled, owner: state.owner, characterId: state.characterId, currency: { conversionRate: state.currency.conversionRate, balances: normalizeBalances(state.currency.balances, settings), lifetimeEarned: normalizeBalances(state.currency.lifetimeEarned, settings), lifetimeSpent: normalizeBalances(state.currency.lifetimeSpent, settings) }, unlockedEntries: (state.unlockedEntries || []).map(publicEntry), pendingExchanges: (state.pendingExchanges || []).map((x: any) => ({ id: x.id, entryId: x.entryId, entryName: x.entryName, price: x.price, state: x.state, createdAt: x.createdAt })), completedExchanges: (state.completedExchanges || []).map((x: any) => ({ id: x.id, entryId: x.entryId, entryName: x.entryName, price: x.price, completedAt: x.completedAt })), sourceVerifications: (state.sourceVerifications || []).map((x: any) => ({ id: x.id, entryId: x.entryId, status: x.status, sourceCount: Array.isArray(x.sources) ? x.sources.length : 0, updatedAt: x.updatedAt })), settings: settingsSummary(settings) }; }
function upsertById(arr: any[], item: any): void { const idx = arr.findIndex(x => String(x.id) === String(item.id)); if (idx >= 0) arr[idx] = item; else arr.push(item); }
function findEntry(state: any, entryId: string): any { return (state.unlockedEntries || []).find((e: any) => e.id === entryId) || (state.pendingExchanges || []).find((p: any) => p.entryId === entryId)?.entry; }
function validateGrantReason(reason?: string, eventRef?: string): void { if (!reason || reason.trim().length < 2) throw new Error("grant-points requires major-event reason"); for (const hint of FORBIDDEN_GRANT_HINTS) if (reason.includes(hint)) throw new Error("Forbidden reward point source: " + hint); if (!eventRef) throw new Error("grant-points requires eventRef proving major-event source"); }
function validateState(state: any, settings: any): any {
  const errors: string[] = [], warnings: string[] = [];
  if (state.schema !== "rp-exchange-state-v1") errors.push("schema must be rp-exchange-state-v1");
  if (state.owner !== "protagonist-only") errors.push("owner must be protagonist-only");
  for (const k of ["balances", "lifetimeEarned", "lifetimeSpent"]) for (const [name, value] of Object.entries(state.currency?.[k] || {})) if (!Number.isInteger(value) || (value as number) < 0) errors.push(`currency.${k}.${name} must be non-negative integer`);
  const seen = new Set<string>();
  for (const tx of state.transactions || []) { if (!tx.id) errors.push("transaction missing id"); else if (seen.has(tx.id)) errors.push("duplicate transaction id: " + tx.id); seen.add(tx.id); }
  for (const e of state.unlockedEntries || []) { const q = quoteEntry(e, state, settings); if (!q.ok) errors.push(`entry ${e.id}: ${q.errors.join("; ")}`); if (e.price && q.price && (e.price.amount !== q.price.amount || e.price.pointLevel !== q.price.pointLevel)) errors.push(`entry ${e.id}: stored price does not match evaluated N price`); }
  for (const c of state.completedExchanges || []) if (!(state.transactions || []).some((t: any) => t.entryId === c.entryId && t.state === "completed")) warnings.push("completed exchange lacks completed transaction: " + c.entryId);
  return { ok: errors.length === 0, errors, warnings };
}
function persist(file: string, state: any, params: any): { backupPath?: string } { let b: string | undefined; if (!params.dryRun) { if (params.backup !== false) b = backupFile(file); writeJson(file, state); } return { backupPath: b && rel(b) }; }

export default function (pi: ExtensionAPI) {
  pi.registerTool({ name: "exchange_edit", label: "Exchange Edit", description: "Project-local protagonist exchange system tool. Evaluates exchange entries by the multi-world combat/rating framework, maps evaluated N tiers to reward point prices, and manages progression/exchange.json ledger state.", parameters: Params, async execute(_id, params, _signal, _onUpdate, _ctx) {
    const max = cap(params.maxBytes);
    try {
      const settings = loadSettings();
      if (params.action === "price") {
        if (params.rating === undefined) throw new Error("price requires rating");
        const price = priceForN(params.rating, settings);
        return jsonOut({ ok: true, action: "price", pricingPrinciple: "price is lookup-only after multi-world framework evaluation", price, settings: settingsSummary(settings) }, { ok: true, settingsLoaded: rel(SETTINGS) }, max);
      }
      if (params.action === "evaluate") {
        if (!params.entry) throw new Error("evaluate requires entry");
        const evaluation = evaluateEntry(params.entry);
        return jsonOut({ ok: evaluation.ok, action: "evaluate", evaluation, note: "Tool enforces evaluation record structure; agent/GM must supply source-backed multi-world framework evidence." }, { ok: evaluation.ok, settingsLoaded: rel(SETTINGS) }, max);
      }
      if (params.action === "validate-entry") {
        if (!params.entry) throw new Error("validate-entry requires entry");
        const basic = validateEntryBasic(params.entry), evaluation = evaluateEntry(params.entry);
        const ok = basic.ok && evaluation.ok;
        return jsonOut({ ok, action: "validate-entry", basic, evaluation }, { ok, settingsLoaded: rel(SETTINGS) }, max);
      }
      const card = resolveCard(params), file = stateFile(card.dir);
      if (params.action === "init") {
        const exists = existsSync(file);
        const state = exists ? loadState(file, settings) : defaultState(card.key, settings);
        if (params.enabled !== undefined) state.enabled = !!params.enabled;
        state.auditLog.push({ id: id("audit"), at: now(), action: "init", enabled: state.enabled });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "init", file: rel(file), state, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      const state = loadState(file, settings);
      if (params.action === "status") return jsonOut({ ok: true, action: "status", file: rel(file), display: visibleStatus(state, settings) }, { ok: true, settingsLoaded: rel(SETTINGS) }, max);
      if (params.action === "quote") {
        if (!params.entry) throw new Error("quote requires entry");
        const q = quoteEntry(params.entry, state, settings);
        return jsonOut({ ok: q.ok, action: "quote", quote: q }, { ok: q.ok, settingsLoaded: rel(SETTINGS) }, max);
      }
      if (params.action === "grant-points") {
        validateGrantReason(params.reason, params.eventRef);
        const level = Math.floor(params.pointLevel || 1), amount = Math.floor(params.amount || 0);
        state.currency.balances = addPoints(state.currency.balances, amount, level, settings);
        state.currency.lifetimeEarned = addPoints(state.currency.lifetimeEarned, amount, level, settings);
        const tx = { id: id("grant"), state: "completed", type: "grant-points", amount, pointLevel: level, display: `${amount}个${pointName(level)}`, reason: params.reason, eventRef: params.eventRef, createdAt: now(), completedAt: now() };
        state.transactions.push(tx); state.auditLog.push({ id: id("audit"), at: now(), action: "grant-points", transactionId: tx.id });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "grant-points", transaction: tx, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "normalize-points") {
        state.currency.balances = normalizeBalances(state.currency.balances, settings);
        state.auditLog.push({ id: id("audit"), at: now(), action: "normalize-points" });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "normalize-points", display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "add-entry") {
        if (!params.entry) throw new Error("add-entry requires entry");
        const q = quoteEntry(params.entry, state, settings);
        if (!q.ok) throw new Error("Exchange entry failed quote/evaluation: " + q.errors.join("; "));
        const entry = { ...params.entry, evaluation: q.evaluation, rating: q.evaluation.rating, price: q.price, addedAt: now() };
        upsertById(state.unlockedEntries, entry);
        if (entry.source) upsertById(state.sourceVerifications, { id: entry.sourceVerificationId || `source-${entry.id}`, entryId: entry.id, status: entry.source.verificationStatus, sources: entry.source.webSources || entry.source.refs || [], updatedAt: now() });
        state.auditLog.push({ id: id("audit"), at: now(), action: "add-entry", entryId: entry.id });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "add-entry", entry: publicEntry(entry), quote: q, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "pending") {
        if (!params.entryId) throw new Error("pending requires entryId");
        const entry = findEntry(state, params.entryId); if (!entry) throw new Error("Entry not found: " + params.entryId);
        const q = quoteEntry(entry, state, settings); if (!q.ok) throw new Error("Entry failed validation/evaluation: " + q.errors.join("; ")); if (!q.afford) throw new Error("Insufficient reward points");
        const pending = { id: id("pending"), entryId: entry.id, entryName: entry.name, state: "pending", price: q.price, createdAt: now(), entry };
        state.pendingExchanges = state.pendingExchanges.filter((p: any) => p.entryId !== entry.id); state.pendingExchanges.push(pending);
        state.auditLog.push({ id: id("audit"), at: now(), action: "pending", entryId: entry.id });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "pending", pending, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "complete") {
        if (!params.entryId) throw new Error("complete requires entryId");
        const pending = (state.pendingExchanges || []).find((p: any) => p.entryId === params.entryId);
        const entry = pending?.entry || findEntry(state, params.entryId); if (!entry) throw new Error("Entry not found: " + params.entryId);
        const q = quoteEntry(entry, state, settings); if (!q.ok) throw new Error("Entry failed validation/evaluation: " + q.errors.join("; ")); if (!canAfford(state.currency.balances, q.price, settings)) throw new Error("Insufficient reward points");
        state.currency.balances = deductPrice(state.currency.balances, q.price, settings);
        state.currency.lifetimeSpent = addPoints(state.currency.lifetimeSpent, q.price.amount, q.price.pointLevel, settings);
        const completed = { id: id("completed"), entryId: entry.id, entryName: entry.name, state: "completed", price: q.price, completedAt: now(), cardModuleUpdates: params.cardModuleUpdates || [], memoryUpdates: params.memoryUpdates || [], entry: publicEntry(entry) };
        state.completedExchanges.push(completed);
        state.pendingExchanges = state.pendingExchanges.filter((p: any) => p.entryId !== entry.id);
        const tx = { id: id("exchange"), entryId: entry.id, entryName: entry.name, state: "completed", type: "complete-exchange", price: q.price, createdAt: completed.completedAt, completedAt: completed.completedAt, cardModuleUpdates: params.cardModuleUpdates || [], memoryUpdates: params.memoryUpdates || [] };
        state.transactions.push(tx); state.auditLog.push({ id: id("audit"), at: now(), action: "complete", entryId: entry.id, transactionId: tx.id });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "complete", completed, transaction: tx, reminder: "exchange_edit only updates exchange ledger; use card_edit to write concrete abilities/resources/items/knowledge/relationships and memory/world-history.md.", display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "record-source") {
        if (!params.entryId) throw new Error("record-source requires entryId");
        if (!params.sources || params.sources.length < 1) throw new Error("record-source requires sources");
        const rec = { id: `source-${params.entryId}`, entryId: params.entryId, status: params.sources.length >= 2 ? "verified" : "pending", sources: params.sources, updatedAt: now() };
        upsertById(state.sourceVerifications, rec);
        const entry = (state.unlockedEntries || []).find((e: any) => e.id === params.entryId);
        if (entry) { entry.source = entry.source || {}; entry.source.webSources = params.sources; entry.source.verificationStatus = rec.status; entry.source.status = entry.source.status || "unarchived"; }
        state.auditLog.push({ id: id("audit"), at: now(), action: "record-source", entryId: params.entryId, status: rec.status });
        const p = persist(file, state, params);
        return jsonOut({ ok: true, action: "record-source", sourceVerification: rec, display: visibleStatus(state, settings), dryRun: !!params.dryRun }, { ok: true, settingsLoaded: rel(SETTINGS), ...p }, max);
      }
      if (params.action === "validate") {
        const v = validateState(state, settings);
        return jsonOut({ ok: v.ok, action: "validate", validation: v, display: visibleStatus(state, settings) }, { ok: v.ok, settingsLoaded: rel(SETTINGS) }, max);
      }
      throw new Error("Unknown action: " + (params.action as Action));
    } catch (err: any) { return fail(err.message || String(err), max); }
  } });
}
