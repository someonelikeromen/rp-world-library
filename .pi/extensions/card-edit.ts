import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type CardAction = "cards" | "get" | "set" | "merge" | "append" | "upsert" | "remove" | "batch" | "validate" | "status" | "register";

type Operation = {
	action: Exclude<CardAction, "cards" | "get" | "batch" | "validate"> | "set" | "merge" | "append" | "upsert" | "remove";
	path?: string;
	value?: any;
	item?: any;
	id?: string;
	idField?: string;
};

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, ".pi", "rp-data-tools.json");

const CardEditParams = Type.Object({
	action: StringEnum(["cards", "get", "set", "merge", "append", "upsert", "remove", "batch", "validate", "status", "register"] as const, {
		description: "cards=list registered cards; get=read; set/merge/append/upsert/remove=edit JSON; batch=multiple edits; validate=consistency checks; status=lightweight summary; register=add NPC card",
	}),
	card: Type.Optional(Type.String({ description: "Registered card key or alias. Default: protagonist" })),
	path: Type.Optional(Type.String({ description: "Dot path. Supports arrays by index or id selector: resources[id=mana].current, abilities[0].name" })),
	value: Type.Optional(Type.Any({ description: "Value for set/merge/append" })),
	item: Type.Optional(Type.Any({ description: "Object for upsert, or value for append" })),
	id: Type.Optional(Type.String({ description: "Item id/name for upsert/remove in an array path" })),
	idField: Type.Optional(Type.String({ description: "Array id field. Defaults from config or id" })),
	operations: Type.Optional(Type.Array(Type.Object({
		action: StringEnum(["set", "merge", "append", "upsert", "remove"] as const),
		path: Type.Optional(Type.String()),
		value: Type.Optional(Type.Any()),
		item: Type.Optional(Type.Any()),
		id: Type.Optional(Type.String()),
		idField: Type.Optional(Type.String()),
	}), { description: "Batch operations, applied atomically" })),
	dryRun: Type.Optional(Type.Boolean({ description: "Preview changes without writing. Default false" })),
	backup: Type.Optional(Type.Boolean({ description: "Write timestamped backup before mutation. Default true" })),
	note: Type.Optional(Type.String({ description: "Human note stored in tool details" })),
	maxBytes: Type.Optional(Type.Number({ description: "Max returned bytes. Default 16000; max 50000" })),
	cardPath: Type.Optional(Type.String({ description: "File path for register action, relative to project root" })),
	cardLabel: Type.Optional(Type.String({ description: "Human label for register action" })),
	cardAliases: Type.Optional(Type.Array(Type.String(), { description: "Search aliases for register action" })),
});

function readJson(file: string): any {
	return JSON.parse(readFileSync(file, "utf8"));
}

function loadConfig(): any {
	if (!existsSync(CONFIG_PATH)) throw new Error(`Config not found: ${CONFIG_PATH}`);
	return readJson(CONFIG_PATH);
}

function rel(file: string): string {
	return file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/");
}

function capBytes(maxBytes?: number): number {
	if (!Number.isFinite(maxBytes as number)) return 16000;
	return Math.max(1000, Math.min(50000, Math.floor(maxBytes as number)));
}

function maybeTruncate(text: string, maxBytes: number): { text: string; truncated: boolean; totalBytes: number; outputBytes: number } {
	const totalBytes = Buffer.byteLength(text, "utf8");
	if (totalBytes <= maxBytes) return { text, truncated: false, totalBytes, outputBytes: totalBytes };
	let out = text;
	while (Buffer.byteLength(out, "utf8") > maxBytes && out.length > 0) out = out.slice(0, Math.floor(out.length * 0.9));
	return { text: out + `\n\n[card_edit truncated: ${Buffer.byteLength(out, "utf8")}/${totalBytes} bytes shown]`, truncated: true, totalBytes, outputBytes: Buffer.byteLength(out, "utf8") };
}

function result(payload: unknown, details: Record<string, unknown>, maxBytes: number) {
	const raw = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
	const trunc = maybeTruncate(raw, maxBytes);
	return {
		content: [{ type: "text" as const, text: trunc.text }],
		details: { ...details, truncation: { truncated: trunc.truncated, totalBytes: trunc.totalBytes, outputBytes: trunc.outputBytes } },
	};
}

function errorResult(message: string, maxBytes: number, details: Record<string, unknown> = {}) {
	return result({ ok: false, error: message }, { ok: false, ...details }, maxBytes);
}

function resolveCard(config: any, key?: string): { key: string; def: any; file: string } {
	const wanted = key || "protagonist";
	// search by alias first
	for (const [k, def] of Object.entries(config.cards || {}) as any) {
		if (k === wanted || (def.aliases || []).includes(wanted)) {
			return { key: k, def, file: join(ROOT, def.path) };
		}
	}
	// if not found, try NPC card lookup: any card with matching key in npcs
	if (config.npcs) {
		for (const [k, def] of Object.entries(config.npcs || {}) as any) {
			if (k === wanted || (def.aliases || []).includes(wanted)) {
				return { key: k, def, file: join(ROOT, def.path) };
			}
		}
	}
	if (config.allowUnregisteredCardFiles && wanted.endsWith(".json")) {
		return { key: wanted, def: { path: wanted, idArrays: {} }, file: join(ROOT, wanted) };
	}
	throw new Error(`Unknown card: ${wanted} (available: ${Object.keys(config.cards || {}).concat(Object.keys(config.npcs || {})).join(", ")})`);
}

type Segment = string | number | { array: string; field: string; value: string };

function parsePath(input?: string): Segment[] {
	if (!input || input.trim() === "") return [];
	const out: Segment[] = [];
	for (const rawPart of input.split(".")) {
		const part = rawPart.trim();
		if (!part) continue;
		const base = part.match(/^([^\[]+)/)?.[1];
		if (base) out.push(base);
		const brackets = [...part.matchAll(/\[([^\]]*)\]/g)].map(m => m[1]);
		for (const b of brackets) {
			if (/^\d+$/.test(b)) out.push(Number(b));
			else if (b.includes("=")) {
				const [field, ...rest] = b.split("=");
				const array = String(base || out[out.length - 1]);
				out.pop();
				out.push({ array, field, value: rest.join("=") });
			} else if (b === "") {
				out.push({ array: String(base || out[out.length - 1]), field: "*", value: "*" });
			}
		}
	}
	return out;
}

function clone<T>(v: T): T {
	return JSON.parse(JSON.stringify(v));
}

function selectArrayItem(parent: any, seg: { array: string; field: string; value: string }, create = false): any {
	if (!Array.isArray(parent[seg.array])) {
		if (create) parent[seg.array] = [];
		else throw new Error(`Expected array at ${seg.array}`);
	}
	const arr = parent[seg.array];
	if (seg.field === "*") return arr;
	let item = arr.find((x: any) => String(x?.[seg.field]) === seg.value);
	if (!item && create) {
		item = { [seg.field]: seg.value };
		arr.push(item);
	}
	if (!item) throw new Error(`Array item not found: ${seg.array}[${seg.field}=${seg.value}]`);
	return item;
}

function getAt(root: any, path?: string): any {
	let cur = root;
	for (const seg of parsePath(path)) {
		if (typeof seg === "string" || typeof seg === "number") cur = cur?.[seg as any];
		else cur = selectArrayItem(cur, seg, false);
	}
	return cur;
}

function setAt(root: any, path: string, value: any): { before: any; after: any } {
	const segs = parsePath(path);
	if (segs.length === 0) throw new Error("set requires non-empty path");
	let cur = root;
	for (let i = 0; i < segs.length - 1; i++) {
		const seg = segs[i];
		const next = segs[i + 1];
		if (typeof seg === "string") {
			if (cur[seg] === undefined) cur[seg] = typeof next === "number" ? [] : {};
			cur = cur[seg];
		} else if (typeof seg === "number") {
			if (!Array.isArray(cur)) throw new Error(`Expected array before [${seg}]`);
			if (cur[seg] === undefined) cur[seg] = typeof next === "number" ? [] : {};
			cur = cur[seg];
		} else cur = selectArrayItem(cur, seg, true);
	}
	const last = segs[segs.length - 1];
	let before: any;
	if (typeof last === "string" || typeof last === "number") {
		before = clone(cur?.[last as any]);
		cur[last as any] = value;
		return { before, after: clone(cur[last as any]) };
	}
	const item = selectArrayItem(cur, last, true);
	before = clone(item);
	Object.assign(item, value);
	return { before, after: clone(item) };
}

function deepMerge(target: any, patch: any): any {
	if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch;
	if (!target || typeof target !== "object" || Array.isArray(target)) target = {};
	for (const [k, v] of Object.entries(patch)) {
		target[k] = v && typeof v === "object" && !Array.isArray(v) ? deepMerge(target[k], v) : v;
	}
	return target;
}

function mergeAt(root: any, path: string | undefined, patch: any): { before: any; after: any } {
	const before = clone(getAt(root, path));
	if (!path) {
		deepMerge(root, patch);
		return { before, after: clone(root) };
	}
	const current = getAt(root, path);
	const merged = deepMerge(current, patch);
	setAt(root, path, merged);
	return { before, after: clone(merged) };
}

function appendAt(root: any, path: string, value: any): { beforeLength: number; afterLength: number } {
	const arr = getAt(root, path);
	if (!Array.isArray(arr)) throw new Error(`append target is not array: ${path}`);
	const beforeLength = arr.length;
	arr.push(value);
	return { beforeLength, afterLength: arr.length };
}

function defaultIdField(cardDef: any, path: string, explicit?: string): string {
	if (explicit) return explicit;
	const clean = path.replace(/\[.*?\]/g, "");
	return cardDef.idArrays?.[clean] || "id";
}

function upsertAt(root: any, cardDef: any, path: string, item: any, id?: string, idField?: string): { action: "inserted" | "updated"; before?: any; after: any } {
	const arr = getAt(root, path);
	if (!Array.isArray(arr)) throw new Error(`upsert target is not array: ${path}`);
	const field = defaultIdField(cardDef, path, idField);
	const targetId = String(id ?? item?.[field] ?? "");
	if (!targetId) throw new Error(`upsert requires id or item.${field}`);
	const idx = arr.findIndex((x: any) => String(x?.[field]) === targetId);
	if (idx >= 0) {
		const before = clone(arr[idx]);
		arr[idx] = deepMerge(arr[idx], item);
		return { action: "updated", before, after: clone(arr[idx]) };
	}
	const newItem = { ...item, [field]: item?.[field] ?? targetId };
	arr.push(newItem);
	return { action: "inserted", after: clone(newItem) };
}

function removeAt(root: any, cardDef: any, path: string, id?: string, idField?: string): { removed: any } {
	if (id) {
		const arr = getAt(root, path);
		if (!Array.isArray(arr)) throw new Error(`remove target is not array: ${path}`);
		const field = defaultIdField(cardDef, path, idField);
		const idx = arr.findIndex((x: any) => String(x?.[field]) === id);
		if (idx < 0) throw new Error(`No array item ${field}=${id} at ${path}`);
		return { removed: arr.splice(idx, 1)[0] };
	}
	const segs = parsePath(path);
	if (segs.length === 0) throw new Error("Refusing to remove whole card");
	let cur = root;
	for (let i = 0; i < segs.length - 1; i++) {
		const seg = segs[i];
		cur = typeof seg === "string" || typeof seg === "number" ? cur?.[seg as any] : selectArrayItem(cur, seg, false);
	}
	const last = segs[segs.length - 1];
	if (typeof last === "number" && Array.isArray(cur)) return { removed: cur.splice(last, 1)[0] };
	if (typeof last === "string") {
		const removed = cur?.[last];
		delete cur[last];
		return { removed };
	}
	throw new Error("remove with selector should use id/path to array");
}

function makeBackup(config: any, file: string): string {
	const backupRoot = join(ROOT, config.backupDir || "backup/card-edits");
	mkdirSync(backupRoot, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const out = join(backupRoot, `${stamp}-${file.split(/[\\/]/).pop()}`);
	writeFileSync(out, readFileSync(file, "utf8"), "utf8");
	return out;
}

function atomicWriteJson(file: string, data: any): void {
	mkdirSync(dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
	renameSync(tmp, file);
}

function pathExistsPattern(root: any, pattern: string): boolean {
	// Minimal wildcard support for required paths: [] and * mean "at least one child has it".
	if (pattern.includes("[]")) {
		const [arrPath, rest] = pattern.split("[]");
		const arr = getAt(root, arrPath);
		return Array.isArray(arr) && arr.length > 0 && (!rest.replace(/^\./, "") || arr.some(x => getAt(x, rest.replace(/^\./, "")) !== undefined));
	}
	if (pattern.includes("*")) {
		const prefix = pattern.split(".*")[0];
		const obj = getAt(root, prefix);
		const rest = pattern.slice(prefix.length + 3);
		return obj && typeof obj === "object" && Object.values(obj).some(v => rest ? getAt(v, rest) !== undefined : true);
	}
	return getAt(root, pattern) !== undefined;
}

function validateCard(card: any, def: any): { ok: boolean; errors: string[]; warnings: string[]; hints: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];
	for (const p of def.requiredPaths || []) {
		if (!pathExistsPattern(card, p)) errors.push(`Missing required path: ${p}`);
	}
	const reserve = getAt(card, "magic.circuits.currentReserve");
	const manaCurrent = getAt(card, "resources[id=mana].current");
	const crManaCurrent = getAt(card, "combatRating.resource.mana.current");
	if (reserve !== undefined && manaCurrent !== undefined && reserve !== manaCurrent) warnings.push(`Mana mismatch: magic.circuits.currentReserve=${reserve}, resources[id=mana].current=${manaCurrent}`);
	if (reserve !== undefined && crManaCurrent !== undefined && reserve !== crManaCurrent) warnings.push(`Mana mismatch: magic.circuits.currentReserve=${reserve}, combatRating.resource.mana.current=${crManaCurrent}`);
	const money = getAt(card, "resources[id=money].current");
	const crMoney = getAt(card, "combatRating.resource.money");
	if (money !== undefined && crMoney !== undefined && money !== crMoney) warnings.push(`Money mismatch: resources[id=money].current=${money}, combatRating.resource.money=${crMoney}`);
	return { ok: errors.length === 0, errors, warnings, hints: def.syncHints || [] };
}

function applyOperation(card: any, def: any, op: Operation): any {
	switch (op.action) {
		case "set": return setAt(card, op.path!, op.value);
		case "merge": return mergeAt(card, op.path, op.value);
		case "append": return appendAt(card, op.path!, op.value ?? op.item);
		case "upsert": return upsertAt(card, def, op.path!, op.item ?? op.value, op.id, op.idField);
		case "remove": return removeAt(card, def, op.path!, op.id, op.idField);
		default: throw new Error(`Unsupported operation: ${op.action}`);
	}
}

// ─── status: lightweight RP-optimized summary ───
function statusSummary(card: any, def: any): any {
	const resources = card.resources || [];
	const relationships = card.relationships || [];
	const inventory = card.inventory || [];
	const spells = card.magic?.knownSpells || [];
	const combat = card.combatRating || {};

	return {
		basic: { name: card.name, age: card.age, gender: card.gender, identity: card.identity, impression: card.impression },
		currentStatus: card.currentStatus,
		magic: {
			circuits: card.magic?.circuits,
			currentReserve: card.magic?.circuits?.currentReserve,
			maxReserve: card.magic?.circuits?.maxReserve,
			activeSpells: spells.filter((s: any) => s.panelLevel > 0).length,
			totalSpells: spells.length,
			keySpells: spells.filter((s: any) => s.panelLevel >= 3).map((s: any) => ({ id: s.id, name: s.name, panelLevel: s.panelLevel })),
		},
		combat: Object.fromEntries(Object.entries(combat).filter(([k]) => k !== "resource").map(([k, v]: any) => [k, v])),
		resources: resources.filter((r: any) => r.current !== undefined).map((r: any) => ({ id: r.id, name: r.name, current: r.current, max: r.max })),
		keyRelations: relationships.filter((r: any) => r.importance === "primary" || r.importance === "secondary").map((r: any) => ({ name: r.name, relation: r.currentRelation, importance: r.importance })),
		inventoryHighlights: inventory.filter((i: any) => i.importance === "primary" || i.importance === "secondary").map((i: any) => ({ id: i.id, name: i.name, quantity: i.quantity })),
	};
}

// ─── derivedFields computation ───
function applyDerivedFields(card: any, def: any, config: any): void {
	const rules = def.extensionSlots?.derivedFields || [];
	for (const rule of rules) {
		try {
			if (rule.source && rule.target) {
				const src = getAt(card, rule.source);
				if (src !== undefined) setAt(card, rule.target, typeof rule.transform === "function" ? rule.transform(src) : src);
			}
			if (rule.expression === "combatRatingFromStats") {
				const cr = card.combatRating || {};
				const stats: any = {};
				for (const [k, v] of Object.entries(cr)) {
					if (k === "resource") continue;
					const sv = getAt(card, (v as any)?.score);
					if (sv !== undefined) stats[k] = sv;
				}
				if (!cr.overall) cr.overall = {};
				cr.overall = { score: computeOverallTier(Object.values(stats)) };
				card.combatRating = cr;
			}
		} catch { /* skip failing derived field */ }
	}
}

function computeOverallTier(scores: any[]): string {
	const tierMap: Record<string, number> = { "S": 5, "A+": 4.5, "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1 };
	const nums = scores.map((s: any) => tierMap[String(s).toUpperCase()] || 0).filter((n: number) => n > 0);
	if (nums.length === 0) return "C";
	const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
	const tiers = Object.entries(tierMap).sort((a, b) => a[1] - b[1]);
	for (const [tier, val] of tiers) if (avg <= val + 0.25) return tier;
	return "S";
}

// ─── customValidators execution ───
function executeCustomValidators(card: any, def: any): { errors: string[]; warnings: string[] } {
	const rules = def.extensionSlots?.customValidators || [];
	const errors: string[] = [];
	const warnings: string[] = [];
	for (const rule of rules) {
		try {
			if (rule.type === "range") {
				const val = getAt(card, rule.path);
				if (val !== undefined) {
					if (rule.min !== undefined && val < rule.min) errors.push(`${rule.path}=${val} below min ${rule.min}`);
					if (rule.max !== undefined && val > rule.max) errors.push(`${rule.path}=${val} exceeds max ${rule.max}`);
				}
			}
			if (rule.type === "required") {
				const val = getAt(card, rule.path);
				if (val === undefined || val === null || val === "") errors.push(`Required field empty: ${rule.path}`);
			}
			if (rule.type === "equal") {
				const a = getAt(card, rule.pathA);
				const b = getAt(card, rule.pathB);
				if (a !== undefined && b !== undefined && a !== b) warnings.push(`Mismatch: ${rule.pathA}=${a} vs ${rule.pathB}=${b}`);
			}
		} catch { /* skip failing validator */ }
	}
	return { errors, warnings };
}

// ─── postUpdateHooks execution ───
function runPostUpdateHooks(card: any, def: any, config: any, operation: string, note?: string): string[] {
	const hooks = def.extensionSlots?.postUpdateHooks || [];
	const logs: string[] = [];
	for (const hook of hooks) {
		try {
			if (hook.type === "log") {
				const logDir = join(ROOT, hook.dir || "memory");
				mkdirSync(logDir, { recursive: true });
				const ts = new Date().toISOString().replace(/[:.]/g, "-");
				const logFile = join(logDir, `${hook.prefix || "card-edit"}-${ts}.json`);
				const entry = {
					timestamp: new Date().toISOString(),
					card: def.label || def.path,
					action: operation,
					note: note || "",
					snapshot: hook.includeSnapshot ? statusSummary(card, def) : undefined,
					changes: hook.includeChanges ? (hook._changes || []) : undefined,
				};
				writeFileSync(logFile, JSON.stringify(entry, null, 2), "utf8");
				logs.push(`Logged to ${rel(logFile)}`);
			}
			if (hook.type === "memory-sync") {
				const memDir = join(ROOT, hook.dir || "memory");
				mkdirSync(memDir, { recursive: true });
				const memFile = join(memDir, hook.file || "card-status-snapshot.md");
				const status = statusSummary(card, def);
				const md = [
					`# Card Status Snapshot — ${new Date().toISOString()}`,
					`",
					`- Name: ${status.basic?.name}`,
					`- Status: ${status.currentStatus || "—"}`,
					`- Magic: ${status.magic?.currentReserve}/${status.magic?.maxReserve} (${status.magic?.activeSpells} active spells)`,
					`- Combat: ${JSON.stringify(status.combat)}`,
					`- Resources: ${(status.resources || []).map((r: any) => `${r.id}=${r.current}`).join(", ")}`,
					`- Key Relations: ${(status.keyRelations || []).map((r: any) => `${r.name}(${r.relation})`).join(", ")}`,
					"",
				].join("\n");
				writeFileSync(memFile, md, "utf8");
				logs.push(`Memory synced to ${rel(memFile)}`);
			}
		} catch (e: any) { logs.push(`Hook failed: ${hook.type} — ${e?.message}`); }
	}
	return logs;
}

// ─── register: add NPC card to config ───
function registerCard(config: any, params: any): { configPath: string; registered: any } {
	if (!params.card || !params.cardPath) throw new Error("register requires card (key) and cardPath");
	const key = params.card;
	const entry = {
		path: params.cardPath,
		schema: "rp-character-v1",
		label: params.cardLabel || key,
		aliases: params.cardAliases || [key],
		requiredPaths: params.requiredPaths || [],
		idArrays: { "magic.knownSpells": "id", "abilities": "id", "resources": "id", "relationships": "id", "inventory": "id" },
		extensionSlots: { customValidators: params.customValidators || [], derivedFields: params.derivedFields || [], postUpdateHooks: params.postUpdateHooks || [] },
	};
	if (!config.npcs) config.npcs = {};
	config.npcs[key] = entry;
	writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
	return { configPath: rel(CONFIG_PATH), registered: entry };
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "card_edit",
		label: "Card Edit",
		description: "AI-facing generic quick edit/query tool for registered RP character cards. Supports dot paths, id-selected arrays, atomic JSON writes, backups, dry-run, validation, and future schema extension via .pi/rp-data-tools.json.",
		parameters: CardEditParams,
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const maxBytes = capBytes(params.maxBytes);
			try {
				const config = loadConfig();
				if (params.action === "cards") {
					const cards = Object.fromEntries(Object.entries(config.cards || {}).map(([k, v]: any) => [k, { path: v.path, label: v.label, aliases: v.aliases, schema: v.schema, requiredPaths: v.requiredPaths, extensionSlots: v.extensionSlots }]));
					return result({ ok: true, cards, allowUnregisteredCardFiles: config.allowUnregisteredCardFiles }, { ok: true, action: "cards" }, maxBytes);
				}

			if (params.action === "register") {
				const { configPath, registered } = registerCard(config, params);
				return result({ ok: true, configPath, registered }, { ok: true, action: "register", configPath }, maxBytes);
			}

				const { key, def, file } = resolveCard(config, params.card);
				if (!existsSync(file)) return errorResult(`Card file not found: ${rel(file)}`, maxBytes, { card: key, path: rel(file) });
				const originalText = readFileSync(file, "utf8");
				const card = JSON.parse(originalText);

				if (params.action === "get") {
					const value = params.path ? getAt(card, params.path) : card;
					return result({ ok: true, card: key, file: rel(file), path: params.path || "", value }, { ok: true, action: "get", card: key, file: rel(file), path: params.path }, maxBytes);
				}
			if (params.action === "status") {
				const status = statusSummary(card, def);
				return result({ ok: true, card: key, file: rel(file), status }, { ok: true, action: "status", card: key, file: rel(file) }, maxBytes);
			}
				if (params.action === "validate") {
				const baseValidation = validateCard(card, def);
				const custom = executeCustomValidators(card, def);
				const validation = { ok: baseValidation.ok && custom.errors.length === 0, errors: [...baseValidation.errors, ...custom.errors], warnings: [...baseValidation.warnings, ...custom.warnings], hints: baseValidation.hints };
					return result({ ok: validation.ok, card: key, file: rel(file), validation }, { ok: validation.ok, action: "validate", card: key, file: rel(file) }, maxBytes);
				}

				const ops: Operation[] = params.action === "batch" ? (params.operations || []) as Operation[] : [{ action: params.action as any, path: params.path, value: params.value, item: params.item, id: params.id, idField: params.idField }];
				if (ops.length === 0) return errorResult("No operations provided", maxBytes, { action: params.action, card: key });

				const working = clone(card);
				const changes = ops.map(op => ({ op, result: applyOperation(working, def, op) }));
				// apply derived fields after mutations
				applyDerivedFields(working, def, config);
				const baseMutationValidation = validateCard(working, def);
				const customMutation = executeCustomValidators(working, def);
				const validation = { ok: baseMutationValidation.ok && customMutation.errors.length === 0, errors: [...baseMutationValidation.errors, ...customMutation.errors], warnings: [...baseMutationValidation.warnings, ...customMutation.warnings], hints: baseMutationValidation.hints };
				const beforeHash = Buffer.from(originalText).toString("base64").slice(0, 16);
				const afterText = JSON.stringify(working, null, 2) + "\n";
				const afterHash = Buffer.from(afterText).toString("base64").slice(0, 16);

				let backupPath: string | undefined;
				if (!params.dryRun) {
					if (params.backup !== false) backupPath = makeBackup(config, file);
					atomicWriteJson(file, working);
				// run post-update hooks after successful write
				(def.extensionSlots?.postUpdateHooks || []).forEach((h: any) => { if (h._changes === undefined) h._changes = []; h._changes = changes; });
				const hookLogs = runPostUpdateHooks(working, def, config, params.action, params.note);
				}

				return result({
					ok: true,
					card: key,
					file: rel(file),
					dryRun: !!params.dryRun,
					backup: backupPath ? rel(backupPath) : undefined,
					changes,
					validation,
					note: params.note,
				}, { ok: true, action: params.action, card: key, file: rel(file), dryRun: !!params.dryRun, backup: backupPath ? rel(backupPath) : undefined, beforeHash, afterHash, hookLogs, note: params.note }, maxBytes);
			} catch (err: any) {
				return errorResult(err?.stack || err?.message || String(err), maxBytes, { action: params.action, card: params.card });
			}
		},
	});

	pi.registerCommand("card", {
		description: "Show registered RP cards and quick validation summary",
		handler: async (_args, ctx) => {
			const maxBytes = 20000;
			try {
				const config = loadConfig();
				const summaries: any[] = [];
				for (const [key, def] of Object.entries(config.cards || {}) as any) {
					const file = join(ROOT, def.path);
					const card = existsSync(file) ? readJson(file) : undefined;
					summaries.push({ key, label: def.label, path: def.path, exists: existsSync(file), validation: card ? validateCard(card, def) : undefined });
				}
				ctx.ui.notify(maybeTruncate(JSON.stringify({ cards: summaries }, null, 2), maxBytes).text, "info");
			} catch (err: any) {
				ctx.ui.notify(err?.message || String(err), "error");
			}
		},
	});
}
