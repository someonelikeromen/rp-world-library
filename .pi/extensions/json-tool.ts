import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXT_DIR = typeof __dirname !== "undefined" ? __dirname : fileURLToPath(new URL(".", import.meta.url));
const TOOL_CJS = resolve(EXT_DIR, "../../tools/p1-scan/json-tool.cjs");

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "json_tool",
    label: "JSON Tool",
    description: "结构化 JSON 编辑工具。支持 read/create/append/set/remove/batch/copy/validate/list/count/keys 命令。路径语法：periods, periods[0], periods[id=vol-06], periods[0].abilities_owned",

    parameters: Type.Object({
      command: Type.String({
        description: "json-tool 命令：read, create, append, prepend, set, merge, remove, batch, copy, validate, list, count, keys",
        examples: ["read", "create", "append", "set", "batch", "copy", "validate"]
      }),
      args: Type.Array(Type.String(), {
        description: "命令参数数组。例如：[\"file.json\", \"periods\"] 对应 read file.json periods",
        examples: [
          ["characters/kinji.json", "periods"],
          ["characters/kinji.json", "periods", "@new-period.json"],
          ["characters/", ".json"]
        ]
      }),
      cwd: Type.Optional(Type.String({
        description: "可选工作目录（相对于项目根或绝对路径）"
      }))
    }),

    required: ["command", "args"],

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const cmdArgs = [TOOL_CJS, params.command, ...params.args];
      const cwd = params.cwd ? resolve(params.cwd) : undefined;

      try {
        const stdout = execSync(`node ${cmdArgs.map(a => `"${a}"`).join(" ")}`, {
          cwd,
          encoding: "utf8",
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024
        });

        // Try to parse as JSON, fall back to raw text
        let result: unknown;
        try {
          result = JSON.parse(stdout.trim());
        } catch {
          result = stdout.trim();
        }

        return {
          content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
          details: { command: params.command, args: params.args, raw: stdout.trim().slice(0, 2000) }
        };
      } catch (err: unknown) {
        const error = err as Error & { stderr?: string; stdout?: string };
        return {
          content: [{ type: "text", text: `Error: ${error.message}\n${error.stderr || ""}` }],
          isError: true,
          details: { command: params.command, args: params.args, error: error.message }
        };
      }
    }
  });
}
