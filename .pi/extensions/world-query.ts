import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type WorldStatus = "curated" | "raw";
type QueryAction = "worlds" | "overview" | "search" | "get" | "characters" | "stories" | "aggregate" | "graph";
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
	action: StringEnum(["worlds", "overview", "search", "get", "characters", "stories", "aggregate", "graph"] as const, {
		description: "worlds=list worlds; overview=world summary/sections; search=keyword search; get=read a ref; characters=list/search curated characters; stories=list/read story indexes/chapters; aggregate=cross-file merged entity lookup; graph=relation traversal from a character",
	}),
	world: Type.Optional(Type.String({ description: "World slug, e.g. type-moon-nasuverse or high-school-dxd" })),
	query: Type.Optional(Type.String({ description: "Keyword/name/id/fuzzy text to search" })),
	ref: Type.Optional(Type.String({ description: "Reference returned by search, e.g. char:type-moon-nasuverse:fsn-rin, story:..." })),
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

function norm(s: unknown): string {
	return String(s ?? "").toLowerCase();
}

function includesQuery(value: unknown, q: string): boolean {
	return norm(value).includes(q);
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
	return textResult({ ok: true, count: worlds.length, builtAt: idx.builtAt, worlds }, { ok: true, action: "worlds", count: worlds.length }, maxBytes);
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
	const worldJson = safeJson(join(cdir, "world.json")) || {};
	const sources = safeJson(join(cdir, "source-registry.json"));
	const storiesDir = join(cdir, "stories");
	const flatStoryIndex = safeJson(join(storiesDir, "index.json"));
	const storyIds = flatStoryIndex?.stories
		? flatStoryIndex.stories.map((s: any) => s.id)
		: (existsSync(storiesDir) ? readdirSync(storiesDir).filter(s => existsSync(join(storiesDir, s, "index.json"))) : []);
	function len(val: any): number { if (Array.isArray(val)) return val.length; if (val && typeof val === "object") return Object.keys(val).length; return 0; }
	function arr(val: any): any[] { if (Array.isArray(val)) return val; if (val && typeof val === "object") return [val]; return []; }
	const alt: Record<string, string[]> = { powerSystems: ["powerSystems", "divinityAndFamiliaSystem", "technologyAndEnergyEnvironment"], factions: ["factions", "factionsAndCrime", "majorFamilias"], rules: ["rules", "socialRulesForRP", "economyAndGuild"], locations: ["locations"], events: ["events", "publicEvents", "hiddenEvents", "timelineEvents", "knownRisks"], timelines: ["timelines", "timeline", "timelineHighlights"] };
	function resolve(key: string): any[] { for (const k of alt[key]||[key]) { const v = worldJson[k]; if (v !== undefined) return arr(v); } return []; }
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
		},
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
			["powerSystems", wj.powerSystems || []], ["factions", wj.factions || []], ["rules", wj.rules || []], ["locations", wj.locations || []],
			["events", [...(wj.events || []), ...(wj.publicEvents || []), ...(wj.hiddenEvents || [])]], ["timelines", wj.timelines || []],
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

function search(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	const query = params.query;
	if (!slug || !query) return errorResult("action=search requires world and query", maxBytes);
	const w = worldInfo(slug);
	if (!w) return errorResult(`World not found: ${slug}`, maxBytes);
	const category = (params.category || "all") as QueryCategory;
	const limit = capLimit(params.limit);
	let results: any[] = [];
	if (w.status === "curated" && category !== "raw") results = searchCurated(slug, query, category, limit);
	if ((w.status === "raw" || category === "raw" || (category === "all" && results.length < Math.min(5, limit))) && results.length < limit) {
		results.push(...searchRaw(slug, query, limit - results.length));
	}
	return textResult({ ok: true, world: slug, status: w.status, query, category, count: results.length, results, next: results.slice(0, 5).map(r => `world_query { action: "get", ref: "${r.ref}" }`) }, { ok: true, action: "search", world: slug, count: results.length }, maxBytes);
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
			const ch = findCharacter(params.world, params.query);
			if (ch) return textResult({ ok: true, type: "character", ref: `char:${params.world}:${ch.id}`, character: ch }, { ok: true, action: "get", ref: `char:${params.world}:${ch.id}` }, maxBytes);
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
	if (kind === "raw") {
		const fn = decodeURIComponent(parts[2] || "");
		const index = Number(parts[3]);
		const file = join(rawDir(slug), fn);
		if (!existsSync(file) || !Number.isFinite(index)) return errorResult(`Raw ref not found: ${ref}`, maxBytes);
		const data = safeJson(file);
		const entry = data?.entries?.[index];
		if (!entry) return errorResult(`Raw entry not found: ${ref}`, maxBytes);
		return textResult({ ok: true, type: "raw", ref, path: rel(file), index, entry }, { ok: true, action: "get", ref, path: rel(file) }, maxBytes);
	}
	return errorResult(`Unsupported ref kind: ${kind}`, maxBytes);
}

function characters(params: any, maxBytes: number): ToolResult {
	const slug = params.world;
	if (!slug) return errorResult("action=characters requires world", maxBytes);
	const w = worldInfo(slug);
	if (!w || w.status !== "curated") return errorResult(`No curated character data for world: ${slug}`, maxBytes);
	const chars = safeJson(join(curatedDir(slug), "characters-index.json"));
	if (!chars) return errorResult(`characters-index.json not found for ${slug}`, maxBytes);
	const q = norm(params.query);
	const limit = capLimit(params.limit);
	const list = (chars.characters || [])
		.filter((ch: any) => !q || includesQuery([ch.id, ch.name, ...(ch.aliases || []), ...(ch.sourceKeys || []), ch.summary, ...(ch.factions || [])].join("\n"), q))
		.slice(0, limit)
		.map((ch: any) => ({ ref: `char:${slug}:${ch.id}`, id: ch.id, name: ch.name, aliases: ch.aliases, summary: ch.summary, importance: ch.importance, factions: ch.factions, sourceRefs: ch.sourceRefs }));
	return textResult({ ok: true, world: slug, count: list.length, totalCharacters: chars.totalCharacters || chars.characters?.length, characters: list }, { ok: true, action: "characters", world: slug, count: list.length }, maxBytes);
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

	// Phase 1: search all categories
	const charResults = searchCurated(slug, query, "character", 30);
	const worldResults = searchCurated(slug, query, "world", 20);
	const storyResults = searchCurated(slug, query, "story", 20);
	const ruleResults = searchCurated(slug, query, "rule", 10);
	const rawResults = searchRaw(slug, query, 20);

	const allRefs = [...charResults, ...worldResults, ...storyResults, ...ruleResults, ...rawResults];
	if (allRefs.length === 0) return textResult({ ok: true, query, world: slug, entityCount: 0, entities: [], message: "No results found across all categories" }, { ok: true, action: "aggregate", world: slug, query }, maxBytes);

	// Phase 2: resolve each ref to full-ish content
	const resolved = allRefs.map(r => {
		try {
			const g = getRef({ ref: r.ref, maxBytes: Math.floor(maxBytes / Math.max(allRefs.length, 1)) }, maxBytes);
			const text = g.content?.[0]?.text || "";
			const payload = text.startsWith("{") ? JSON.parse(text) : { text };
			return { ...r, resolved: payload };
		} catch { return { ...r, resolved: { error: "failed to resolve" } }; }
	});

	// Phase 3: cluster by entity name overlap
	const clusters: Array<{ name: string; refs: any[] }> = [];
	const clustered = new Set<number>();
	for (let i = 0; i < resolved.length; i++) {
		if (clustered.has(i)) continue;
		const cluster: any[] = [resolved[i]];
		const name = resolved[i].name || resolved[i].id || `result-${i}`;
		for (let j = i + 1; j < resolved.length; j++) {
			if (clustered.has(j)) continue;
			const otherName = resolved[j].name || resolved[j].id || "";
			if (overlapScore(name, otherName) > 0.5) {
				cluster.push(resolved[j]);
				clustered.add(j);
			}
		}
		clusters.push({ name, refs: cluster });
		clustered.add(i);
	}

	// Phase 4: build output — per entity, group by category
	const entities = clusters.map(c => {
		const characters = c.refs.filter(r => r.type === "character").map(r => ({ ref: r.ref, id: r.id, name: r.name, summary: r.summary, importance: r.importance, detail: r.resolved?.character || r.resolved }));
		const worldSections = c.refs.filter(r => r.type === "world").map(r => ({ ref: r.ref, section: r.section, id: r.id, name: r.name, detail: r.resolved }));
		const stories = c.refs.filter(r => r.type === "story").map(r => ({ ref: r.ref, storyId: r.storyId, chapterId: r.chapterId, name: r.name, summary: r.summary }));
		const rules = c.refs.filter(r => r.type === "rule").map(r => ({ ref: r.ref, file: r.file, preview: r.preview }));
		const raw = c.refs.filter(r => r.type === "raw").map(r => ({ ref: r.ref, file: r.file, preview: r.preview }));
		return { name: c.name, characters, worldSections, stories, rules, raw, totalRefs: c.refs.length };
	});

	return textResult({ ok: true, query, world: slug, entityCount: entities.length, entities }, { ok: true, action: "aggregate", world: slug, query, entityCount: entities.length }, maxBytes);
}

// ─── graph: relation traversal from a character ───
function graphTraversal(params: any, maxBytes: number): ToolResult {
	const entityRef = params.entityRef || params.ref;
	if (!entityRef) return errorResult("action=graph requires entityRef or ref (character ref)", maxBytes);

	const parts = entityRef.split(":");
	if (parts[0] !== "char") return errorResult("graph requires a char: ref", maxBytes);
	const slug = parts[1];
	const charId = parts.slice(2).join(":");

	const w = worldInfo(slug);
	if (!w || w.status !== "curated") return errorResult(`No curated data for world: ${slug}`, maxBytes);

	const ch = findCharacter(slug, charId);
	if (!ch) return errorResult(`Character not found: ${entityRef}`, maxBytes);

	const chars = safeJson(join(curatedDir(slug), "characters-index.json"));
	const allCharacters = chars?.characters || [];
	const wj = safeJson(join(curatedDir(slug), "world.json")) || {};

	// collect related by faction
	const sameFaction: any[] = [];
	for (const f of ch.factions || []) {
		const members = allCharacters.filter((c: any) => c.id !== ch.id && (c.factions || []).includes(f));
		for (const m of members) sameFaction.push({ faction: f, character: { ref: `char:${slug}:${m.id}`, id: m.id, name: m.name, summary: m.summary, importance: m.importance } });
	}

	// collect related by power system
	const samePower: any[] = [];
	for (const ps of ch.powerSystems || []) {
		const users = allCharacters.filter((c: any) => c.id !== ch.id && (c.powerSystems || []).includes(ps));
		for (const u of users) samePower.push({ powerSystem: ps, character: { ref: `char:${slug}:${u.id}`, id: u.id, name: u.name, summary: u.summary, importance: u.importance } });
	}

	// resolve faction details from world.json
	const factionDetails = (ch.factions || []).map((fn: string) => {
		const sections: Array<[string, any[]]> = [["factions", wj.factions || []], ["locations", wj.locations || []], ["events", [...(wj.events || []), ...(wj.publicEvents || []), ...(wj.hiddenEvents || [])]]];
		for (const [section, items] of sections) {
			const found = items.find((x: any) => norm(x.name || x.id).includes(norm(fn)));
			if (found) return { name: fn, section, detail: found };
		}
		return { name: fn, section: "unknown" };
	});

	// cross-reference: find characters mentioned in the same story arcs
	const relatedStories: any[] = [];
	if (w.stories) {
		for (const [storyId, story] of Object.entries(w.stories || {}) as any) {
			for (const arc of story.arcs || []) {
				const nameHaystack = norm(arc.name || "") + " " + norm(arc.summary || "");
				if (nameHaystack.includes(norm(ch.id)) || (ch.aliases || []).some((a: string) => nameHaystack.includes(norm(a)))) {
					relatedStories.push({ storyId, title: story.title, arc: arc.id, name: arc.name, summary: arc.summary });
				}
			}
		}
	}

	return textResult({
		ok: true,
		character: { ref: entityRef, id: ch.id, name: ch.name, summary: ch.summary, importance: ch.importance, factions: ch.factions, powerSystems: ch.powerSystems, sourceRefs: ch.sourceRefs },
		factionMembers: sameFaction,
		powerSystemPeers: samePower,
		factionDetails,
		storyAppearances: relatedStories.slice(0, 20),
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
			partial = searchCurated(slug, query, "all", Math.min(limit - results.length, 5));
		}
		if (partial.length < Math.min(5, limit - results.length)) {
			partial.push(...searchRaw(slug, query, Math.min(limit - results.length - partial.length, 5)));
		}
		for (const r of partial) {
			results.push({ world: slug, worldStatus: w.status, ...r });
		}
	}

	return textResult({ ok: true, query, allWorlds: true, count: results.length, results, worldsSearched: slugs.length }, { ok: true, action: "search", allWorlds: true, count: results.length }, maxBytes);
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

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "world_query",
		label: "World Query",
		description: "AI-facing progressive query tool for this project's archived worldbooks. Configurable via .pi/rp-data-tools.json. Search curated worlds first, fall back to raw worldbook entries, and retrieve exact refs without loading huge files into context.",
		parameters: WorldQueryParams,
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const maxBytes = capBytes(params.maxBytes);
			try {
				switch ((params.action || "search") as QueryAction) {
					case "worlds": return listWorlds(params, maxBytes);
					case "overview": return overview(params, maxBytes);
					case "search": return search(params, maxBytes);
					case "get": return getRef(params, maxBytes);
					case "characters": return characters(params, maxBytes);
					case "stories": return stories(params, maxBytes);
					case "aggregate": return aggregateResults(params, maxBytes);
					case "graph": return graphTraversal(params, maxBytes);
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
