import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type WorldStatus = "curated" | "raw";
type QueryAction = "worlds" | "overview" | "search" | "get" | "characters" | "stories" | "aggregate" | "graph" | "timeline";
type QueryCategory = "all" | "character" | "world" | "story" | "rule" | "raw" | "source" | "graph";

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, ".pi", "rp-data-tools.json");

function loadToolConfig(): any {
	try {
		return existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf8")) : {};
	} catch {
		return {};
	}
}

const TOOL_CONFIG = loadToolConfig();
const WORLD_CONFIG = TOOL_CONFIG.worldLibrary || {};
const LIB_ROOT = join(ROOT, WORLD_CONFIG.root || join("campaigns", "world-library"));
const INDEX_PATH = join(LIB_ROOT, WORLD_CONFIG.index || ".wl-index.json");
const WORLDS_DIR = join(LIB_ROOT, WORLD_CONFIG.curatedDir || "worlds");
const IMPORTS_DIR = join(LIB_ROOT, WORLD_CONFIG.rawWorldviewsDir || join("imports", "worldviews"));

const WorldQueryParams = Type.Object({
	action: StringEnum(["worlds", "overview", "search", "get", "characters", "stories", "aggregate", "graph", "timeline"] as const, {
		description: "worlds=list worlds; overview=light summary; search=keyword search with extracted/source-backed first; get=read ref or world+query with extracted priority; characters=list/search extracted characters first; stories=list/read story indexes/chapters; aggregate=cross-file merged entity lookup; graph=relation traversal; timeline=time-based event query (requires extracted/timeline.json)",
	}),
	world: Type.Optional(Type.String({ description: "World slug, e.g. type-moon-nasuverse or high-school-dxd" })),
	query: Type.Optional(Type.String({ description: "Keyword/name/id/fuzzy text to search" })),
	ref: Type.Optional(Type.String({ description: "Reference returned by search, e.g. char:type-moon-nasuverse:fsn-rin, story:..." })),
	time: Type.Optional(Type.String({ description: "ISO timestamp for timeline queries, e.g. 2009-07-20 or 2009-07-20T14:00" })),
	timeRange: Type.Optional(Type.Object({ from: Type.String({ description: "Start timestamp" }), to: Type.String({ description: "End timestamp" }) }, { description: "Time range for timeline queries" })),
	category: Type.Optional(StringEnum(["all", "character", "world", "story", "rule", "raw", "source", "graph"] as const, {
		description: "Optional search/overview category filter",
	})),
	storyId: Type.Optional(Type.String({ description: "Story id for action=stories, e.g. fgo, fate, fairy" })),
	allWorlds: Type.Optional(Type.Boolean({ description: "Search across all worlds instead of a specific one. Default false" })),
	chapter: Type.Optional(Type.String({ description: "Chapter id/name fragment for action=stories" })),
	status: Type.Optional(StringEnum(["all", "curated", "raw"] as const, { description: "Filter worlds by status" })),
	limit: Type.Optional(Type.Number({ description: "Maximum results. Default 20; max 100" })),
	entityRef: Type.Optional(Type.String({ description: "Character ref for graph traversal, e.g. char:type-moon-nasuverse:fsn-rin" })),
	includeContent: Type.Optional(Type.Boolean({ description: "For get/stories, include full-ish content up to maxBytes. Default true for get, false otherwise" })),
	maxBytes: Type.Optional(Type.Number({ description: "Max text bytes returned to model. Default 16000; max 50000. Full text is saved to temp file when truncated." })),
});

interface ToolResult {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
}

function readJson(file: string): any {
	return JSON.parse(readFileSync(file, "utf8"));
}

function safeJson(file: string): any | undefined {
	try { return readJson(file); } catch { return undefined; }
}

function rel(file: string): string {
	return file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/");
}

function loadIndex(): any {
	if (existsSync(INDEX_PATH)) return readJson(INDEX_PATH);
	return { version: 1, worlds: {}, builtAt: undefined };
}

function worldInfo(slug: string): any | undefined {
	return loadIndex().worlds?.[slug];
}

function curatedDir(slug: string): string {
	return join(WORLDS_DIR, slug, "curated");
}

function rawDir(slug: string): string {
	return join(IMPORTS_DIR, slug, "worldbooks");
}

function extractedDir(slug: string): string {
	return join(WORLDS_DIR, slug, "extracted");
}

function extractedEntityFile(slug: string, type: string, id: string): string {
	return join(WORLDS_DIR, slug, "extracted", type, id + ".json");
}

function safeReaddir(dir: string): string[] {
	try { return readdirSync(dir); } catch { return []; }
}

function norm(s: unknown): string {
	return String(s ?? "").toLowerCase();
}

function includesQuery(value: unknown, q: string): boolean {
	const raw = typeof value === "string" ? value : JSON.stringify(value ?? "");
	const hay = norm(raw);
	if (!q) return true;
	if (hay.includes(q)) return true;
	const tokens = q.split(/\s+/).map(t => t.trim()).filter(Boolean);
	return tokens.length > 1 && tokens.every(t => hay.includes(t));
}

function toArray(val: any): any[] {
	if (!val) return [];
	if (Array.isArray(val)) return val;
	if (typeof val === "object") return Object.entries(val).map(([id, v]: any) => (v && typeof v === "object" ? { id: v.id || id, ...v } : { id, name: id, summary: String(v) }));
	return [{ id: String(val), name: String(val), summary: String(val) }];
}

const WORLD_SECTION_ALTS: Record<string, string[]> = {
	powerSystems: ["powerSystems", "divinityAndFamiliaSystem", "falnaAndGrowth", "technologyAndEnergyEnvironment", "buteiSystem"],
	factions: ["factions", "factionsAndCrime", "majorFamilias", "departments"],
	rules: ["rules", "socialRulesForRP", "economyAndGuild", "rankSystem"],
	locations: ["locations"],
	events: ["events", "publicEvents", "hiddenEvents", "knownRisks", "rpGuidelines", "sandboxEntryPoints", "rpBaselineBoundaries"],
	timelines: ["timelines", "timeline", "timelineHighlights", "timelineEvents"],
};

function worldSection(wj: any, key: string): any[] {
	const keys = WORLD_SECTION_ALTS[key] || [key];
	if (key === "events") return keys.flatMap(k => toArray(wj?.[k]));
	for (const k of keys) {
		const arr = toArray(wj?.[k]);
		if (arr.length) return arr;
	}
	return [];
}

function previewText(value: unknown, max = 320): string {
	let text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
	text = text.replace(/\s+/g, " ").trim();
	return text.length > max ? text.slice(0, max) + "…" : text;
}

function capLimit(limit?: number): number {
	if (!Number.isFinite(limit as number)) return 20;
	return Math.max(1, Math.min(100, Math.floor(limit as number)));
}

function capBytes(maxBytes?: number): number {
	if (!Number.isFinite(maxBytes as number)) return 16000;
	return Math.max(1000, Math.min(50000, Math.floor(maxBytes as number)));
}

function maybeTruncate(text: string, maxBytes: number): { text: string; truncated: boolean; fullOutputPath?: string; totalBytes: number; outputBytes: number } {
	const totalBytes = Buffer.byteLength(text, "utf8");
	if (totalBytes <= maxBytes) return { text, truncated: false, totalBytes, outputBytes: totalBytes };
	let out = text;
	while (Buffer.byteLength(out, "utf8") > maxBytes && out.length > 0) out = out.slice(0, Math.floor(out.length * 0.9));
	const dir = mkdtempSync(join(tmpdir(), "pi-world-query-"));
	const fullOutputPath = join(dir, "output.txt");
	writeFileSync(fullOutputPath, text, "utf8");
	const outputBytes = Buffer.byteLength(out, "utf8");
	return {
		text: out + `\n\n[world_query truncated: ${outputBytes}/${totalBytes} bytes shown. Full output saved to: ${fullOutputPath}]`,
		truncated: true,
		fullOutputPath,
		totalBytes,
		outputBytes,
	};
}

function textResult(payload: unknown, details: Record<string, unknown>, maxBytes: number): ToolResult {
	const raw = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
	const trunc = maybeTruncate(raw, maxBytes);
	return {
		content: [{ type: "text", text: trunc.text }],
		details: { ...details, truncation: { truncated: trunc.truncated, totalBytes: trunc.totalBytes, outputBytes: trunc.outputBytes, fullOutputPath: trunc.fullOutputPath } },
	};
}

function errorResult(message: string, maxBytes = 16000, details: Record<string, unknown> = {}): ToolResult {
	return textResult({ ok: false, error: message }, { ok: false, ...details }, maxBytes);
}

function listWorlds(params: any, maxBytes: number): ToolResult {
	const idx = loadIndex();
	const filter = norm(params.query);
	const status = (params.status || "all") as "all" | WorldStatus;
	const worlds = Object.entries(idx.worlds || {})
		.filter(([slug, w]: any) => !filter || slug.toLowerCase().includes(filter) || JSON.stringify(w).toLowerCase().includes(filter))
		.filter(([, w]: any) => status === "all" || w.status === status)
		.sort(([a, wa]: any, [b, wb]: any) => {
			if (wa.status === "curated" && wb.status !== "curated") return -1;
			if (wa.status !== "curated" && wb.status === "curated") return 1;
			return a.localeCompare(b);
		})
		.map(([slug, w]: any) => ({
			slug,
			status: w.status,
			path: w.path,
			files: w.files,
			entries: w.entries,
			characters: w.characters?.count,
			stories: w.stories ? Object.keys(w.stories).length : undefined,
		}));
	const total = worlds.length;
	const limitedWorlds = worlds.slice(0, capLimit(params.limit));
	return textResult({ ok: true, count: total, returned: limitedWorlds.length, builtAt: idx.builtAt, worlds: limitedWorlds }, { ok: true, action: "worlds", count: total, returned: limitedWorlds.length }, maxBytes);
}

function overview(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	if (!slug) return errorResult("action=overview requires world", maxBytes);
	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);
	if (w.status === "raw") {
		return textResult({ ok: true, world: slug, status: "raw", path: w.path, files: w.files, entries: w.entries, sampleComments: (w.sampleComments || []).slice(0, capLimit(params.limit)) }, { ok: true, action: "overview", world: slug }, maxBytes);
	}

	const cdir = curatedDir(slug);
	const edir = extractedDir(slug);
	const extractedManifest = safeJson(join(edir, "manifest.json"));
	const finalStatus = safeJson(join(edir, "audits", "publication-final-status.json"));
	const worldJson = safeJson(join(cdir, "world.json")) || {};
	const sources = safeJson(join(cdir, "source-registry.json"));
	const storiesDir = join(cdir, "stories");
	const flatStoryIndex = safeJson(join(storiesDir, "index.json"));
	const storyIds = flatStoryIndex?.stories
		? flatStoryIndex.stories.map((s: any) => s.id)
		: (existsSync(storiesDir) ? readdirSync(storiesDir).filter(s => existsSync(join(storiesDir, s, "index.json"))) : []);
	function resolve(key: string): any[] { return worldSection(worldJson, key); }
	const category = (params.category || "all") as QueryCategory;
	const base: any = {
		ok: true,
		world: slug,
		status: "curated",
		path: w.path,
		worldName: worldJson.worldName,
		summary: worldJson.summary,
		sections: {
				powerSystems: resolve("powerSystems").length,
			factions: resolve("factions").length,
			rules: resolve("rules").length,
			locations: resolve("locations").length,
			events: resolve("events").length,
			timelines: resolve("timelines").length,
			stories: storyIds,
			sources: sources?.sources?.length,
			characters: w.characters?.count,
			extracted: safeReaddir(extractedDir(slug)).filter(f => f !== "README.md" && f !== "tools" && f !== "graph-viewer.html").map(t => {
				const cnt = (() => { try { return readdirSync(join(extractedDir(slug), t)).filter(f => f.endsWith(".json")).length; } catch { return 0; } })();
				return { type: t, count: cnt };
			}).filter(e => e.count > 0),
		},
		extractedPublication: extractedManifest ? {
			present: true,
			path: rel(edir),
			publicationMode: extractedManifest.publicationMode,
			status: finalStatus?.status,
			canUseAsPiExtractedLayer: finalStatus?.canUseAsPiExtractedLayer ?? extractedManifest.canUseAsPiExtractedLayer,
			canReplaceCurated: finalStatus?.canReplaceCurated ?? extractedManifest.canReplaceCurated,
			formalPublishedPilots: finalStatus?.formalPublishedPilots || extractedManifest.formalPilotRegistry?.map((p: any) => p.pilotId),
			heldOrInventoryOnlyPilots: finalStatus?.heldOrInventoryOnlyPilots || extractedManifest.heldOrInventoryOnlyPilots,
			derivedGraph: extractedManifest.indexes ? {
				entity: extractedManifest.indexes.unifiedDerivedEntityGraph || extractedManifest.indexes.derivedEntityGraph,
				relationships: extractedManifest.indexes.derivedRelationshipIndex,
				continuity: extractedManifest.indexes.derivedContinuityIndex,
				derivedOnly: true,
				primaryFactStore: false,
			} : undefined,
		} : undefined,
		next: [
			`world_query { action: "search", world: "${slug}", query: "关键词" }`,
			`world_query { action: "characters", world: "${slug}", query: "角色名" }`,
			`world_query { action: "stories", world: "${slug}" }`,
		],
	};
	if (category !== "all") {
		if (category === "source") base.sources = sources?.sources || [];
		else if (category === "story") base.stories = storyIds.map(id => safeJson(join(storiesDir, id, "index.json")));
		else if (category === "world") {
			base.world = {
				powerSystems: resolve("powerSystems"), factions: resolve("factions"), rules: resolve("rules"), locations: resolve("locations"),
				events: resolve("events"), timelines: resolve("timelines"),
			};
		}
	}
	return textResult(base, { ok: true, action: "overview", world: slug }, maxBytes);
}

function searchCurated(slug: string, query: string, category: QueryCategory, limit: number): any[] {
	const q = norm(query);
	const results: any[] = [];
	const cdir = curatedDir(slug);
	const idxWorld = worldInfo(slug) || {};

	function push(r: any) {
		if (results.length < limit) results.push(r);
	}

	if ((category === "all" || category === "character") && existsSync(join(cdir, "characters-index.json"))) {
		const chars = safeJson(join(cdir, "characters-index.json"));
		for (const ch of chars?.characters || []) {
			const hay = [ch.id, ch.name, ...(ch.aliases || []), ...(ch.sourceKeys || []), ch.summary, ...(ch.factions || []), ...(ch.powerSystems || []), ...(ch.roles || []), ...(ch.abilities || [])].join("\n");
			if (includesQuery(hay, q)) push({ type: "character", ref: `char:${slug}:${ch.id}`, id: ch.id, name: ch.name, match: "metadata", summary: ch.summary, aliases: ch.aliases, importance: ch.importance, sourceRefs: ch.sourceRefs });
			else if (includesQuery(ch.detail, q) || includesQuery(ch.sourceContent, q)) push({ type: "character", ref: `char:${slug}:${ch.id}`, id: ch.id, name: ch.name, match: "detail/sourceContent", preview: previewText(ch.detail || ch.sourceContent), importance: ch.importance, sourceRefs: ch.sourceRefs });
			if (results.length >= limit) break;
		}
	}

	if ((category === "all" || category === "world") && existsSync(join(cdir, "world.json"))) {
		const wj = safeJson(join(cdir, "world.json")) || {};
		const sections: Array<[string, any[]]> = [
			["powerSystems", worldSection(wj, "powerSystems")], ["factions", worldSection(wj, "factions")], ["rules", worldSection(wj, "rules")], ["locations", worldSection(wj, "locations")],
			["events", worldSection(wj, "events")], ["timelines", worldSection(wj, "timelines")],
		];
		for (const [section, items] of sections) for (const item of items) {
			if (includesQuery(item, q)) push({ type: "world", section, ref: `world:${slug}:${section}:${item.id || item.name}`, id: item.id, name: item.name, summary: item.summary || item.description || previewText(item) });
			if (results.length >= limit) break;
		}
	}

	if ((category === "all" || category === "story") && idxWorld.stories) {
		for (const [storyId, story] of Object.entries(idxWorld.stories || {}) as any) {
			for (const arc of story.arcs || []) {
				if (includesQuery([storyId, story.title, arc.id, arc.name, arc.summary].join("\n"), q)) push({ type: "story", ref: `story:${slug}:${storyId}:${arc.id}`, storyId, chapterId: arc.id, name: arc.name, summary: arc.summary, file: arc.file });
				if (results.length >= limit) break;
			}
		}
	}

	if (category === "all" || category === "rule") {
		const wrDir = join(cdir, "world-rules");
		if (existsSync(wrDir)) for (const fn of readdirSync(wrDir).filter(f => f.endsWith(".md"))) {
			const fp = join(wrDir, fn);
			const text = readFileSync(fp, "utf8");
			if (includesQuery(fn + "\n" + text, q)) push({ type: "rule", ref: `rule:${slug}:${fn}`, file: `world-rules/${fn}`, preview: previewText(text) });
			if (results.length >= limit) break;
		}
	}

	if ((category === "all" || category === "source") && existsSync(join(cdir, "source-registry.json"))) {
		const sr = safeJson(join(cdir, "source-registry.json"));
		for (const src of sr?.sources || []) {
			if (includesQuery(src, q)) push({ type: "source", ref: `source:${slug}:${src.id}`, ...src });
			if (results.length >= limit) break;
		}
	}

	return results;
}

function searchExtracted(slug: string, query: string, category: QueryCategory, limit: number): any[] {
	const q = norm(query);
	const edir = extractedDir(slug);
	if (!existsSync(edir)) return [];
	const published = searchPublishedExtractedLayer(slug, query, category, limit);
	if (published.length >= limit) return published.slice(0, limit);
	const results: any[] = [...published];
	if (slug === TYPE_MOON_SLUG && hasPublishedExtractedLayer(slug)) return results.slice(0, limit);
	const types = category === "all"
		? ["characters", "abilities", "events", "items", "locations", "factions", "organizations", "systems", "knowledge"]
		: category === "character" ? ["characters"]
		: category === "world" ? ["locations", "factions", "organizations", "systems", "knowledge"]
		: [];
	const candidates: any[] = [];
	for (const type of types) {
		const dir = join(edir, type);
		if (!existsSync(dir)) continue;
		for (const fn of readdirSync(dir).sort()) {
			if (!fn.endsWith(".json")) continue;
			const data = safeJson(join(dir, fn));
			if (!data) continue;
			const id = data[type === "characters" ? "character_id" : type === "abilities" ? "ability_id" : type === "events" ? "event_id" : type === "items" ? "item_id" : type === "locations" ? "location_id" : type === "factions" ? "faction_id" : type === "organizations" ? "organization_id" : type === "systems" ? "system_id" : "knowledge_id"] || fn.replace(".json", "");
			const p0 = (data.periods || [])[0] || {};
			const zhName = typeof p0.name === "object" ? p0.name?.zh || "" : p0.name || "";
			const enName = typeof p0.name === "object" ? p0.name?.en || "" : "";
			const aliases = p0.aliases || data.aliases || [];
			const nameFields = [id, zhName, enName, ...aliases].filter(Boolean).map((v: any) => norm(v));
			const metadataHay = [id, zhName, enName, ...aliases, type].join("\n");
			const bodyHay = [p0.summary || "", p0.description || ""].join("\n");
			if (includesQuery(metadataHay + "\n" + bodyHay, q)) {
				const exactName = nameFields.some((v: string) => v === q);
				const nameContains = nameFields.some((v: string) => v.includes(q));
				const metadataMatch = includesQuery(metadataHay, q);
				candidates.push({
					_rank: exactName ? 0 : nameContains ? 1 : metadataMatch ? 2 : 3,
					type: "extracted",
					entityType: type,
					ref: "entity:" + slug + ":" + type + ":" + id,
					id,
					name: zhName || enName || id,
					summary: (p0.summary || "").substring(0, 320),
					aliases,
					volume: p0.volume || data.volume || "",
					sourceRefs: data.source_refs || (p0.sourceRef ? [p0.sourceRef] : []),
				});
			}
		}
	}
	for (const item of candidates.sort((a, b) => a._rank - b._rank || String(a.name).localeCompare(String(b.name)))) {
		delete item._rank;
		results.push(item);
		if (results.length >= limit) return results;
	}
	return results;
}

function searchRaw(slug: string, query: string, limit: number): any[] {
	const q = norm(query);
	const dir = rawDir(slug);
	if (!existsSync(dir)) return [];
	const results: any[] = [];
	for (const fn of readdirSync(dir).filter(f => f.endsWith(".json"))) {
		const full = join(dir, fn);
		const data = safeJson(full);
		const entries = Array.isArray(data?.entries) ? data.entries : [];
		for (let i = 0; i < entries.length; i++) {
			const e = entries[i];
			const hay = [e.comment, e.content, e.key, ...(e.keys || []), ...(e.selectiveLogic || [])].join("\n");
			if (includesQuery(hay, q)) {
				results.push({ type: "raw", ref: `raw:${slug}:${encodeURIComponent(fn)}:${i}`, file: fn, index: i, comment: e.comment, keys: e.keys, preview: previewText(e.content || e.comment) });
				if (results.length >= limit) return results;
			}
		}
	}
	return results;
}

function sourceTier(type: string): string {
	if (type === "extracted" || type === "extracted-index" || type === "extracted-shard") return "extracted";
	if (type === "candidate" || type === "source-gap" || type === "held" || type === "boundary") return "extracted-boundary";
	return type === "raw" ? "raw" : "curated";
}

function withSourceTier(r: any): any {
	const tier = sourceTier(r.type);
	const reliability = tier === "extracted"
		? "source-backed extracted publication layer"
		: tier === "extracted-boundary"
			? "candidate/source-gap/held boundary from extracted layer"
			: r.type === "raw" ? "raw worldbook fallback" : "curated index/summary";
	return { sourceTier: tier, sourceReliability: reliability, ...r };
}

const TYPE_MOON_SLUG = "type-moon-nasuverse";
const PUBLISHED_EXTRACTED_INDEXES: Record<string, string> = {
	sources: "sources/index.json",
	characters: "characters/index.json",
	events: "events/index.json",
	relationships: "relationships/index.json",
	rules: "rules/index.json",
	locations: "locations/index.json",
	abilities: "abilities/index.json",
	organizations: "organizations/index.json",
	items: "items/index.json",
	timelines: "timelines/derived-timeline-index.json",
	candidates: "candidates/index.json",
	"source-gaps": "source-gaps/index.json",
};

function hasPublishedExtractedLayer(slug: string): boolean {
	const m = safeJson(join(extractedDir(slug), "manifest.json"));
	return !!(m?.layer === "extracted" && (m?.formalPilotRegistry || m?.formalPublishedPilots || m?.indexes));
}

function isBoundarySection(section: string): boolean {
	return section === "candidates" || section === "source-gaps";
}

function idFromPublishedRecord(record: any, fallback: string): string {
	return String(record?.recordId || record?.familyId || record?.timelineFamilyId || record?.gapInventoryId || record?.candidateInventoryId || record?.sourceId || record?.pilotId || record?.id || fallback);
}

function nameFromPublishedRecord(record: any, fallback: string): string {
	return String(record?.displayName || record?.name || record?.title || record?.familyId || record?.timelineFamilyId || record?.gapInventoryId || record?.candidateInventoryId || record?.recordId || record?.pilotId || fallback);
}

function publishedRecordArrays(index: any): Array<{ bucket: string; records: any[] }> {
	if (!index || typeof index !== "object") return [];
	const out: Array<{ bucket: string; records: any[] }> = [];
	for (const [bucket, value] of Object.entries(index)) {
		if (Array.isArray(value) && value.every(v => v && typeof v === "object")) out.push({ bucket, records: value as any[] });
	}
	return out;
}

function publishedIndexPath(slug: string, section: string): string | undefined {
	const relPath = PUBLISHED_EXTRACTED_INDEXES[section];
	return relPath ? join(extractedDir(slug), relPath) : undefined;
}

function publishedIndex(slug: string, section: string): any | undefined {
	const fp = publishedIndexPath(slug, section);
	return fp ? safeJson(fp) : undefined;
}

function publishedShardRecords(slug: string, index: any): Array<{ shardRef: string; record: any }> {
	const out: Array<{ shardRef: string; record: any }> = [];
	for (const shardRef of index?.representativeShardRefs || []) {
		const shard = safeJson(join(extractedDir(slug), shardRef));
		for (const record of shard?.records || []) out.push({ shardRef, record });
	}
	return out;
}

function publishedRecordResult(slug: string, section: string, bucket: string, record: any, idx: number, shardRef?: string): any {
	const id = idFromPublishedRecord(record, `${bucket}-${idx}`);
	const bucketNorm = norm(bucket);
	const boundary = isBoundarySection(section)
		|| bucketNorm.includes("excluded")
		|| bucketNorm.includes("held")
		|| bucketNorm.includes("nonformal")
		|| record?.candidateOnly === true
		|| record?.sourceGap === true
		|| String(record?.status || "").includes("hold")
		|| String(record?.decision || "").includes("hold")
		|| String(record?.publicationDecision || "").toLowerCase().includes("hold");
	return {
		type: boundary ? (record?.candidateOnly ? "candidate" : "source-gap") : (shardRef ? "extracted-shard" : "extracted-index"),
		entityType: section,
		ref: `exindex:${slug}:${section}:${encodeURIComponent(id)}`,
		id,
		name: nameFromPublishedRecord(record, id),
		match: shardRef ? `representative shard ${shardRef}` : `published ${section} ${bucket}`,
		summary: previewText(record, 420),
		sourceLayer: "extracted",
		publicationLayer: "source-linked-indexes-with-representative-shards",
		candidateOnly: !!record?.candidateOnly,
		sourceGap: !!record?.sourceGap,
		status: record?.status || record?.decision,
		publicationDecision: record?.publicationDecision || record?.decision || record?.reason,
		continuityScope: record?.continuityScope,
		sourcePilot: record?.sourcePilot || record?.pilotId,
		sourceRefs: record?.sourceRefs || record?.acceptedArtifactRefs || record?.source_refs,
		sourceType: record?.sourceType,
		credibility: record?.credibility,
		canonStatus: record?.canonStatus,
		audit: record?.audit || { auditStatusRef: record?.auditStatusRef, auditStatusRefs: record?.auditStatusRefs },
	};
}

function publishedExtractedSectionsForCategory(category: QueryCategory, includeBoundary = false): string[] {
	if (category === "character") return ["characters"];
	if (category === "rule") return ["rules", "abilities"];
	if (category === "source") return includeBoundary ? ["sources", "candidates", "source-gaps"] : ["sources"];
	if (category === "graph") return ["relationships", "organizations", "locations"];
	if (category === "story") return ["events", "timelines"];
	if (category === "world") return ["rules", "locations", "organizations", "abilities", "items", "timelines"];
	return includeBoundary
		? ["characters", "events", "relationships", "rules", "locations", "abilities", "organizations", "items", "timelines", "sources", "candidates", "source-gaps"]
		: ["characters", "events", "relationships", "rules", "locations", "abilities", "organizations", "items", "timelines", "sources"];
}

function searchPublishedExtractedLayer(slug: string, query: string, category: QueryCategory, limit: number): any[] {
	if (slug !== TYPE_MOON_SLUG || !hasPublishedExtractedLayer(slug)) return [];
	const q = norm(query);
	const out: any[] = [];
	const seen = new Set<string>();
	function pushResult(r: any) {
		const isBoundary = r.type === "candidate" || r.type === "source-gap" || r.sourceTier === "extracted-boundary";
		const key = isBoundary
			? ["boundary", r.sourcePilot || r.id, r.status, r.publicationDecision].filter(Boolean).join("|")
			: [r.ref, r.id, r.sourcePilot, r.status, r.publicationDecision].filter(Boolean).join("|");
		if (seen.has(key)) return;
		seen.add(key);
		out.push(r);
	}
	function scanSections(sections: string[]) {
		for (const section of sections) {
			if (out.length >= limit) return;
			const index = publishedIndex(slug, section);
			if (!index) continue;
			let i = 0;
			for (const { bucket, records } of publishedRecordArrays(index)) {
				for (const record of records) {
					if (out.length >= limit) return;
					if (includesQuery(record, q)) pushResult(publishedRecordResult(slug, section, bucket, record, i));
					i++;
				}
			}
			for (const shard of publishedShardRecords(slug, index)) {
				if (out.length >= limit) return;
				if (includesQuery(shard.record, q)) pushResult(publishedRecordResult(slug, section, "records", shard.record, i++, shard.shardRef));
			}
		}
	}
	scanSections(publishedExtractedSectionsForCategory(category, false));
	if (out.length < limit && (category === "all" || category === "source" || out.length === 0)) scanSections(publishedExtractedSectionsForCategory(category, true).filter(isBoundarySection));
	return out;
}

function getPublishedExtractedRecord(slug: string, section: string, id: string): any | undefined {
	if (slug !== TYPE_MOON_SLUG || !hasPublishedExtractedLayer(slug)) return undefined;
	const index = publishedIndex(slug, section);
	if (!index) return undefined;
	let i = 0;
	for (const { bucket, records } of publishedRecordArrays(index)) {
		for (const record of records) {
			const recordId = idFromPublishedRecord(record, `${bucket}-${i}`);
			if (recordId === id) return { section, bucket, id: recordId, record, path: PUBLISHED_EXTRACTED_INDEXES[section] };
			i++;
		}
	}
	for (const shard of publishedShardRecords(slug, index)) {
		const recordId = idFromPublishedRecord(shard.record, "record");
		if (recordId === id) return { section, bucket: "records", id: recordId, record: shard.record, path: shard.shardRef };
	}
	return undefined;
}

function extractedCharacterRows(slug: string, query = "", limit = 20): any[] {
	const q = norm(query);
	const dir = join(extractedDir(slug), "characters");
	const published = searchPublishedExtractedLayer(slug, query, "character", limit).map(withSourceTier);
	if (published.length >= limit) return published.slice(0, limit);
	if (!existsSync(dir)) return published;
	const out: any[] = [...published];
	if (slug === TYPE_MOON_SLUG && hasPublishedExtractedLayer(slug)) return out.slice(0, limit);
	const candidates: any[] = [];
	for (const fn of readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
		const data = safeJson(join(dir, fn));
		if (!data) continue;
		const id = data.character_id || fn.replace(".json", "");
		const p0 = (data.periods || [])[0] || {};
		const name = typeof p0.name === "object" ? p0.name?.zh || p0.name?.en || id : p0.name || id;
		const aliases = p0.aliases || data.aliases || [];
		const nameFields = [id, name, ...aliases].filter(Boolean).map((v: any) => norm(v));
		const metadataHay = [id, name, ...aliases].join("\n");
		const bodyHay = [p0.summary || "", p0.description || ""].join("\n");
		if (!q || includesQuery(metadataHay + "\n" + bodyHay, q)) {
			const exactName = q && nameFields.some((v: string) => v === q);
			const nameContains = q && nameFields.some((v: string) => v.includes(q));
			const metadataMatch = q && includesQuery(metadataHay, q);
			candidates.push({ _rank: !q ? 0 : exactName ? 0 : nameContains ? 1 : metadataMatch ? 2 : 3, ...withSourceTier({ type: "extracted", ref: `entity:${slug}:characters:${id}`, id, name, aliases, summary: p0.summary, sourceRefs: data.source_refs || (p0.sourceRef ? [p0.sourceRef] : []) }) });
		}
	}
	for (const item of candidates.sort((a, b) => a._rank - b._rank || String(a.name).localeCompare(String(b.name)))) {
		delete item._rank;
		out.push(item);
		if (out.length >= limit) break;
	}
	return out;
}

function search(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	const query = params.query;
	if (!slug || !query) return errorResult("action=search requires world and query", maxBytes);
	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);
	const category = (params.category || "all") as QueryCategory;
	const limit = capLimit(params.limit);
	let results: any[] = [];
	// Priority 1: extracted entities
	if (w.status === "curated" && category !== "raw") results = searchExtracted(slug, query, category, limit);
	// Priority 2: curated data
	if (results.length < limit && w.status === "curated" && category !== "raw") {
		results.push(...searchCurated(slug, query, category, limit - results.length));
	}
	// Priority 3: raw worldbook entries
	if ((w.status === "raw" || category === "raw" || (category === "all" && results.length < Math.min(5, limit))) && results.length < limit) {
		results.push(...searchRaw(slug, query, limit - results.length));
	}
	const tiered = results.map(withSourceTier);
	return textResult({ ok: true, world: slug, status: w.status, query, category, priority: ["extracted/source-backed", "curated index/summary", "raw worldbook"], count: tiered.length, results: tiered, next: tiered.slice(0, 5).map(r => `world_query { action: "get", ref: "${r.ref}" }`) }, { ok: true, action: "search", world: slug, count: tiered.length }, maxBytes);
}

function findCharacter(slug: string, idOrName: string): any | undefined {
	const chars = safeJson(join(curatedDir(slug), "characters-index.json"));
	if (!chars) return undefined;
	const q = norm(idOrName);
	return (chars.characters || []).find((ch: any) => norm(ch.id) === q || norm(ch.name) === q || (ch.aliases || []).some((a: string) => norm(a) === q) || (ch.sourceKeys || []).some((k: string) => norm(k) === q));
}

function getRef(params: any, maxBytes: number): ToolResult {
	const ref = params.ref;
	if (!ref) {
		if (params.world && params.query) {
			const extracted = searchExtracted(params.world, params.query, "all", 1)[0];
			if (extracted) return getRef({ ref: extracted.ref }, maxBytes);
			const ch = findCharacter(params.world, params.query);
			if (ch) return textResult({ ok: true, sourceTier: "curated", sourceReliability: "curated character index fallback", type: "character", ref: `char:${params.world}:${ch.id}`, character: ch }, { ok: true, action: "get", ref: `char:${params.world}:${ch.id}`, sourceTier: "curated" }, maxBytes);
			const raw = searchRaw(params.world, params.query, 1)[0];
			if (raw) return getRef({ ref: raw.ref }, maxBytes);
		}
		return errorResult("action=get requires ref, or world+query for character lookup", maxBytes);
	}
	const parts = ref.split(":");
	const kind = parts[0];
	const slug = parts[1];
	if (!kind || !slug) return errorResult(`Invalid ref: ${ref}`, maxBytes);

	if (kind === "char") {
		const id = parts.slice(2).join(":");
		const ch = findCharacter(slug, id);
		if (!ch) return errorResult(`Character not found: ${ref}`, maxBytes);
		return textResult({ ok: true, type: "character", ref, character: ch }, { ok: true, action: "get", ref }, maxBytes);
	}
	if (kind === "world") {
		const section = parts[2];
		const id = parts.slice(3).join(":");
		const wj = safeJson(join(curatedDir(slug), "world.json")) || {};
		const arr = section === "events" ? [...(wj.events || []), ...(wj.publicEvents || []), ...(wj.hiddenEvents || [])] : (wj[section] || []);
		const item = (arr || []).find((x: any) => String(x.id || x.name) === id);
		if (!item) return errorResult(`World item not found: ${ref}`, maxBytes);
		return textResult({ ok: true, type: "world", ref, section, item }, { ok: true, action: "get", ref }, maxBytes);
	}
	if (kind === "story") {
		const storyId = parts[2];
		const chapterId = parts.slice(3).join(":");
		const storyDir = join(curatedDir(slug), "stories", storyId);
		const index = safeJson(join(storyDir, "index.json"));
		const arc = (index?.arcs || []).find((a: any) => String(a.id) === chapterId || String(a.name) === chapterId);
		if (!arc) return errorResult(`Story chapter not found: ${ref}`, maxBytes);
		const file = join(curatedDir(slug), arc.file);
		const text = existsSync(file) ? readFileSync(file, "utf8") : "";
		return textResult({ ok: true, type: "story", ref, storyId, chapter: arc, content: text }, { ok: true, action: "get", ref, path: rel(file) }, maxBytes);
	}
	if (kind === "rule") {
		const fn = parts.slice(2).join(":");
		const file = join(curatedDir(slug), "world-rules", fn);
		if (!existsSync(file)) return errorResult(`Rule file not found: ${ref}`, maxBytes);
		return textResult({ ok: true, type: "rule", ref, path: rel(file), content: readFileSync(file, "utf8") }, { ok: true, action: "get", ref, path: rel(file) }, maxBytes);
	}
	if (kind === "source") {
		const id = parts.slice(2).join(":");
		const sr = safeJson(join(curatedDir(slug), "source-registry.json"));
		const src = (sr?.sources || []).find((s: any) => String(s.id) === id);
		if (!src) return errorResult(`Source not found: ${ref}`, maxBytes);
		return textResult({ ok: true, type: "source", ref, source: src }, { ok: true, action: "get", ref }, maxBytes);
	}
	if (kind === "exindex") {
		const section = parts[2];
		const id = decodeURIComponent(parts.slice(3).join(":"));
		const found = getPublishedExtractedRecord(slug, section, id);
		if (!found) return errorResult(`Extracted publication index record not found: ${ref}`, maxBytes);
		return textResult({
			ok: true,
			sourceTier: "extracted",
			sourceReliability: "source-backed extracted publication layer",
			type: "extracted-index",
			ref,
			section,
			id,
			path: found.path,
			record: found.record,
		}, { ok: true, action: "get", ref, sourceTier: "extracted", path: found.path }, maxBytes);
	}
	if (kind === "entity") {
		const entityType = parts[2]; // characters, abilities, etc.
		const entityId = parts.slice(3).join(":");
		const fp = extractedEntityFile(slug, entityType, entityId);
		if (!existsSync(fp)) return errorResult(`Entity not found: ${ref}`, maxBytes);
		const data = safeJson(fp);
		if (!data) return errorResult(`Failed to read entity: ${ref}`, maxBytes);
		return textResult({ ok: true, sourceTier: "extracted", sourceReliability: "source-backed extracted entity", type: "extracted", ref, entityType, entity: data }, { ok: true, action: "get", ref, sourceTier: "extracted", path: fp.replace(ROOT, "").replace(/\\/g, "/") }, maxBytes);
	}
	if (kind === "raw") {
		const fn = decodeURIComponent(parts[2] || "");
		const index = Number(parts[3]);
		const file = join(rawDir(slug), fn);
		if (!existsSync(file) || !Number.isFinite(index)) return errorResult(`Raw ref not found: ${ref}`, maxBytes);
		const data = safeJson(file);
		const entry = data?.entries?.[index];
		if (!entry) return errorResult(`Raw entry not found: ${ref}`, maxBytes);
		return textResult({ ok: true, sourceTier: "raw", sourceReliability: "raw worldbook fallback", type: "raw", ref, path: rel(file), index, entry }, { ok: true, action: "get", ref, sourceTier: "raw", path: rel(file) }, maxBytes);
	}
	return errorResult(`Unsupported ref kind: ${kind}`, maxBytes);
}

function characters(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	if (!slug) return errorResult("action=characters requires world", maxBytes);
	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);
	const q = norm(params.query);
	const limit = capLimit(params.limit);
	const list: any[] = [];
	if (w.status === "curated") list.push(...extractedCharacterRows(slug, q, limit));
	if (list.length < limit) {
		const chars = safeJson(join(curatedDir(slug), "characters-index.json"));
		for (const ch of chars?.characters || []) {
			if (list.length >= limit) break;
			if (!q || includesQuery([ch.id, ch.name, ...(ch.aliases || []), ...(ch.sourceKeys || []), ch.summary, ...(ch.factions || [])].join("\n"), q)) {
				if (!list.some(x => x.id === ch.id || x.name === ch.name)) list.push(withSourceTier({ type: "character", ref: `char:${slug}:${ch.id}`, id: ch.id, name: ch.name, aliases: ch.aliases, summary: ch.summary, importance: ch.importance, factions: ch.factions, sourceRefs: ch.sourceRefs }));
			}
		}
	}
	return textResult({ ok: true, world: slug, priority: ["extracted/source-backed", "curated index/summary"], count: list.length, characters: list }, { ok: true, action: "characters", world: slug, count: list.length }, maxBytes);
}

function stories(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	if (!slug) return errorResult("action=stories requires world", maxBytes);
	const cdir = curatedDir(slug);
	if (!existsSync(cdir)) return errorResult(`No curated story data for world: ${slug}`, maxBytes);
	const storiesRoot = join(cdir, "stories");
	if (!existsSync(storiesRoot)) return errorResult(`stories/ not found for world: ${slug}`, maxBytes);

	// check for flat index format: stories/index.json (DxD style)
	const flatIndex = safeJson(join(storiesRoot, "index.json"));
	const isFlat = !!(flatIndex?.stories && Array.isArray(flatIndex.stories));

	const storyId = params.storyId;
	const chapter = params.chapter;

	if (!storyId) {
		if (isFlat) {
			const list = flatIndex.stories.map((s: any) => ({ storyId: s.id, title: s.title, sourceRef: s.sourceRef }));
			return textResult({ ok: true, world: slug, format: "flat", stories: list, totalStories: flatIndex.totalStories || list.length, next: list.map(s => `world_query { action: "stories", world: "${slug}", storyId: "${s.storyId}" }`) }, { ok: true, action: "stories", world: slug, format: "flat", count: list.length }, maxBytes);
		}
		const list = readdirSync(storiesRoot).filter(s => existsSync(join(storiesRoot, s, "index.json"))).map(id => {
			const si = safeJson(join(storiesRoot, id, "index.json")) || {};
			return { storyId: id, title: si.title, totalChapters: si.totalChapters };
		});
		return textResult({ ok: true, world: slug, format: "nested", stories: list, next: list.map(s => `world_query { action: "stories", world: "${slug}", storyId: "${s.storyId}" }`) }, { ok: true, action: "stories", world: slug, format: "nested", count: list.length }, maxBytes);
	}

	// handle flat format chapter lookup
	if (isFlat) {
		const story = flatIndex.stories.find((s: any) => s.id === storyId || s.title === storyId);
		if (!story) return errorResult(`Story not found: ${slug}/${storyId}`, maxBytes);
		const file = join(cdir, story.file);
		return textResult({ ok: true, world: slug, storyId: story.id, title: story.title, sourceRef: story.sourceRef, format: "flat", path: rel(file), content: existsSync(file) ? readFileSync(file, "utf8") : "" }, { ok: true, action: "stories", world: slug, storyId, format: "flat", path: rel(file) }, maxBytes);
	}

	// nested format: stories/{storyId}/index.json
	const sdir = join(storiesRoot, storyId);
	const si = safeJson(join(sdir, "index.json"));
	if (!si) return errorResult(`Story not found: ${slug}/${storyId}`, maxBytes);
	if (!chapter) {
		const arcs = (si.arcs || []).map((a: any) => ({ ...a, ref: `story:${slug}:${storyId}:${a.id}` }));
		return textResult({ ok: true, world: slug, storyId, title: si.title, totalChapters: si.totalChapters, arcs }, { ok: true, action: "stories", world: slug, storyId, count: arcs.length }, maxBytes);
	}
	const q = norm(chapter);
	const arc = (si.arcs || []).find((a: any) => norm(a.id).includes(q) || norm(a.name).includes(q) || norm(a.file).includes(q));
	if (!arc) return errorResult(`Chapter not found: ${slug}/${storyId}/${chapter}`, maxBytes);
	const file = join(cdir, arc.file);
	return textResult({ ok: true, world: slug, storyId, chapter: arc, ref: `story:${slug}:${storyId}:${arc.id}`, path: rel(file), content: existsSync(file) ? readFileSync(file, "utf8") : "" }, { ok: true, action: "stories", world: slug, storyId, path: rel(file) }, maxBytes);
}

// ─── aggregate: cross-file merged entity lookup ───
function entityNameVariants(name: string): string[] {
	const n = norm(name);
	return [n, n.replace(/[·•·]/g, ""), n.replace(/\s+/g, ""), n.replace(/[^a-z\u4E00-\u9FFF]/g, "")];
}

function overlapScore(a: string, b: string): number {
	const va = entityNameVariants(a);
	const vb = entityNameVariants(b);
	for (const va_i of va) for (const vb_i of vb) {
		if (va_i === vb_i) return 1;
		if (va_i.includes(vb_i) || vb_i.includes(va_i)) return 0.8;
	}
	const setA = new Set(va.join(""));
	const setB = new Set(vb.join(""));
	const intersection = [...setA].filter(x => setB.has(x)).length;
	const union = new Set([...setA, ...setB]).size;
	return union > 0 ? intersection / union : 0;
}

function aggregateResults(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	const query = norm(params.query || "");
	if (!slug || !query) return errorResult("action=aggregate requires world and query", maxBytes);

	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);

	const limit = capLimit(params.limit || 20);
	let results: any[] = [];

	// Phase 1: extracted entities first (richest data)
	results.push(...searchExtracted(slug, query, "all", limit));
	// Phase 2: curated fallback
	if (results.length < limit) {
		results.push(...searchCurated(slug, query, "all", limit - results.length));
	}
	// Phase 3: raw fallback
	if (results.length < limit) {
		results.push(...searchRaw(slug, query, limit - results.length));
	}

	if (results.length === 0) return textResult({ ok: true, query, world: slug, entityCount: 0, entities: [], message: "No results found" }, { ok: true, action: "aggregate", world: slug, query }, maxBytes);

	// Phase 4: load full entity data for extracted refs
	const loaded = results.map(r => {
		if (r.type === "extracted") {
			const fp = extractedEntityFile(slug, r.entityType, r.id);
			const data = safeJson(fp);
			return { ...r, entity: data };
		}
		// resolve curated refs
		try {
			const g = getRef({ ref: r.ref, maxBytes: Math.floor(maxBytes / Math.max(results.length, 1)) }, maxBytes);
			const text = g.content?.[0]?.text || "";
			const payload = text.startsWith("{") ? JSON.parse(text) : { text };
			return { ...r, resolved: payload };
		} catch { return { ...r, resolved: { error: "failed to resolve" } }; }
	});

	// Phase 5: cluster by entity name overlap
	const clusters: Array<{ name: string; refs: any[] }> = [];
	const clustered = new Set<number>();
	for (let i = 0; i < loaded.length; i++) {
		if (clustered.has(i)) continue;
		const cluster: any[] = [loaded[i]];
		const name = loaded[i].name || loaded[i].id || `result-${i}`;
		for (let j = i + 1; j < loaded.length; j++) {
			if (clustered.has(j)) continue;
			const otherName = loaded[j].name || loaded[j].id || "";
			if (overlapScore(name, otherName) > 0.5) {
				cluster.push(loaded[j]);
				clustered.add(j);
			}
		}
		clusters.push({ name, refs: cluster });
		clustered.add(i);
	}

	// Phase 6: for each cluster, also load graph relationships if available
	const entities = clusters.map(c => {
		const entityId = c.refs.find(r => r.id)?.id || c.name;
		const graphFile = join(extractedDir(slug), "graph", "char-relations.json");
		const completeGraphFile = join(extractedDir(slug), "graph", "complete-graph.json");
		let relations: any[] = [];
		let graphInfo: any = {};
		// Check char-relations for this entity
		const charRelData = safeJson(graphFile);
		if (charRelData?.relationships) {
			relations = charRelData.relationships
				.filter((r: any) => r.source === entityId || r.target === entityId)
				.slice(0, 20);
		}
		// Check complete graph for this entity
		const compData = safeJson(completeGraphFile);
		if (compData?.nodes && compData?.edges) {
			const node = compData.nodes.find((n: any) => n.id === entityId);
			const nodeEdges = compData.edges.filter((e: any) => e.source === entityId || e.target === entityId).slice(0, 30);
			graphInfo = { node: node || null, edges: nodeEdges };
		}
		const extracted = c.refs.filter(r => r.type === "extracted").map(r => ({
			ref: r.ref, id: r.id, name: r.name, entityType: r.entityType, entity: r.entity
		}));
		const curated = c.refs.filter(r => r.type !== "extracted").map(r => ({
			ref: r.ref, type: r.type, id: r.id, name: r.name, summary: r.summary, detail: r.resolved
		}));
		return { name: c.name, entityId, extracted, curated, relations: relations.length > 0 ? relations : undefined, graph: graphInfo.edges?.length > 0 ? graphInfo : undefined, totalRefs: c.refs.length };
	});

	return textResult({ ok: true, query, world: slug, entityCount: entities.length, entities, graphAvailable: entities.some(e => e.graph) }, { ok: true, action: "aggregate", world: slug, query, entityCount: entities.length }, maxBytes);
}

function graphPublishedExtractedLayer(params: any, maxBytes: number): ToolResult | undefined {
	const slug = params.world;
	const query = norm(params.query || params.entityRef || params.ref || "");
	if (!slug || !query) return undefined;
	const graphDir = join(extractedDir(slug), "graph");
	const entityGraph = safeJson(join(graphDir, "derived-entity-graph.json"));
	if (!entityGraph) return undefined;
	const relationshipIndex = safeJson(join(graphDir, "derived-relationship-index.json"));
	const continuityIndex = safeJson(join(graphDir, "derived-continuity-index.json"));
	const buildReport = safeJson(join(graphDir, "graph-build-report.json"));
	const limit = capLimit(params.limit);
	const nodeMatches = (entityGraph?.nodes || []).filter((n: any) => includesQuery(n, query)).slice(0, limit);
	const edgeMatches = (entityGraph?.edges || []).filter((e: any) => includesQuery(e, query)).slice(0, limit);
	const relationshipMatches: any[] = [];
	for (const { bucket, records } of publishedRecordArrays(relationshipIndex)) {
		for (const record of records) {
			if (relationshipMatches.length >= limit) break;
			if (includesQuery(record, query)) relationshipMatches.push({ bucket, ...record });
		}
	}
	const continuityMatches: any[] = [];
	for (const { bucket, records } of publishedRecordArrays(continuityIndex)) {
		for (const record of records) {
			if (continuityMatches.length >= limit) break;
			if (includesQuery(record, query)) continuityMatches.push({ bucket, ...record });
		}
	}
	return textResult({
		ok: true,
		world: slug,
		query,
		sourceTier: "extracted",
		sourceLayer: "extracted",
		graphLayer: "unified-derived-graph",
		derivedOnly: entityGraph?.derivedOnly ?? true,
		primaryFactStore: entityGraph?.primaryFactStore ?? false,
		introducesNewFacts: entityGraph?.derivationPolicy?.introducesNewFacts ?? buildReport?.validation?.newFactsIntroduced ?? false,
		counts: { nodes: nodeMatches.length, edges: edgeMatches.length, relationships: relationshipMatches.length, continuities: continuityMatches.length },
		nodes: nodeMatches,
		edges: edgeMatches,
		relationships: relationshipMatches,
		continuities: continuityMatches,
		buildReport: buildReport ? { path: "graph/graph-build-report.json", status: buildReport.status, newFactsIntroduced: buildReport.validation?.newFactsIntroduced } : undefined,
		next: [`world_query { action: "search", world: "${slug}", query: "${params.query || query}" }`],
	}, { ok: true, action: "graph", world: slug, sourceTier: "extracted" }, maxBytes);
}

// ─── graph: relation traversal from a character ───
function graphTraversal(params: any, maxBytes: number): ToolResult {
	const published = graphPublishedExtractedLayer(params, maxBytes);
	if (published) return published;
	const entityRef = params.entityRef || params.ref;
	if (!entityRef) return errorResult("action=graph requires entityRef/ref, or world+query for extracted derived graph search", maxBytes);

	const parts = entityRef.split(":");
	const kind = parts[0];
	const slug = parts[1];
	if (!kind || !slug) return errorResult(`Invalid ref: ${entityRef}`, maxBytes);

	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);

	let charId = "";
	let entityData: any = null;
	let charData: any = null;

	if (kind === "entity") {
		charId = parts.slice(3).join(":");
		const fp = extractedEntityFile(slug, parts[2], charId);
		entityData = safeJson(fp);
	} else if (kind === "char") {
		charId = parts.slice(2).join(":");
		const fp = extractedEntityFile(slug, "characters", charId);
		entityData = safeJson(fp);
		charData = findCharacter(slug, charId);
	}

	if (!entityData && !charData) return errorResult(`Not found: ${entityRef}`, maxBytes);

	// factions, powerSystems, factionDetails, storyAppearances (curated fallback)
	const chars = safeJson(join(curatedDir(slug), "characters-index.json"));
	const allCharacters = chars?.characters || [];
	const wj = safeJson(join(curatedDir(slug), "world.json")) || {};

	const sameFaction: any[] = [];
	const samePower: any[] = [];
	if (charData) {
		for (const f of charData.factions || []) {
			const members = allCharacters.filter((c: any) => c.id !== charId && (c.factions || []).includes(f));
			for (const m of members) sameFaction.push({ faction: f, character: { ref: `char:${slug}:${m.id}`, id: m.id, name: m.name, summary: m.summary, importance: m.importance } });
		}
		for (const ps of charData.powerSystems || []) {
			const users = allCharacters.filter((c: any) => c.id !== charId && (c.powerSystems || []).includes(ps));
			for (const u of users) samePower.push({ powerSystem: ps, character: { ref: `char:${slug}:${u.id}`, id: u.id, name: u.name, summary: u.summary, importance: u.importance } });
		}
	}

	const factionDetails = (charData?.factions || []).map((fn: string) => {
		const sections: Array<[string, any[]]> = [["factions", worldSection(wj, "factions")], ["locations", worldSection(wj, "locations")], ["events", worldSection(wj, "events")]];
		for (const [section, items] of sections) {
			const found = items.find((x: any) => norm(x.name || x.id).includes(norm(fn)));
			if (found) return { name: fn, section, detail: found };
		}
		return { name: fn, section: "unknown" };
	});

	const relatedStories: any[] = [];
	if (w.stories && charData) {
		for (const [storyId, story] of Object.entries(w.stories || {}) as any) {
			for (const arc of story.arcs || []) {
				const nameHaystack = norm(arc.name || "") + " " + norm(arc.summary || "");
				if (nameHaystack.includes(norm(charData.id)) || (charData.aliases || []).some((a: string) => nameHaystack.includes(norm(a)))) {
					relatedStories.push({ storyId, title: story.title, arc: arc.id, name: arc.name, summary: arc.summary });
				}
			}
		}
	}

	// === extracted data: relationships, abilities, items ===
	let extractedRelations: any[] = [];
	let extractedAbilities: any[] = [];
	let extractedItems: any[] = [];
	if (entityData?.periods) {
		for (const p of entityData.periods) {
			if (p.relationships) {
				for (const [target, val] of Object.entries(p.relationships)) {
					const relType = typeof val === "object" && val !== null ? (val.type || val.relation || "") : String(val);
					if (relType) extractedRelations.push({ target, type: relType, volume: p.volume });
				}
			}
			if (p.abilities_owned) {
				for (const a of p.abilities_owned) extractedAbilities.push({ ability: a, volume: p.volume });
			}
			if (p.possessions_owned) {
				for (const i of p.possessions_owned) extractedItems.push({ item: i, volume: p.volume });
			}
		}
	}

	// === graph files ===
	const graphDir = join(extractedDir(slug), "graph");
	const charRelGraph = safeJson(join(graphDir, "char-relations.json"));
	const completeGraph = safeJson(join(graphDir, "complete-graph.json"));
	const abilityGraph = safeJson(join(graphDir, "ability-graph.json"));
	const eventGraph = safeJson(join(graphDir, "event-graph.json"));

	let graphRelations: any[] = [];
	if (charRelGraph?.relationships) {
		graphRelations = charRelGraph.relationships.filter((r: any) => r.source === charId || r.target === charId).slice(0, 50);
	}
	let graphEdges: any[] = [];
	let graphNode: any = null;
	if (completeGraph?.edges) {
		graphEdges = completeGraph.edges.filter((e: any) => e.source === charId || e.target === charId).slice(0, 50);
		graphNode = completeGraph.nodes?.find((n: any) => n.id === charId) || null;
	}

	let ownedAbilities: any[] = [];
	if (abilityGraph?.abilities) {
		const abIds = new Set(extractedAbilities.map(a => a.ability));
		ownedAbilities = abilityGraph.abilities.filter((a: any) => abIds.has(a.id)).slice(0, 30);
	}

	let relatedEvents: any[] = [];
	if (eventGraph?.events) {
		const eIds = new Set(graphEdges.filter(e => e.category === "involvement").map(e => e.source === charId ? e.target : e.source));
		relatedEvents = eventGraph.events.filter((e: any) => eIds.has(e.id)).slice(0, 20);
	}

	// Resolve target names
	const resolvedExtractedRelations = extractedRelations.map(r => {
		const targetData = safeJson(extractedEntityFile(slug, "characters", r.target));
		const p0 = targetData?.periods?.[0] || {};
		const zhName = typeof p0.name === "object" ? p0.name?.zh || r.target : p0.name || r.target;
		return { ...r, targetName: zhName };
	});

	// Narrative timeline (use calendar timeline if available, fallback to periods)
	let narrativeTimeline: any[] = [];
	const tl = loadTimeline(slug);
	if (tl && charId) {
		// Find events where this character participated
		const charEvents = (tl.events || []).filter((e: any) => {
			const parts = e.participants || e.participant_ids || [];
			return parts.includes(charId);
		}).slice(0, 20);
		narrativeTimeline = charEvents.map((e: any) => ({
			event_id: e.event_id, label: e.label,
			time: e.time_span?.start, duration: e.time_span?.duration_display,
			event_type: e.event_type, volume: e.volume, nodes: (e.nodes || []).length,
		}));
	}
	if (narrativeTimeline.length === 0 && entityData?.periods) {
		narrativeTimeline = entityData.periods.filter((p: any) => p.volume || p.time)
			.map((p: any) => ({ volume: p.volume, time: p.time, label: p.label, summary: (p.summary || "").substring(0, 200), keyEvents: (p.key_events || []).slice(0, 5) }));
	}

	return textResult({
		ok: true,
		character: {
			ref: entityRef, id: charId,
			name: entityData ? (typeof entityData.periods?.[0]?.name === "object" ? entityData.periods[0].name?.zh || charId : entityData.periods?.[0]?.name || charId) : charData?.name || charId,
			summary: entityData?.periods?.[0]?.summary || charData?.summary || "",
			importance: charData?.importance, factions: charData?.factions,
			powerSystems: charData?.powerSystems, sourceRefs: entityData?.source_refs || charData?.sourceRefs,
			extractedVolumes: entityData?.periods?.length || 0,
		},
		extractedRelations: resolvedExtractedRelations,
		extractedAbilities, extractedItems,
		graphRelations: graphRelations.slice(0, 30),
		graphEdges: graphEdges.slice(0, 30),
		graphNode,
		ownedAbilities, relatedEvents,
		factionMembers: sameFaction, powerSystemPeers: samePower, factionDetails,
		storyAppearances: relatedStories.slice(0, 20),
		narrativeTimeline: narrativeTimeline.slice(0, 15),
	}, { ok: true, action: "graph", world: slug, ref: entityRef }, maxBytes);
}

// ─── cross-world search ───
function crossWorldSearch(params: any, maxBytes: number): ToolResult {
	const query = norm(params.query || "");
	if (!query) return errorResult("cross-world search requires query", maxBytes);
	const idx = loadIndex();
	const status = (params.status || "all") as "all" | WorldStatus;
	const limit = capLimit(params.limit);
	const results: any[] = [];

	const slugs = Object.keys(idx.worlds || {}).filter((slug: string) => {
		const w = idx.worlds[slug];
		return status === "all" || w.status === status;
	});

	for (const slug of slugs) {
		if (results.length >= limit) break;
		const w = idx.worlds[slug];
		let partial: any[] = [];
		if (w.status === "curated") {
			partial = searchExtracted(slug, query, "all", Math.min(limit - results.length, 5));
		}
		if (partial.length < Math.min(5, limit - results.length) && w.status === "curated") {
			partial.push(...searchCurated(slug, query, "all", Math.min(limit - results.length - partial.length, 5)));
		}
		if (partial.length < Math.min(5, limit - results.length)) {
			partial.push(...searchRaw(slug, query, Math.min(limit - results.length - partial.length, 5)));
		}
		for (const r of partial) {
			results.push({ world: slug, worldStatus: w.status, ...r });
		}
	}

	const tiered = results.map(withSourceTier);
	return textResult({ ok: true, query, allWorlds: true, priority: ["extracted/source-backed", "curated index/summary", "raw worldbook"], count: tiered.length, results: tiered, worldsSearched: slugs.length }, { ok: true, action: "search", allWorlds: true, count: tiered.length }, maxBytes);
}

// ─── ranking rules ───
function applyRanking(results: any[], config: any): any[] {
	const rules = config?.worldLibrary?.extensionSlots?.rankingRules || [];
	if (rules.length === 0) return results;
	return [...results].sort((a: any, b: any) => {
		let score = 0;
		for (const rule of rules) {
			if (rule.prioritize === "curated") {
				if (a.type === "character" && b.type !== "character") score -= 1;
				if (b.type === "character" && a.type !== "character") score += 1;
			}
			if (rule.prioritize === "importance") {
				const ia = a.importance === "primary" ? 2 : a.importance === "secondary" ? 1 : 0;
				const ib = b.importance === "primary" ? 2 : b.importance === "secondary" ? 1 : 0;
				score += (ib - ia) * (rule.weight || 1);
			}
		}
		return score;
	});
}

// ─── timeline: time-based event query ───
function loadTimeline(slug: string): any | undefined {
	return safeJson(join(extractedDir(slug), "timeline.json")) || safeJson(join(extractedDir(slug), "timelines", "derived-timeline-index.json"));
}

function timeline(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	if (!slug) return errorResult("action=timeline requires world", maxBytes);
	const tl = loadTimeline(slug);
	if (!tl) return errorResult("No timeline.json found for world: " + slug + ". Run timeline reconstruction first.", maxBytes);

	const events = tl.events || [];
	const queryTime = params.time;
	const queryRange = params.timeRange;
	const queryEvent = params.query;

	if (events.length === 0 && tl.timelineFamilies) {
		const q = norm(queryEvent || "");
		const families = (tl.timelineFamilies || []).filter((f: any) => !q || includesQuery(f, q)).slice(0, capLimit(params.limit));
		const excluded = (tl.excludedDerivedTimelines || []).filter((f: any) => !q || includesQuery(f, q)).slice(0, capLimit(params.limit));
		return textResult({
			ok: true,
			world: slug,
			sourceTier: "extracted",
			sourceLayer: "extracted",
			timelineLayer: "derived-timeline-index",
			derivedOnly: tl.derivedOnly ?? true,
			primaryFactStore: tl.primaryFactStore ?? false,
			query: queryEvent,
			count: families.length,
			timelineFamilies: families,
			excludedDerivedTimelines: excluded,
		}, { ok: true, action: "timeline", world: slug, sourceTier: "extracted", derivedOnly: true }, maxBytes);
	}

	if (queryEvent) {
		// Single event lookup
		const event = events.find((e: any) => e.event_id === queryEvent);
		if (!event) return errorResult("Event not found: " + queryEvent, maxBytes);
		// Load entity data if available
		const entityData = safeJson(extractedEntityFile(slug, "events", queryEvent));
		return textResult({
			ok: true, world: slug, calendar: tl.calendar,
			event: { ...event, entityDetail: entityData || null },
		}, { ok: true, action: "timeline", world: slug }, maxBytes);
	}

	let filtered: any[] = [];
	if (queryTime) {
		// Events at or before this time
		filtered = events.filter((e: any) => e.time_span?.start <= queryTime);
		if (filtered.length === 0) filtered = events.filter((e: any) => e.time_span?.start?.startsWith(queryTime));
	} else if (queryRange) {
		filtered = events.filter((e: any) => e.time_span?.start >= queryRange.from && e.time_span?.start <= queryRange.to);
	} else {
		filtered = events.slice(0, capLimit(params.limit));
	}

	if (filtered.length === 0) return textResult({ ok: true, world: slug, calendar: tl.calendar, total_events: events.length, filtered: 0, events: [], tip: "No events match; try broader time range or different world" }, { ok: true, action: "timeline", world: slug }, maxBytes);

	const limit = capLimit(params.limit);
	const sliced = filtered.slice(0, limit);
	const participantSet = new Set<string>();
	for (const e of sliced) { for (const p of (e.participants || e.participant_ids || [])) participantSet.add(p); }

	return textResult({
		ok: true, world: slug, calendar: tl.calendar, total_events: events.length, filtered: filtered.length, returned: sliced.length,
		timeRange: sliced.length > 0 ? { earliest: sliced[0].time_span?.start, latest: sliced[sliced.length-1].time_span?.start } : null,
		events: sliced.map((e: any) => ({ event_id: e.event_id, label: e.label, time_span: e.time_span, nodes: (e.nodes || []).length, participants: e.participants || e.participant_ids, event_type: e.event_type, volume: e.volume })),
		active_participants: [...participantSet].slice(0, 50),
		next: [
			`world_query { action: "timeline", world: "${slug}", query: "<event_id>" }`,
			`world_query { action: "get", ref: "entity:${slug}:characters:<id>" }`
		],
	}, { ok: true, action: "timeline", world: slug, filtered: filtered.length, returned: sliced.length }, maxBytes);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "world_query",
		label: "World Query",
		description: "AI-facing query tool for this project's archived worldbooks. Default priority is source-backed/extracted data first, curated summaries/indexes second, raw worldbook entries last. Use aggregate for complete entity lookup, search for keyword retrieval, get for exact refs or world+query resolution.",
		parameters: WorldQueryParams,
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const maxBytes = capBytes(params.maxBytes);
			try {
				switch ((params.action || "search") as QueryAction) {
					case "worlds": return listWorlds(params, maxBytes);
					case "overview": return overview(params, maxBytes);
					case "search": return params.allWorlds ? crossWorldSearch(params, maxBytes) : search(params, maxBytes);
					case "get": return getRef(params, maxBytes);
					case "characters": return characters(params, maxBytes);
					case "stories": return stories(params, maxBytes);
					case "aggregate": return aggregateResults(params, maxBytes);
					case "graph": return graphTraversal(params, maxBytes);
				case "timeline": return timeline(params, maxBytes);
					default: return errorResult(`Unsupported action: ${params.action}`, maxBytes);
				}
			} catch (err: any) {
				return errorResult(err?.stack || err?.message || String(err), maxBytes, { action: params.action });
			}
		},
	});

	pi.registerCommand("worlds", {
		description: "List archived world-library worlds from .wl-index.json",
		handler: async (args, ctx) => {
			const result = listWorlds({ action: "worlds", query: args || undefined, status: "all" }, 20000);
			ctx.ui.notify(result.content[0]?.text || "No worlds", "info");
		},
	});
}
