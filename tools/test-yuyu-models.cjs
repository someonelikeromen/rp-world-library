/**
 * test-yuyu-models.cjs — 测试 lt-yuyu provider 各模型是否可用
 *
 * 对每个配置的模型发送一个简单 chat completion 请求，
 * 报告响应状态（成功/错误码/延迟）。
 *
 * 用法: node test-yuyu-models.cjs
 */

const https = require("https");

const BASE = "https://sub.anzhiyu.com/v1";
const API_KEY = process.env.YUYU_API_KEY || (() => { const m = require('C:/Users/22134/.pi/agent/models.json'); return m.providers.yuyu?.apiKey || ''; })();

const MODELS = [
  { id: "gpt-5.5", label: "GPT-5.5" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex" },
  { id: "codex-mini-latest", label: "Codex Mini Latest" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
];

function chat(modelId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: "Say OK" }],
      max_tokens: 10,
    });

    const start = Date.now();
    const req = https.request(
      `${BASE}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const elapsed = Date.now() - start;
          let statusText = "";
          let ok = false;

          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              if (json.choices && json.choices[0]?.message?.content) {
                ok = true;
                statusText = `OK → "${json.choices[0].message.content.trim()}"`;
              } else {
                statusText = `200 but unexpected response shape`;
              }
            } catch (e) {
              statusText = `200 but parse error: ${e.message}`;
            }
          } else {
            // Truncate error body
            const bodyPreview = data.replace(/\s+/g, " ").substring(0, 120);
            statusText = `${res.statusCode} ${bodyPreview}`;
          }

          resolve({ modelId, ok, elapsed, statusText });
        });
      }
    );

    req.on("error", (err) => {
      resolve({ modelId, ok: false, elapsed: Date.now() - start, statusText: `error: ${err.message}` });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ modelId, ok: false, elapsed: Date.now() - start, statusText: "timeout (30s)" });
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("=== Testing lt-yuyu models ===\n");
  const results = [];

  for (const m of MODELS) {
    process.stdout.write(`  ${m.label.padEnd(20)}... `);
    const r = await chat(m.id);
    results.push(r);
    const icon = r.ok ? "✅" : "❌";
    console.log(`${icon} ${r.elapsed}ms  ${r.statusText}`);
  }

  console.log("\n=== Summary ===");
  const working = results.filter((r) => r.ok);
  const failing = results.filter((r) => !r.ok);
  console.log(`Working: ${working.length}  Failing: ${failing.length}`);
  for (const r of working) console.log(`  ✅ ${r.modelId} (${r.elapsed}ms)`);
  for (const r of failing) console.log(`  ❌ ${r.modelId} — ${r.statusText.substring(0, 80)}`);
}

main().catch(console.error);
