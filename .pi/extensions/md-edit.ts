import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type MdAction = "get" | "insert" | "replace" | "append" | "remove" | "upsert-section" | "upsert-list-item" | "upsert-table-row" | "validate";
type Position = "before" | "after" | "start" | "end";

const ROOT = process.cwd();

const MdEditParams = Type.Object({
	action: StringEnum(["get", "insert", "replace", "append", "remove", "upsert-section", "upsert-list-item", "upsert-table-row", "validate"] as const, {
		description: "Markdown incremental editing: get/insert/replace/append/remove/upsert-section/upsert-list-item/upsert-table-row/validate",
	}),
	file: Type.String({ description: "Markdown file path relative to project root" }),
	heading: Type.Optional(Type.String({ description: "Exact heading line, e.g. ## Core Rules" })),
	anchor: Type.Optional(Type.String({ description: "Exact anchor line or marker, e.g. <!-- md-edit:core -->" })),
	text: Type.Optional(Type.String({ description: "Exact text block for get/replace/remove target" })),
	oldText: Type.Optional(Type.String({ description: "Exact old text for replace action" })),
	content: Type.Optional(Type.String({ description: "New markdown content" })),
	position: Type.Optional(StringEnum(["before", "after", "start", "end"] as const, { description: "Insert position. Default depends on target/action." })),
	key: Type.Optional(Type.String({ description: "List item key, or table row key" })),
	keyColumn: Type.Optional(Type.String({ description: "Table key column name or zero-based index. Default 0." })),
	row: Type.Optional(Type.Array(Type.String(), { description: "Table row cells for upsert-table-row" })),
	dryRun: Type.Optional(Type.Boolean({ description: "Preview change without writing. Default false" })),
	backup: Type.Optional(Type.Boolean({ description: "Write timestamped backup before mutation. Default true" })),
	maxBytes: Type.Optional(Type.Number({ description: "Max returned bytes. Default 16000; max 50000" })),
});

function capBytes(maxBytes?: number): number {
	if (!Number.isFinite(maxBytes as number)) return 16000;
	return Math.max(1000, Math.min(50000, Math.floor(maxBytes as number)));
}

function rel(file: string): string {
	return file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/");
}

function safeFile(input: string): string {
	if (input.includes("..") || input.startsWith("/") || /^[A-Za-z]:/.test(input)) throw new Error("Unsafe file path: " + input);
	if (!input.endsWith(".md")) throw new Error("md_edit only edits .md files: " + input);
	return join(ROOT, input);
}

function maybeTruncate(text: string, maxBytes: number): { text: string; truncated: boolean; totalBytes: number; outputBytes: number } {
	const totalBytes = Buffer.byteLength(text, "utf8");
	if (totalBytes <= maxBytes) return { text, truncated: false, totalBytes, outputBytes: totalBytes };
	let out = text;
	while (Buffer.byteLength(out, "utf8") > maxBytes && out.length > 0) out = out.slice(0, Math.floor(out.length * 0.9));
	const shown = Buffer.byteLength(out, "utf8");
	return { text: out + "\n\n[md_edit truncated: " + shown + "/" + totalBytes + " bytes shown]", truncated: true, totalBytes, outputBytes: shown };
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

function splitLines(text: string): string[] {
	return text.replace(/\r\n/g, "\n").split("\n");
}

function joinLines(lines: string[]): string {
	return lines.join("\n");
}

function headingLevel(line: string): number | undefined {
	const m = line.match(/^(#{1,6})\s+/);
	return m ? m[1].length : undefined;
}

function findHeadingSection(text: string, heading: string): { start: number; end: number; level: number; lines: string[] } {
	const lines = splitLines(text);
	const matches = lines.map((line, index) => ({ line, index })).filter(x => x.line.trim() === heading.trim());
	if (matches.length !== 1) throw new Error("Expected exactly one heading match for " + heading + ", found " + matches.length);
	const start = matches[0].index;
	const level = headingLevel(lines[start]);
	if (!level) throw new Error("Target is not a heading: " + heading);
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		const nextLevel = headingLevel(lines[i]);
		if (nextLevel !== undefined && nextLevel <= level) { end = i; break; }
	}
	return { start, end, level, lines };
}

function findAnchorLine(text: string, anchor: string): { line: number; lines: string[] } {
	const lines = splitLines(text);
	const matches = lines.map((value, index) => ({ value, index })).filter(x => x.value.includes(anchor));
	if (matches.length !== 1) throw new Error("Expected exactly one anchor match for " + anchor + ", found " + matches.length);
	return { line: matches[0].index, lines };
}

function ensureTrailingNewline(text: string): string {
	return text.endsWith("\n") ? text : text + "\n";
}

function sectionBody(content: string): string[] {
	const body = splitLines(content);
	while (body.length > 0 && body[0] === "") body.shift();
	while (body.length > 0 && body[body.length - 1] === "") body.pop();
	return body;
}

function makeBackup(file: string): string {
	const backupRoot = join(ROOT, "backup", "md-edits");
	mkdirSync(backupRoot, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const out = join(backupRoot, stamp + "-" + file.split(/[\\/]/).pop());
	writeFileSync(out, readFileSync(file, "utf8"), "utf8");
	return out;
}

function atomicWrite(file: string, text: string): void {
	mkdirSync(dirname(file), { recursive: true });
	const tmp = file + ".tmp-" + process.pid + "-" + Date.now();
	writeFileSync(tmp, text, "utf8");
	renameSync(tmp, file);
}

function applyWrite(file: string, before: string, after: string, dryRun?: boolean, backup = true): { backupPath?: string; changed: boolean } {
	if (before === after) return { changed: false };
	let backupPath: string | undefined;
	if (!dryRun) {
		if (backup) backupPath = makeBackup(file);
		atomicWrite(file, after);
	}
	return { backupPath, changed: true };
}

function lineRangeSnippet(lines: string[], start: number, end: number): { startLine: number; endLine: number; text: string } {
	return { startLine: start + 1, endLine: end, text: joinLines(lines.slice(start, end)) };
}

function replaceUnique(text: string, oldText: string, content: string): string {
	const first = text.indexOf(oldText);
	if (first < 0) throw new Error("oldText/text target not found");
	const second = text.indexOf(oldText, first + oldText.length);
	if (second >= 0) throw new Error("oldText/text target is not unique");
	return text.slice(0, first) + content + text.slice(first + oldText.length);
}

function insertLines(lines: string[], index: number, content: string): string[] {
	const incoming = sectionBody(content);
	return [...lines.slice(0, index), ...incoming, ...lines.slice(index)];
}

function listItemMatches(line: string, key: string): boolean {
	const trimmed = line.trim();
	if (!/^[-*+]\s+/.test(trimmed)) return false;
	const body = trimmed.replace(/^[-*+]\s+/, "");
	return body === key || body.startsWith(key + " ") || body.startsWith(key + "：") || body.startsWith(key + ":") || body.startsWith("`" + key + "`") || body.startsWith("**" + key + "**");
}

function upsertListItem(text: string, heading: string | undefined, key: string, content: string): { text: string; action: "inserted" | "updated" } {
	const section = heading ? findHeadingSection(text, heading) : { start: 0, end: splitLines(text).length, level: 0, lines: splitLines(text) };
	const lines = section.lines;
	const newLines = sectionBody(content);
	if (newLines.length === 0) throw new Error("content is empty");
	for (let i = section.start + 1; i < section.end; i++) {
		if (listItemMatches(lines[i], key)) {
			let end = i + 1;
			while (end < section.end && /^(\s{2,}|\t)/.test(lines[end])) end++;
			const out = [...lines.slice(0, i), ...newLines, ...lines.slice(end)];
			return { text: joinLines(out), action: "updated" };
		}
	}
	const insertAt = section.end;
	const out = insertLines(lines, insertAt, content);
	return { text: joinLines(out), action: "inserted" };
}

function parseTableRow(line: string): string[] {
	return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(x => x.trim());
}

function formatTableRow(cells: string[]): string {
	return "| " + cells.map(x => String(x).trim()).join(" | ") + " |";
}

function isSeparator(line: string): boolean {
	return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function upsertTableRow(text: string, heading: string | undefined, key: string, keyColumn: string | undefined, row: string[]): { text: string; action: "inserted" | "updated"; keyColumnIndex: number } {
	const section = heading ? findHeadingSection(text, heading) : { start: 0, end: splitLines(text).length, level: 0, lines: splitLines(text) };
	const lines = section.lines;
	let tableStart = -1;
	for (let i = section.start; i < section.end - 1; i++) {
		if (lines[i].includes("|") && isSeparator(lines[i + 1])) { tableStart = i; break; }
	}
	if (tableStart < 0) throw new Error("No markdown table found in target section");
	const headers = parseTableRow(lines[tableStart]);
	let keyIndex = 0;
	if (keyColumn !== undefined) {
		const n = Number(keyColumn);
		keyIndex = Number.isInteger(n) ? n : headers.findIndex(h => h === keyColumn);
	}
	if (keyIndex < 0 || keyIndex >= headers.length) throw new Error("Invalid keyColumn: " + keyColumn);
	if (row.length !== headers.length) throw new Error("Row cell count " + row.length + " does not match table columns " + headers.length);
	let tableEnd = tableStart + 2;
	while (tableEnd < section.end && lines[tableEnd].includes("|")) tableEnd++;
	for (let i = tableStart + 2; i < tableEnd; i++) {
		const cells = parseTableRow(lines[i]);
		if (cells[keyIndex] === key) {
			lines[i] = formatTableRow(row);
			return { text: joinLines(lines), action: "updated", keyColumnIndex: keyIndex };
		}
	}
	const out = insertLines(lines, tableEnd, formatTableRow(row));
	return { text: joinLines(out), action: "inserted", keyColumnIndex: keyIndex };
}

function validateMarkdown(text: string): { ok: boolean; errors: string[]; warnings: string[]; headings: any[]; anchors: Record<string, number> } {
	const errors: string[] = [];
	const warnings: string[] = [];
	const headings: any[] = [];
	const anchors: Record<string, number> = {};
	const lines = splitLines(text);
	let lastLevel = 0;
	for (let i = 0; i < lines.length; i++) {
		const level = headingLevel(lines[i]);
		if (level !== undefined) {
			headings.push({ line: i + 1, level, text: lines[i] });
			if (lastLevel > 0 && level > lastLevel + 1) warnings.push("Heading level jumps at line " + (i + 1) + ": " + lines[i]);
			lastLevel = level;
		}
		for (const m of lines[i].matchAll(/<!--\s*([^>]+?)\s*-->/g)) {
			const key = m[1].trim();
			anchors[key] = (anchors[key] || 0) + 1;
		}
		if (isSeparator(lines[i])) {
			if (i === 0 || !lines[i - 1].includes("|")) errors.push("Table separator without header at line " + (i + 1));
		}
	}
	const duplicateHeadings = new Map<string, number>();
	for (const h of headings) duplicateHeadings.set(h.text, (duplicateHeadings.get(h.text) || 0) + 1);
	for (const [h, count] of duplicateHeadings) if (count > 1) warnings.push("Duplicate heading " + JSON.stringify(h) + " appears " + count + " times");
	for (const [a, count] of Object.entries(anchors)) if (count > 1) warnings.push("Duplicate anchor " + JSON.stringify(a) + " appears " + count + " times");
	return { ok: errors.length === 0, errors, warnings, headings, anchors };
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "md_edit",
		label: "Markdown Edit",
		description: "AI-facing incremental Markdown editor. Supports heading/anchor/exact-text targeting, section/list/table upserts, dry-run, backups, and validation.",
		parameters: MdEditParams,
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const maxBytes = capBytes(params.maxBytes);
			try {
				const file = safeFile(params.file);
				if (!existsSync(file) && params.action !== "upsert-section") return errorResult("File not found: " + params.file, maxBytes, { action: params.action, file: params.file });
				const before = existsSync(file) ? readFileSync(file, "utf8") : "";
				const backupEnabled = params.backup !== false;

				if (params.action === "validate") {
					const validation = validateMarkdown(before);
					return result({ ok: validation.ok, file: params.file, validation }, { ok: validation.ok, action: "validate", file: params.file }, maxBytes);
				}

				if (params.action === "get") {
					if (params.heading) {
						const section = findHeadingSection(before, params.heading);
						return result({ ok: true, file: params.file, target: "heading", heading: params.heading, ...lineRangeSnippet(section.lines, section.start, section.end) }, { ok: true, action: "get", file: params.file, heading: params.heading }, maxBytes);
					}
					if (params.anchor) {
						const anchor = findAnchorLine(before, params.anchor);
						return result({ ok: true, file: params.file, target: "anchor", anchor: params.anchor, line: anchor.line + 1, text: anchor.lines[anchor.line] }, { ok: true, action: "get", file: params.file, anchor: params.anchor }, maxBytes);
					}
					if (params.text) {
						const idx = before.indexOf(params.text);
						if (idx < 0) throw new Error("text target not found");
						return result({ ok: true, file: params.file, target: "text", offset: idx, text: params.text }, { ok: true, action: "get", file: params.file }, maxBytes);
					}
					return result({ ok: true, file: params.file, text: before }, { ok: true, action: "get", file: params.file }, maxBytes);
				}

				let after = before;
				let change: Record<string, unknown> = {};

				if (params.action === "insert") {
					if (!params.content) throw new Error("insert requires content");
					if (params.heading) {
						const section = findHeadingSection(before, params.heading);
						const at = (params.position || "after") === "before" ? section.start : section.end;
						after = joinLines(insertLines(section.lines, at, params.content));
						change = { target: "heading", heading: params.heading, position: params.position || "after" };
					} else if (params.anchor) {
						const anchor = findAnchorLine(before, params.anchor);
						const at = (params.position || "after") === "before" ? anchor.line : anchor.line + 1;
						after = joinLines(insertLines(anchor.lines, at, params.content));
						change = { target: "anchor", anchor: params.anchor, position: params.position || "after" };
					} else {
						const lines = splitLines(before);
						const at = (params.position || "end") === "start" ? 0 : lines.length;
						after = joinLines(insertLines(lines, at, params.content));
						change = { target: "file", position: params.position || "end" };
					}
				} else if (params.action === "replace") {
					const replacement = params.content ?? "";
					if (params.heading) {
						const section = findHeadingSection(before, params.heading);
						const body = sectionBody(replacement);
						after = joinLines([...section.lines.slice(0, section.start + 1), "", ...body, ...section.lines.slice(section.end)]);
						change = { target: "heading", heading: params.heading };
					} else {
						const old = params.oldText || params.text;
						if (!old) throw new Error("replace requires heading or oldText/text");
						after = replaceUnique(before, old, replacement);
						change = { target: "text" };
					}
				} else if (params.action === "append") {
					if (!params.content) throw new Error("append requires content");
					if (params.heading) {
						const section = findHeadingSection(before, params.heading);
						after = joinLines(insertLines(section.lines, section.end, params.content));
						change = { target: "heading", heading: params.heading, position: "end" };
					} else {
						after = ensureTrailingNewline(before) + ensureTrailingNewline(params.content);
						change = { target: "file", position: "end" };
					}
				} else if (params.action === "remove") {
					if (params.heading) {
						const section = findHeadingSection(before, params.heading);
						after = joinLines([...section.lines.slice(0, section.start), ...section.lines.slice(section.end)]);
						change = { target: "heading", heading: params.heading };
					} else {
						const old = params.oldText || params.text;
						if (!old) throw new Error("remove requires heading or oldText/text");
						after = replaceUnique(before, old, "");
						change = { target: "text" };
					}
				} else if (params.action === "upsert-section") {
					if (!params.heading || params.content === undefined) throw new Error("upsert-section requires heading and content");
					const lines = splitLines(before);
					const headingMatches = lines.filter(line => line.trim() === params.heading!.trim()).length;
					if (headingMatches > 1) throw new Error("upsert-section target heading is not unique: " + params.heading);
					if (headingMatches === 1) {
						const section = findHeadingSection(before, params.heading);
						const body = sectionBody(params.content);
						after = joinLines([...section.lines.slice(0, section.start + 1), "", ...body, ...section.lines.slice(section.end)]);
						change = { target: "heading", heading: params.heading, upsert: "updated" };
					} else {
						after = ensureTrailingNewline(before) + "\n" + params.heading + "\n\n" + ensureTrailingNewline(params.content);
						change = { target: "heading", heading: params.heading, upsert: "inserted" };
					}
				} else if (params.action === "upsert-list-item") {
					if (!params.key || !params.content) throw new Error("upsert-list-item requires key and content");
					const upsert = upsertListItem(before, params.heading, params.key, params.content);
					after = upsert.text;
					change = { target: "list", heading: params.heading, key: params.key, upsert: upsert.action };
				} else if (params.action === "upsert-table-row") {
					if (!params.key || !params.row) throw new Error("upsert-table-row requires key and row");
					const upsert = upsertTableRow(before, params.heading, params.key, params.keyColumn, params.row);
					after = upsert.text;
					change = { target: "table", heading: params.heading, key: params.key, keyColumnIndex: upsert.keyColumnIndex, upsert: upsert.action };
				}

				after = ensureTrailingNewline(after);
				const writeInfo = applyWrite(file, before, after, params.dryRun, backupEnabled);
				return result({ ok: true, file: params.file, dryRun: !!params.dryRun, changed: writeInfo.changed, backup: writeInfo.backupPath ? rel(writeInfo.backupPath) : undefined, change }, { ok: true, action: params.action, file: params.file, dryRun: !!params.dryRun, changed: writeInfo.changed, backup: writeInfo.backupPath ? rel(writeInfo.backupPath) : undefined, change }, maxBytes);
			} catch (err: any) {
				return errorResult(err?.stack || err?.message || String(err), maxBytes, { action: params.action, file: params.file });
			}
		},
	});
}
