# Two-Pass Prose Render Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable two-pass narrative pipeline where the main agent settles canonical facts first, then a separate renderer produces player-visible prose, with automatic lint retries and safe persistence.

**Architecture:** Split each turn into Pass A (settlement / domain state / direction packet) and Pass B (clean-room prose rendering). Pass A ends with one accepted packet and no player-facing narration. Pass B is driven by extension lifecycle hooks, reads session chronology, renders from the packet plus prior prose history, lints the draft, retries when needed, then stores the final prose as a custom message without triggering a new turn.

**Tech Stack:** TypeScript, pi extension lifecycle hooks, pi session manager, custom messages, model streaming API, schema validation, node:test.

---

## 1. Mechanism Overview

The mechanism has five moving parts:

1. **Settlement packet tool**: a terminating tool such as `submit_direction_packet` validates and accepts the current turn's canonical result.
2. **Session chronology projection**: a deterministic reader reconstructs turns from user messages, packet tool calls, tool results, and prose custom messages.
3. **Two-pass render extension**: listens to `agent_end` and `agent_settled`, renders pending packets after Pass A, and delivers final prose only after the agent has fully settled.
4. **Prose delivery queue**: buffers render output between `agent_end` and `agent_settled` so delivery never wakes Pass A again.
5. **Render lint and reroll layer**: retries drafts that violate output rules, redacts persistent secret leaks, and supports explicit reroll of the latest prose without mutating canonical facts.

The key invariant is simple: **state and facts live in Pass A; prose surface lives in Pass B.**

---

## 2. Target File Structure

Use these paths when porting the pattern into another pi project. Rename namespaces if the destination project does not use narrative terminology.

```text
engine/render/
  packet-schema.ts                 # DirectionPacket schema, parser, and type guards
  packet-validation.ts             # Domain-specific packet validation
  packet-firewall.ts               # Secret / hidden-fact firewall for packet fields
  render-turn.ts                   # Renderer message assembly, history window, lint retry input
  settlement-prose-firewall.ts     # Removes accidental Pass A prose from assistant messages
  prose-digest-store.ts            # Optional persisted summary overrides for old prose turns

engine/session-chronology/
  session-chronology.ts            # Reconstructs delivered / awaiting turns from session entries

extensions/two-pass-render/
  index.ts                         # Lifecycle hooks and render orchestration
  prose-delivery.ts                # Queue and delivery detail constructors
  reroll.ts                        # Manual rerender of the latest prose
  delivery.test.ts                 # Lifecycle and delivery tests
  reroll.test.ts                   # Reroll target and safety tests

tools/settlement/
  submit-direction-packet.ts       # Terminating settlement handoff tool

prompts/render/
  system.md                        # Renderer identity and hard boundary
  protocol.md                      # How packet facts become in-scene prose
  output-contract.md               # Final visible prose rules

prompts/settlement/
  direction-contract.md            # How Pass A writes packets
```

---

## 3. Core Contracts

### Direction Packet

The packet is the only current-turn input the renderer can trust.

```ts
export type DirectionPacket = RenderDirectionPacket | DirectReplyPacket;

export interface RenderDirectionPacket {
  needsRender: true;
  playerAction: string;
  resolvedChanges: string[];
  npcStances: Array<{
    actorId: string;
    stance: string;
    wants: string;
    move: string;
    refusesToSay: string;
  }>;
  npcOmissions?: Array<{
    actorId: string;
    reasonCode: "unconscious" | "watching-silently" | "blocked-by-threat" | "not-relevant";
    playerSafeNote: string;
  }>;
  sensoryAnchors?: string[];
  endWindow: string;
  eventWeight: "light" | "normal" | "heavy";
  canonFacts: string[];
  suggestedActions?: Array<{ submitText: string }>;
}

export interface DirectReplyPacket {
  needsRender: false;
  directReply: string;
}
```

### Custom Message Details

Every delivered prose message must carry the packet tool call id.

```ts
export const PROSE_CUSTOM_TYPE = "project-prose";
export const SUBMIT_DIRECTION_PACKET_TOOL = "submit_direction_packet";

export type ProseDeliveryDetails =
  | { kind: "direct-reply"; toolCallId: string }
  | { kind: "render-fallback"; toolCallId: string }
  | {
      kind: "rendered";
      toolCallId: string;
      lintRuleIds: readonly string[];
      suggestedActions: readonly Array<{ submitText: string }>;
    }
  | {
      kind: "rerolled";
      replacedEntryId: string;
      toolCallId: string;
      lintRuleIds: readonly string[];
      suggestedActions?: readonly Array<{ submitText: string }>;
    };
```

### Lifecycle Boundary

`agent_end` may render and queue. `agent_settled` may deliver. Neither should create a normal assistant message.

```ts
api.onAgentEnd(async (_event, ctx) => {
  const chronology = readRenderChronology(ctx.sessionManager.getBranch(), ctx);
  const pending = chronology?.awaitingDelivery;
  if (chronology === undefined || pending === undefined || renderedIds.has(pending.toolCallId)) {
    return;
  }
  renderedIds.add(pending.toolCallId);

  if (!pending.packet.needsRender) {
    delivery.queue(createProseDelivery(pending.packet, pending.toolCallId));
    return;
  }

  const prose = await renderProse(ctx, chronology, pending.packet, collectBlockedSecrets(ctx));
  delivery.queue(createProseDelivery(pending.packet, pending.toolCallId, prose));
});

api.onAgentSettled((_event, ctx) => {
  delivery.settle((item) => {
    pi.sendMessage(
      { customType: PROSE_CUSTOM_TYPE, content: item.text, display: true, details: item.details },
      { triggerTurn: false },
    );
    clearRenderPreview(ctx);
  });
});
```

---

## 4. Implementation Tasks

### Task 1: Add the Direction Packet Schema

**Files:**
- Create: `engine/render/packet-schema.ts`
- Test: `engine/render/packet-schema.test.ts`

- [ ] **Step 1: Write schema tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { parseDirectionPacket } from "./packet-schema.ts";

void test("parseDirectionPacket accepts render packets", () => {
  const packet = parseDirectionPacket(
    {
      needsRender: true,
      playerAction: "Open the locked door carefully.",
      resolvedChanges: ["The door opens but the hinge squeals."],
      npcStances: [],
      endWindow: "The corridor beyond is dark and recently disturbed.",
      eventWeight: "normal",
      canonFacts: [],
    },
    "packet",
  );

  assert.equal(packet.needsRender, true);
});

void test("parseDirectionPacket accepts direct replies", () => {
  const packet = parseDirectionPacket({ needsRender: false, directReply: "Rules answer." }, "packet");
  assert.deepEqual(packet, { needsRender: false, directReply: "Rules answer." });
});

void test("parseDirectionPacket rejects missing render fields", () => {
  assert.throws(
    () => parseDirectionPacket({ needsRender: true, playerAction: "x" }, "packet"),
    /resolvedChanges|npcStances|endWindow|eventWeight|canonFacts/u,
  );
});
```

- [ ] **Step 2: Implement the schema parser**

```ts
export type EventWeight = "light" | "normal" | "heavy";
export type NpcOmissionReason =
  | "unconscious"
  | "watching-silently"
  | "blocked-by-threat"
  | "not-relevant";

export interface SuggestedAction {
  submitText: string;
}

export interface RenderDirectionPacket {
  needsRender: true;
  playerAction: string;
  resolvedChanges: string[];
  npcStances: Array<{
    actorId: string;
    stance: string;
    wants: string;
    move: string;
    refusesToSay: string;
  }>;
  npcOmissions?: Array<{
    actorId: string;
    reasonCode: NpcOmissionReason;
    playerSafeNote: string;
  }>;
  sensoryAnchors?: string[];
  endWindow: string;
  eventWeight: EventWeight;
  canonFacts: string[];
  suggestedActions?: SuggestedAction[];
}

export interface DirectReplyPacket {
  needsRender: false;
  directReply: string;
}

export type DirectionPacket = RenderDirectionPacket | DirectReplyPacket;

export function parseDirectionPacket(value: unknown, label: string): DirectionPacket {
  if (!isRecord(value)) {
    throw new Error(`${label}: expected object`);
  }
  if (value.needsRender === false) {
    return { needsRender: false, directReply: requireString(value.directReply, `${label}.directReply`) };
  }
  if (value.needsRender !== true) {
    throw new Error(`${label}.needsRender: expected boolean literal`);
  }
  return {
    needsRender: true,
    playerAction: requireString(value.playerAction, `${label}.playerAction`),
    resolvedChanges: requireStringArray(value.resolvedChanges, `${label}.resolvedChanges`),
    npcStances: requireNpcStances(value.npcStances, `${label}.npcStances`),
    ...(value.npcOmissions === undefined
      ? {}
      : { npcOmissions: requireNpcOmissions(value.npcOmissions, `${label}.npcOmissions`) }),
    ...(value.sensoryAnchors === undefined
      ? {}
      : { sensoryAnchors: requireStringArray(value.sensoryAnchors, `${label}.sensoryAnchors`) }),
    endWindow: requireString(value.endWindow, `${label}.endWindow`),
    eventWeight: requireEventWeight(value.eventWeight, `${label}.eventWeight`),
    canonFacts: requireStringArray(value.canonFacts, `${label}.canonFacts`),
    ...(value.suggestedActions === undefined
      ? {}
      : { suggestedActions: requireSuggestedActions(value.suggestedActions, `${label}.suggestedActions`) }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array`);
  }
  return value.map((entry, index) => requireString(entry, `${path}[${index}]`));
}

function requireEventWeight(value: unknown, path: string): EventWeight {
  if (value === "light" || value === "normal" || value === "heavy") {
    return value;
  }
  throw new Error(`${path}: expected light, normal, or heavy`);
}

function requireNpcStances(value: unknown, path: string): RenderDirectionPacket["npcStances"] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array`);
  }
  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`${path}[${index}]: expected object`);
    }
    return {
      actorId: requireString(entry.actorId, `${path}[${index}].actorId`),
      stance: requireString(entry.stance, `${path}[${index}].stance`),
      wants: requireString(entry.wants, `${path}[${index}].wants`),
      move: requireString(entry.move, `${path}[${index}].move`),
      refusesToSay: requireString(entry.refusesToSay, `${path}[${index}].refusesToSay`),
    };
  });
}

function requireNpcOmissions(value: unknown, path: string): NonNullable<RenderDirectionPacket["npcOmissions"]> {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array`);
  }
  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`${path}[${index}]: expected object`);
    }
    return {
      actorId: requireString(entry.actorId, `${path}[${index}].actorId`),
      reasonCode: requireOmissionReason(entry.reasonCode, `${path}[${index}].reasonCode`),
      playerSafeNote: requireString(entry.playerSafeNote, `${path}[${index}].playerSafeNote`),
    };
  });
}

function requireOmissionReason(value: unknown, path: string): NpcOmissionReason {
  if (
    value === "unconscious" ||
    value === "watching-silently" ||
    value === "blocked-by-threat" ||
    value === "not-relevant"
  ) {
    return value;
  }
  throw new Error(`${path}: invalid omission reason`);
}

function requireSuggestedActions(value: unknown, path: string): SuggestedAction[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array`);
  }
  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`${path}[${index}]: expected object`);
    }
    return { submitText: requireString(entry.submitText, `${path}[${index}].submitText`) };
  });
}
```

- [ ] **Step 3: Run the focused test**

```bash
node --test engine/render/packet-schema.test.ts
```

Expected: all packet schema tests pass.

- [ ] **Step 4: Commit**

```bash
git add engine/render/packet-schema.ts engine/render/packet-schema.test.ts
git commit -m "feat: add direction packet schema"
```

---

### Task 2: Add Session Chronology Projection

**Files:**
- Create: `engine/session-chronology/session-chronology.ts`
- Test: `engine/session-chronology/session-chronology.test.ts`

- [ ] **Step 1: Write chronology tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  projectSessionChronology,
  PROSE_CUSTOM_TYPE,
  SUBMIT_DIRECTION_PACKET_TOOL,
} from "./session-chronology.ts";

const packet = {
  needsRender: true,
  playerAction: "Open the door.",
  resolvedChanges: ["The hinge squeals."],
  npcStances: [],
  endWindow: "The hall waits beyond.",
  eventWeight: "normal",
  canonFacts: [],
};

void test("render projection exposes awaiting delivery after accepted packet", () => {
  const result = projectSessionChronology(
    {
      kind: "messages",
      messages: [
        { role: "user", content: "Open it." },
        {
          role: "assistant",
          content: [{ type: "toolCall", id: "call-1", name: SUBMIT_DIRECTION_PACKET_TOOL, arguments: packet }],
        },
        { role: "toolResult", toolCallId: "call-1", toolName: SUBMIT_DIRECTION_PACKET_TOOL, isError: false },
      ],
    },
    { kind: "render" },
  );

  assert.equal(result.kind, "ready");
  if (result.kind === "ready") {
    assert.equal(result.value.awaitingDelivery?.toolCallId, "call-1");
    assert.equal(result.value.mode, "opening");
  }
});

void test("render projection treats custom prose as delivered narrative", () => {
  const result = projectSessionChronology(
    {
      kind: "messages",
      messages: [
        { role: "user", content: "Open it." },
        {
          role: "assistant",
          content: [{ type: "toolCall", id: "call-1", name: SUBMIT_DIRECTION_PACKET_TOOL, arguments: packet }],
        },
        { role: "toolResult", toolCallId: "call-1", toolName: SUBMIT_DIRECTION_PACKET_TOOL, isError: false },
        {
          role: "custom",
          customType: PROSE_CUSTOM_TYPE,
          content: "The door opened.",
          details: { kind: "rendered", toolCallId: "call-1" },
        },
      ],
    },
    { kind: "render" },
  );

  assert.equal(result.kind, "ready");
  if (result.kind === "ready") {
    assert.equal(result.value.turns.length, 1);
    assert.equal(result.value.turns[0]?.prose, "The door opened.");
    assert.equal(result.value.mode, "continuation");
  }
});
```

- [ ] **Step 2: Implement chronology reader**

Implement a deterministic fold with these responsibilities:

```ts
export const PROSE_CUSTOM_TYPE = "project-prose";
export const SUBMIT_DIRECTION_PACKET_TOOL = "submit_direction_packet";

export type RendererMode = "opening" | "continuation";

export interface DeliveredNarrativeTurn {
  kind: "narrative";
  status: "delivered";
  toolCallId: string;
  playerInput: string;
  packet: RenderDirectionPacket;
  prose: string;
}

export interface AwaitingNarrativeTurn {
  kind: "narrative";
  status: "awaiting-delivery";
  toolCallId: string;
  playerInput: string;
  packet: RenderDirectionPacket;
}

export interface DeliveredDirectTurn {
  kind: "direct";
  status: "delivered";
  toolCallId: string;
  playerInput: string;
  packet: DirectReplyPacket;
  reply: string;
}

export interface AwaitingDirectTurn {
  kind: "direct";
  status: "awaiting-delivery";
  toolCallId: string;
  playerInput: string;
  packet: DirectReplyPacket;
}

export type SessionTurn =
  | DeliveredNarrativeTurn
  | AwaitingNarrativeTurn
  | DeliveredDirectTurn
  | AwaitingDirectTurn;

export interface RenderChronologyView {
  mode: RendererMode;
  turns: readonly DeliveredNarrativeTurn[];
  latestNarrativeProse?: string;
  awaitingDelivery?: AwaitingNarrativeTurn | AwaitingDirectTurn;
}
```

The fold rules are:

- A packet is accepted only if a successful `toolResult` exists for its `toolCallId`.
- A prose custom message is associated by `details.toolCallId`.
- A prose delivery before the matching packet result is invalid.
- A prose delivery after the next user message is invalid.
- More than one accepted packet in the same user turn is invalid.
- Direct replies do not enter `RenderChronologyView.turns`; only delivered narrative prose does.

- [ ] **Step 3: Run chronology tests**

```bash
node --test engine/session-chronology/session-chronology.test.ts
```

Expected: all chronology tests pass.

- [ ] **Step 4: Commit**

```bash
git add engine/session-chronology/session-chronology.ts engine/session-chronology/session-chronology.test.ts
git commit -m "feat: project narrative session chronology"
```

---

### Task 3: Add the Terminating Packet Tool

**Files:**
- Create: `tools/settlement/submit-direction-packet.ts`
- Modify: `tools/registry.ts`
- Test: `tools/settlement/submit-direction-packet.test.ts`

- [ ] **Step 1: Write tool tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { submitDirectionPacketTool } from "./submit-direction-packet.ts";

void test("submitDirectionPacketTool accepts render packet and terminates", () => {
  const result = submitDirectionPacketTool({
    needsRender: true,
    playerAction: "Open the door.",
    resolvedChanges: ["The hinge squeals."],
    npcStances: [],
    endWindow: "The hall waits beyond.",
    eventWeight: "normal",
    canonFacts: [],
  });

  assert.equal(result.terminate, true);
  assert.match(result.content[0]?.text ?? "", /renderer will handle|渲染器/u);
});

void test("submitDirectionPacketTool accepts direct replies and terminates", () => {
  const result = submitDirectionPacketTool({ needsRender: false, directReply: "Rules answer." });
  assert.equal(result.terminate, true);
});
```

- [ ] **Step 2: Implement the tool**

```ts
import { parseDirectionPacket, type DirectionPacket } from "../../engine/render/packet-schema.ts";

export interface TextToolResult {
  content: Array<{ type: "text"; text: string }>;
  metadata?: Record<string, unknown>;
}

export type TerminatingToolResult = TextToolResult & { terminate: true };

export function submitDirectionPacketTool(params: unknown): TerminatingToolResult {
  const packet = parseDirectionPacket(params, "direction packet");
  validatePacketSafety(packet);
  return {
    content: [{ type: "text", text: formatAccepted(packet) }],
    metadata: { packet },
    terminate: true,
  };
}

function validatePacketSafety(packet: DirectionPacket): void {
  if (!packet.needsRender) {
    return;
  }
  if (packet.resolvedChanges.length === 0) {
    throw new Error("direction packet.resolvedChanges must include at least one visible settled fact");
  }
  if (packet.endWindow.includes("A or B") || packet.endWindow.includes("choose")) {
    throw new Error("direction packet.endWindow must be one concrete pressure, not a menu");
  }
}

function formatAccepted(packet: DirectionPacket): string {
  if (!packet.needsRender) {
    return "direction packet accepted: directReply will be delivered.";
  }
  return [
    "direction packet accepted; settlement is complete.",
    `resolvedChanges=${packet.resolvedChanges.length}; npcStances=${packet.npcStances.length}; eventWeight=${packet.eventWeight}.`,
    "The renderer will handle player-visible prose.",
  ].join("\n");
}
```

- [ ] **Step 3: Register the tool**

Add the tool to the project registry using the host project's existing tool definition format. The registered tool name must match `SUBMIT_DIRECTION_PACKET_TOOL` exactly.

- [ ] **Step 4: Run tool tests**

```bash
node --test tools/settlement/submit-direction-packet.test.ts
```

Expected: all packet tool tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/settlement/submit-direction-packet.ts tools/settlement/submit-direction-packet.test.ts tools/registry.ts
git commit -m "feat: add terminating direction packet tool"
```

---

### Task 4: Add Renderer Message Assembly and Lint Retry

**Files:**
- Create: `engine/render/render-turn.ts`
- Test: `engine/render/render-turn.test.ts`

- [ ] **Step 1: Write renderer assembly tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import type { RenderChronologyView } from "../session-chronology/session-chronology.ts";
import { buildLintRetryMessages, buildRendererMessages, lintRenderedProse } from "./render-turn.ts";

const packet = {
  needsRender: true as const,
  playerAction: "Open the door.",
  resolvedChanges: ["The hinge squeals."],
  npcStances: [],
  endWindow: "The hall waits beyond.",
  eventWeight: "normal" as const,
  canonFacts: [],
};

void test("buildRendererMessages builds old prose as assistant history", () => {
  const chronology: RenderChronologyView = {
    mode: "continuation",
    turns: [
      {
        kind: "narrative",
        status: "delivered",
        toolCallId: "call-1",
        playerInput: "First input.",
        packet,
        prose: "First prose.",
      },
    ],
    awaitingDelivery: {
      kind: "narrative",
      status: "awaiting-delivery",
      toolCallId: "call-2",
      playerInput: "Open it.",
      packet,
    },
  };

  const messages = buildRendererMessages(chronology, packet);
  assert.deepEqual(messages.map((message) => message.role), ["user", "assistant", "user"]);
  assert.equal(messages[1]?.text, "First prose.");
  assert.match(messages[2]?.text ?? "", /# Direction Packet/u);
});

void test("lintRenderedProse catches banned headings", () => {
  const report = lintRenderedProse("# Heading\nBody", [], packet);
  assert.ok(report.findings.some((finding) => finding.ruleId === "markdown-heading"));
});

void test("buildLintRetryMessages appends first draft and repair request", () => {
  const base = [{ role: "user" as const, text: "write" }];
  const retry = buildLintRetryMessages(base, "# Bad", [{ ruleId: "markdown-heading", match: "# Bad" }]);
  assert.equal(retry.at(-2)?.role, "assistant");
  assert.equal(retry.at(-1)?.role, "user");
});
```

- [ ] **Step 2: Implement renderer assembly**

```ts
import type { LintFinding } from "../audit/lint-rules.ts";
import type { RenderChronologyView } from "../session-chronology/session-chronology.ts";
import type { DirectionPacket } from "./packet-schema.ts";

export interface RendererMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ProseLintReport {
  findings: LintFinding[];
  leaks: LintFinding[];
}

export function buildRendererMessages(
  chronology: RenderChronologyView,
  packet: DirectionPacket,
): RendererMessage[] {
  const messages: RendererMessage[] = [];
  for (const turn of chronology.turns) {
    messages.push({ role: "user", text: turn.playerInput });
    messages.push({ role: "assistant", text: turn.prose });
  }

  const currentInput = chronology.awaitingDelivery?.playerInput ?? "(No player input captured.)";
  messages.push({
    role: "user",
    text: [
      "# Current Player Input",
      "",
      currentInput,
      "",
      "# Direction Packet",
      "",
      "```json",
      JSON.stringify(packet, null, 2),
      "```",
      "",
      chronology.mode === "opening"
        ? "Render the complete opening scene. Output only body prose."
        : "Continue directly from latest body prose. Output only body prose.",
    ].join("\n"),
  });
  return messages;
}

export function lintRenderedProse(
  prose: string,
  unrevealedSecrets: readonly string[],
  _packet?: DirectionPacket,
): ProseLintReport {
  const findings: LintFinding[] = [];
  if (/^\s*#/mu.test(prose)) {
    findings.push({ ruleId: "markdown-heading", match: "Markdown heading is not body prose" });
  }
  if (/^\s*[-*]\s+/mu.test(prose)) {
    findings.push({ ruleId: "bullet-list", match: "Bullet list is not narrative prose" });
  }
  const leaks = unrevealedSecrets
    .filter((secret) => secret.length > 0 && prose.includes(secret))
    .map((secret): LintFinding => ({ ruleId: "secret-leak", match: secret }));
  return { findings: [...findings, ...leaks], leaks };
}

export function buildLintRetryMessages(
  baseMessages: readonly RendererMessage[],
  firstProse: string,
  findings: readonly LintFinding[],
): RendererMessage[] {
  return [
    ...baseMessages,
    { role: "assistant", text: firstProse },
    {
      role: "user",
      text: [
        "Rewrite the full prose because it violated these output rules:",
        ...findings.map((finding) => `- [${finding.ruleId}] ${finding.match}`),
        "",
        "Preserve all packet facts exactly. Change only prose surface. Output only corrected body prose.",
      ].join("\n"),
    },
  ];
}

export function redactSecrets(prose: string, secrets: readonly string[]): string {
  let redacted = prose;
  for (const secret of secrets) {
    redacted = redacted.replaceAll(secret, "▮".repeat(Math.min(secret.length, 4)));
  }
  return redacted;
}
```

- [ ] **Step 3: Run renderer assembly tests**

```bash
node --test engine/render/render-turn.test.ts
```

Expected: all renderer assembly tests pass.

- [ ] **Step 4: Commit**

```bash
git add engine/render/render-turn.ts engine/render/render-turn.test.ts
git commit -m "feat: assemble renderer prompts and lint retries"
```

---

### Task 5: Add Prose Delivery Queue

**Files:**
- Create: `extensions/two-pass-render/prose-delivery.ts`
- Test: `extensions/two-pass-render/delivery.test.ts`

- [ ] **Step 1: Write delivery tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { createProseDelivery, createSettledProseDelivery } from "./prose-delivery.ts";

const packet = {
  needsRender: true as const,
  playerAction: "Open the door.",
  resolvedChanges: ["The hinge squeals."],
  npcStances: [],
  endWindow: "The hall waits beyond.",
  eventWeight: "normal" as const,
  canonFacts: [],
  suggestedActions: [{ submitText: "Step inside." }],
};

void test("createProseDelivery persists packet id and suggestions", () => {
  const delivery = createProseDelivery(packet, "call-1", { text: "Body prose.", lintRuleIds: [] });
  assert.equal(delivery.text, "Body prose.");
  assert.deepEqual(delivery.details, {
    kind: "rendered",
    toolCallId: "call-1",
    lintRuleIds: [],
    suggestedActions: [{ submitText: "Step inside." }],
  });
});

void test("createSettledProseDelivery drains once", () => {
  const queue = createSettledProseDelivery();
  const delivered: unknown[] = [];
  queue.queue(createProseDelivery({ needsRender: false, directReply: "Answer." }, "call-2"));
  queue.settle((item) => delivered.push(item));
  queue.settle((item) => delivered.push(item));
  assert.equal(delivered.length, 1);
});
```

- [ ] **Step 2: Implement delivery queue**

```ts
import type { DirectionPacket, SuggestedAction } from "../../engine/render/packet-schema.ts";

export interface RenderedProseDeliveryInput {
  text: string;
  lintRuleIds: readonly string[];
}

export type ProseDeliveryDetails =
  | { kind: "direct-reply"; toolCallId: string }
  | { kind: "render-fallback"; toolCallId: string }
  | {
      kind: "rendered";
      toolCallId: string;
      lintRuleIds: readonly string[];
      suggestedActions: readonly SuggestedAction[];
    };

export interface PendingProseDelivery {
  text: string;
  details: ProseDeliveryDetails;
}

export interface SettledProseDelivery {
  queue(delivery: PendingProseDelivery): void;
  settle(deliver: (delivery: PendingProseDelivery) => void): void;
}

export function createProseDelivery(
  packet: DirectionPacket,
  toolCallId: string,
  rendered?: RenderedProseDeliveryInput,
): PendingProseDelivery {
  if (!packet.needsRender) {
    return { text: packet.directReply, details: { kind: "direct-reply", toolCallId } };
  }
  if (rendered === undefined) {
    return {
      text: [
        "(Renderer unavailable; showing settlement summary.)",
        "",
        ...packet.resolvedChanges.map((change) => `- ${change}`),
        "",
        `> ${packet.endWindow}`,
      ].join("\n"),
      details: { kind: "render-fallback", toolCallId },
    };
  }
  return {
    text: rendered.text,
    details: {
      kind: "rendered",
      toolCallId,
      lintRuleIds: rendered.lintRuleIds,
      suggestedActions: packet.suggestedActions ?? [],
    },
  };
}

export function createSettledProseDelivery(): SettledProseDelivery {
  let pending: PendingProseDelivery[] = [];
  return {
    queue(delivery): void {
      pending.push(delivery);
    },
    settle(deliver): void {
      const deliveries = pending;
      pending = [];
      for (const delivery of deliveries) {
        deliver(delivery);
      }
    },
  };
}
```

- [ ] **Step 3: Run delivery tests**

```bash
node --test extensions/two-pass-render/delivery.test.ts
```

Expected: delivery queue tests pass.

- [ ] **Step 4: Commit**

```bash
git add extensions/two-pass-render/prose-delivery.ts extensions/two-pass-render/delivery.test.ts
git commit -m "feat: queue settled prose delivery"
```

---

### Task 6: Add the Two-Pass Render Extension

**Files:**
- Create: `extensions/two-pass-render/index.ts`
- Modify: project startup command or extension manifest
- Test: extend `extensions/two-pass-render/delivery.test.ts`

- [ ] **Step 1: Add lifecycle tests**

Add a test that verifies direct replies are queued on `agent_end` and delivered once on `agent_settled` with `{ triggerTurn: false }`.

```ts
void test("two-pass lifecycle delivers once after agent_settled", async () => {
  const sent: unknown[] = [];
  const api = createInMemoryLifecycleApi(sent);
  registerTwoPassRenderLifecycle(api);

  const ctx = createContextWithAcceptedPacket({ needsRender: false, directReply: "Answer." }, "call-1");
  await api.fireAgentEnd(ctx);
  await api.fireAgentEnd(ctx);
  assert.equal(sent.length, 0);

  api.fireAgentSettled(ctx);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], {
    message: {
      customType: PROSE_CUSTOM_TYPE,
      content: "Answer.",
      display: true,
      details: { kind: "direct-reply", toolCallId: "call-1" },
    },
    options: { triggerTurn: false },
  });
});
```

- [ ] **Step 2: Implement lifecycle orchestration**

```ts
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { buildRendererMessages, buildLintRetryMessages, lintRenderedProse, redactSecrets } from "../../engine/render/render-turn.ts";
import { projectSessionChronology, PROSE_CUSTOM_TYPE } from "../../engine/session-chronology/session-chronology.ts";
import { createProseDelivery, createSettledProseDelivery } from "./prose-delivery.ts";

const DEFAULT_RENDER_LINT_RETRIES = 3;
const MAX_RENDER_LINT_RETRIES = 6;

export default function twoPassRenderExtension(pi: ExtensionAPI): void {
  pi.registerMessageRenderer(PROSE_CUSTOM_TYPE, renderProseMessage);
  registerTwoPassRenderLifecycle({
    onAgentEnd: (handler) => pi.on("agent_end", handler),
    onAgentSettled: (handler) => pi.on("agent_settled", handler),
    sendMessage: (message, options) => pi.sendMessage(message, options),
  });
}

export function registerTwoPassRenderLifecycle(api: TwoPassRenderLifecycleApi): void {
  const renderedIds = new Set<string>();
  const delivery = createSettledProseDelivery();

  api.onAgentEnd(async (_event, ctx) => {
    const chronology = readRenderChronology(ctx);
    const pending = chronology?.awaitingDelivery;
    if (chronology === undefined || pending === undefined || renderedIds.has(pending.toolCallId)) {
      return;
    }
    renderedIds.add(pending.toolCallId);

    if (!pending.packet.needsRender) {
      delivery.queue(createProseDelivery(pending.packet, pending.toolCallId));
      return;
    }

    const rendered = await renderProse(ctx, chronology, pending.packet, collectUnrevealedSecrets(ctx));
    delivery.queue(createProseDelivery(pending.packet, pending.toolCallId, rendered));
  });

  api.onAgentSettled((_event, _ctx) => {
    delivery.settle((item) => {
      api.sendMessage(
        { customType: PROSE_CUSTOM_TYPE, content: item.text, display: true, details: item.details },
        { triggerTurn: false },
      );
    });
  });
}
```

- [ ] **Step 3: Implement `renderProse` using the destination model API**

Use the host project's model streaming API. Preserve this flow exactly:

```ts
async function renderProse(ctx, chronology, packet, unrevealedSecrets) {
  const baseMessages = buildRendererMessages(chronology, packet);
  let draft = await streamProse(ctx, buildRendererSystemPrompt(chronology.mode), baseMessages, "render");
  let report = lintRenderedProse(draft, unrevealedSecrets, packet);

  const maxRetries = resolveRenderLintRetries();
  for (let retryIndex = 1; report.findings.length > 0 && retryIndex <= maxRetries; retryIndex++) {
    draft = await streamProse(
      ctx,
      buildRendererSystemPrompt(chronology.mode),
      buildLintRetryMessages(baseMessages, draft, report.findings),
      `lint-retry-${retryIndex}`,
    );
    report = lintRenderedProse(draft, unrevealedSecrets, packet);
  }

  if (report.leaks.length > 0) {
    return { text: redactSecrets(draft, unrevealedSecrets), lintRuleIds: report.findings.map((finding) => finding.ruleId) };
  }
  return { text: draft, lintRuleIds: report.findings.map((finding) => finding.ruleId) };
}
```

- [ ] **Step 4: Load the extension in startup**

For CLI startup, add:

```bash
pi \
  -e ./extension.ts \
  -e ./extensions/two-pass-render/index.ts \
  --session-dir ./sessions
```

- [ ] **Step 5: Run lifecycle tests**

```bash
node --test extensions/two-pass-render/delivery.test.ts
```

Expected: lifecycle delivers exactly once and never triggers a new turn.

- [ ] **Step 6: Commit**

```bash
git add extensions/two-pass-render/index.ts extensions/two-pass-render/delivery.test.ts start.sh start.ps1
git commit -m "feat: render prose in second pass"
```

---

### Task 7: Keep Pass A Clean

**Files:**
- Create: `engine/render/settlement-prose-firewall.ts`
- Modify: main project extension context hook
- Test: `engine/render/settlement-prose-firewall.test.ts`

- [ ] **Step 1: Write firewall tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { stripLeakedSettlementProse } from "./settlement-prose-firewall.ts";

void test("stripLeakedSettlementProse removes text around packet tool calls", () => {
  const stripped = stripLeakedSettlementProse({
    role: "assistant",
    content: [
      { type: "text", text: "Accidental prose." },
      { type: "toolCall", id: "call-1", name: "submit_direction_packet", arguments: { needsRender: false, directReply: "x" } },
    ],
  });

  assert.deepEqual(stripped?.content, [
    { type: "toolCall", id: "call-1", name: "submit_direction_packet", arguments: { needsRender: false, directReply: "x" } },
  ]);
});
```

- [ ] **Step 2: Implement firewall**

```ts
import { SUBMIT_DIRECTION_PACKET_TOOL } from "../session-chronology/session-chronology.ts";

export function stripLeakedSettlementProse<TMessage>(message: TMessage): TMessage | undefined {
  if (!isRecord(message) || message.role !== "assistant" || !Array.isArray(message.content)) {
    return undefined;
  }
  const hasPacketCall = message.content.some(
    (part) => isRecord(part) && part.type === "toolCall" && part.name === SUBMIT_DIRECTION_PACKET_TOOL,
  );
  if (!hasPacketCall) {
    return undefined;
  }
  const content = message.content.filter((part) => isRecord(part) && part.type === "toolCall");
  return { ...message, content };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

- [ ] **Step 3: Apply the firewall in extension hooks**

In the main extension:

```ts
pi.on("message_end", async (event) => {
  const stripped = stripLeakedSettlementProse(event.message);
  return stripped === undefined ? undefined : { message: stripped };
});

pi.on("context", async (event, ctx) => {
  const messages = event.messages
    .filter((message) => !(isRecord(message) && message.customType === PROSE_CUSTOM_TYPE))
    .map((message) => stripLeakedSettlementProse(message) ?? message);
  return { messages: injectSettlementPrompts(messages, ctx) };
});
```

- [ ] **Step 4: Run firewall tests**

```bash
node --test engine/render/settlement-prose-firewall.test.ts
```

Expected: accidental Pass A prose is removed while tool calls remain.

- [ ] **Step 5: Commit**

```bash
git add engine/render/settlement-prose-firewall.ts engine/render/settlement-prose-firewall.test.ts extension.ts
git commit -m "fix: keep settlement pass prose-free"
```

---

### Task 8: Add Manual Reroll

**Files:**
- Create: `extensions/two-pass-render/reroll.ts`
- Test: `extensions/two-pass-render/reroll.test.ts`

- [ ] **Step 1: Write reroll safety tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { findRerollTarget } from "./reroll.ts";

void test("findRerollTarget finds the latest prose and packet", () => {
  const target = findRerollTarget([
    userEntry("u1", null, "Open it."),
    packetEntry("a1", "u1", "call-1"),
    resultEntry("r1", "a1", "call-1"),
    proseEntry("p1", "a1", "call-1"),
  ]);

  assert.equal(target.kind, "ready");
  if (target.kind === "ready") {
    assert.equal(target.proseEntry.id, "p1");
    assert.equal(target.pending.toolCallId, "call-1");
  }
});

void test("findRerollTarget rejects prose that is no longer a leaf", () => {
  const target = findRerollTarget([
    userEntry("u1", null, "Open it."),
    packetEntry("a1", "u1", "call-1"),
    resultEntry("r1", "a1", "call-1"),
    proseEntry("p1", "a1", "call-1"),
    userEntry("u2", "p1", "Continue."),
  ]);

  assert.equal(target.kind, "not-leaf");
});
```

- [ ] **Step 2: Implement reroll command**

The reroll command must:

- Require idle state.
- Find the latest prose custom message.
- Verify it is still the current leaf.
- Reconstruct the matching packet.
- Render again with the same packet plus a variant key.
- Navigate to the prose parent if the host session tree requires it.
- Send a new `PROSE_CUSTOM_TYPE` message with `kind: "rerolled"` and `triggerTurn: false`.
- Never mutate domain state.

```ts
export function registerRerollCommand(pi: Pick<ExtensionAPI, "registerCommand" | "sendMessage">, callbacks: RerollCallbacks): void {
  pi.registerCommand("reroll", {
    description: "Rerender the latest prose while preserving settled facts",
    handler: async (args, ctx) => {
      if (args.trim() !== "") {
        ctx.ui.notify("Usage: /reroll", "warning");
        return;
      }
      if (!ctx.isIdle()) {
        ctx.ui.notify("Wait for the current turn to finish before /reroll", "warning");
        return;
      }
      const target = findRerollTarget(ctx.sessionManager.getBranch());
      if (target.kind !== "ready") {
        ctx.ui.notify(rerollProblemMessage(target), "warning");
        return;
      }
      if (!target.pending.packet.needsRender) {
        ctx.ui.notify("The latest message is not renderable prose", "warning");
        return;
      }
      const prose = await callbacks.render(ctx, target.renderChronology, target.pending.packet, crypto.randomUUID());
      if (prose === undefined) {
        ctx.ui.notify("Reroll failed; original prose kept", "warning");
        return;
      }
      pi.sendMessage(
        {
          customType: PROSE_CUSTOM_TYPE,
          content: prose.text,
          display: true,
          details: {
            kind: "rerolled",
            replacedEntryId: target.proseEntry.id,
            toolCallId: target.pending.toolCallId,
            lintRuleIds: prose.lintRuleIds,
            suggestedActions: target.pending.packet.suggestedActions,
          },
        },
        { triggerTurn: false },
      );
    },
  });
}
```

- [ ] **Step 3: Run reroll tests**

```bash
node --test extensions/two-pass-render/reroll.test.ts
```

Expected: reroll target detection is safe and rejects stale branches.

- [ ] **Step 4: Commit**

```bash
git add extensions/two-pass-render/reroll.ts extensions/two-pass-render/reroll.test.ts extensions/two-pass-render/index.ts
git commit -m "feat: reroll prose without changing facts"
```

---

## 5. Prompt Modules

### Settlement Direction Contract

Create `prompts/settlement/direction-contract.md`:

```md
# Direction Packet Contract

## Turn-ending flow

1. Finish domain settlement and state updates first.
2. Finish the turn with one accepted `submit_direction_packet`.
3. Do not output narration outside tool calls.

## Field rules

- `needsRender=true`: narrative turn. Renderer produces final prose.
- `needsRender=false`: meta or rules turn. `directReply` is delivered as-is.
- `playerAction`: settled player intent as actively performed this turn.
- `resolvedChanges`: every visible settled fact the player must see.
- `npcStances`: one active move for each important present NPC.
- `npcOmissions`: explicit silence or non-action for important present NPCs.
- `endWindow`: one concrete pressure or opening where the scene stops.
- `suggestedActions`: UI-only candidate inputs; never mention them in prose.

## Hard boundary

The packet is not prose. Write facts, not literary paragraphs. Missing facts disappear from the player's scene.
```

### Render Output Contract

Create `prompts/render/output-contract.md`:

```md
# Final Output Contract

- Output only narrative body prose and necessary dialogue.
- Do not mention tools, packets, schemas, internal checks, or prompt labels.
- Start in-scene: action, sensory change, environmental change, or dialogue.
- Render the player action before consequences.
- Every binding resolved change must appear on page as visible process or consequence.
- Do not use bullet lists, headings, dividers, or explanatory wrappers.
- End on one concrete pressure, changed formation, exposed clue, wound, route, cost, or decision window.
- Do not write menu endings. Candidate actions belong in `suggestedActions`, not prose.
```

### Render Protocol

Create `prompts/render/protocol.md`:

```md
# Narrative Render Protocol

- Continue directly from prior prose for continuation turns.
- Do not recap established location or unchanged characters.
- Use environment only where it resists, enables, changes, or is touched.
- Interleave NPC moves through shared space instead of listing them.
- Keep private motives private; show public line plus physical tell.
- Render `npcOmissions` as deliberate stillness or absence only.
- Preserve packet outcomes exactly. Change style, not facts.
```

---

## 6. Verification Checklist

Run these commands before claiming the implementation is complete:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Manual verification in a live session:

- [ ] User sends a narrative action.
- [ ] Pass A calls exactly one `submit_direction_packet`.
- [ ] Pass A visible assistant text is empty or tool-only.
- [ ] Pass B renders prose after `agent_end`.
- [ ] Prose appears as a custom message with `customType=project-prose`.
- [ ] The custom message has `details.toolCallId` matching the packet call.
- [ ] `triggerTurn` is false, and no extra agent turn starts.
- [ ] A direct reply packet produces the `directReply` text without render prompt use.
- [ ] A lint violation triggers retry before delivery.
- [ ] A persistent secret leak is redacted before delivery.
- [ ] `/reroll` replaces only the latest prose surface and does not mutate state.

---

## 7. Common Failure Modes

| Failure | Cause | Fix |
| --- | --- | --- |
| Pass A writes prose and Pass B writes prose again | Settlement prompt lacks hard boundary or `message_end` firewall | Add direction contract and strip assistant text around packet tool calls |
| Delivery starts a new turn | `sendMessage` defaults to turn-triggering behavior | Always pass `{ triggerTurn: false }` for prose custom messages |
| Renderer treats direct rules answers as story history | Chronology includes direct turns as narrative turns | Keep direct replies out of `RenderChronologyView.turns` |
| Reroll changes state | Reroll calls settlement tools or starts a normal turn | Reroll must call only render and custom-message delivery |
| Secret appears in prose | Packet contains hidden facts or renderer invents them | Firewall packet fields before render, lint final prose, redact persistent leaks |
| Continuation resets the scene | Renderer has no old prose history | Feed recent delivered prose as assistant messages and older turns as digest |
| Agent loops after `agent_end` | Custom message delivered while agent is still streaming | Queue on `agent_end`, deliver on `agent_settled` |
| Multiple packets compete in one turn | Pass A retries without invalidating earlier accepted packet | Chronology should block multiple accepted packets per user boundary |

---

## 8. Porting Notes

- Rename `project-prose` to a project-specific custom type such as `mygame-prose`.
- Keep `toolCallId` as the stable foreign key between packet and prose delivery.
- Keep the renderer free of state-writing tools.
- Keep canonical facts in state or packet; never infer them from prose alone.
- If the host project has compaction, summarize packet facts deterministically and let the renderer manage its own prose history window.
- If the host model supports prompt caching, keep old prose message prefixes byte-stable by using append-only message assembly and hysteresis windows.
- If the host model exposes thinking tokens, strip thinking residue after streaming and before linting.

---

## 9. Definition of Done

The implementation is complete when:

- Pass A cannot successfully finish a narrative turn without a valid packet.
- Pass B can render, lint, retry, redact, and deliver prose without triggering another turn.
- Session chronology can reconstruct delivered and awaiting turns after restart.
- Direct replies bypass prose rendering.
- Reroll changes only visible prose and preserves settled facts.
- Tests cover schema, chronology, delivery, lifecycle, lint retry, and reroll safety.
- A live smoke test confirms one user action produces exactly one final custom prose message.

---

## 10. fate-sandbox Implementation Structure Notes For Agents

This section describes the concrete `fate-sandbox` implementation. Treat it as the source implementation map when porting the pattern into another pi project. It is written for agents that need to navigate and modify the code, not for player-facing explanation.

### Extension Loadout

Runtime startup explicitly loads multiple extensions. The two-pass render system is not implicitly imported by `extension.ts`.

```bash
pi \
  --no-skills \
  --skill ./skills/ \
  -e ./extension.ts \
  -e ./extensions/compaction-policy/index.ts \
  -e ./extensions/player-panel/index.ts \
  -e ./extensions/player-choices/index.ts \
  -e ./extensions/rewind/index.ts \
  -e ./extensions/two-pass-render/index.ts \
  --session-dir ./sessions \
  --no-context-files
```

Required startup files:

- `start.sh`: Unix launcher; includes the extension loadout above and optional `FATE_RENDER_MODEL` override notice.
- `start.ps1`: Windows launcher; mirrors the same extension loadout.
- `extension.ts`: Pass A settlement extension.
- `extensions/two-pass-render/index.ts`: Pass B prose-render extension.

Porting rule: if prose does not appear, check the launch command first. The Pass B extension must be loaded as its own `-e` entry.

### Pass A Main Extension

`extension.ts` owns settlement only. It does not import or call the Pass B renderer.

Responsibilities:

- `resources_discover`: exposes project skills from `skills/`.
- `before_agent_start`: replaces the system prompt with `buildSettlementSystemPrompt(...)`.
- `context`: builds the settlement working set, filters rendered prose custom messages, injects settlement prompt modules, and injects the last rendered prose only as continuity context.
- `session_start`, `session_tree`, `tool_call`: sync canonical state from the session manager.
- final setup: `registerAllTools(pi)` registers domain tools, including `submit_direction_packet`.

Key implementation paths:

- `extension.ts`
- `engine/prompt-assembly/injection.ts`
- `engine/prompt-assembly/settlement-working-set.ts`
- `engine/render/settlement-prose-firewall.ts`
- `tools/registry.ts`

Hard boundary:

- Pass A must not emit final narrative prose.
- Pass A may receive previous prose only through `prose_continuity`, not as normal conversational history.
- Pass A is allowed to update state and call domain tools.
- Pass A must finish narrative turns through `submit_direction_packet`.

### Pass A Context Projection

The settlement context is intentionally not the raw session branch.

Current flow:

1. `projectSettlementWorkingSet(event.messages, toolResultRetention)` removes stale scratch state and compresses completed tool-call history.
2. `projectSessionChronology(..., { kind: "settlement" })` reconstructs delivered turns and finds `latestNarrativeProse`.
3. Messages with `customType === PROSE_CUSTOM_TYPE` are filtered out before settlement prompt injection.
4. `stripLeakedSettlementProse(...)` removes accidental assistant text around packet tool calls.
5. `injectGmPromptMessages(...)` injects settlement modules and `prose_continuity` before the real last user message.

Implementation references:

```ts
const workingSet = projectSettlementWorkingSet(event.messages, toolResultRetention);
const chronology = projectSessionChronology(
  { kind: "session-branch", entries: ctx.sessionManager.getBranch() },
  { kind: "settlement" },
);
const lastRenderedProse = chronology.value.latestNarrativeProse;
const settlementMessages = workingSet
  .filter((message) => !(isRecord(message) && message["customType"] === PROSE_CUSTOM_TYPE))
  .map((message) => stripLeakedSettlementProse(message) ?? message);
const injected = injectGmPromptMessages(settlementMessages, { hasInitializedState, lastRenderedProse });
```

Porting rule: never pass `fsn-prose` / project prose custom messages directly into Pass A as normal history. If Pass A needs physical continuity, inject exactly the latest prose as read-only continuity context.

### Settlement Prompt Assembly

Settlement prompt modules are preset-driven.

Files:

- `prompts/preset-settlement.json`
- `prompts/settlement/system.md`
- `prompts/settlement/principles.md`
- `prompts/settlement/world-context.md`
- `prompts/settlement/input-guide.md`
- `prompts/settlement/tool-policy.md`
- `prompts/settlement/hard-rules.md`
- `prompts/settlement/story-driver.md`
- `prompts/settlement/direction-contract.md`

Runtime sources injected into settlement:

- `runtime:state-brief` -> mechanical public state brief.
- `runtime:backstage-ledger` -> GM-only backstage ledger.
- `runtime:presence-impressions` -> current NPC impression cards.

Porting rule: keep render style instructions out of settlement modules. Settlement should produce facts, tool calls, and packet handoff only.

### Direction Packet Handoff Tool

`tools/settlement/submit-direction-packet.ts` is the canonical Pass A -> Pass B handoff.

Behavior:

- Parses params with `parseDirectionPacket(...)`.
- If `needsRender=true`, validates packet against current state with `validateRenderDirectionPacket(...)`.
- Runs `scanDirectionPacket(...)` against unrevealed secret strings.
- Throws if packet leaks hidden facts into renderer-visible fields.
- Returns a text tool result with `{ packet }` metadata and `terminate: true`.
- Does not mutate canonical state.

Relevant constants and schemas:

- `SUBMIT_DIRECTION_PACKET_TOOL` in `engine/session-chronology/session-chronology.ts`.
- `DirectionPacket`, `RenderDirectionPacket`, `DirectReplyPacket` in `engine/render/packet-schema.ts`.
- packet validation in `engine/render/packet-validation.ts`.
- secret packet firewall in `engine/render/packet-firewall.ts`.

Porting rule: the handoff tool must terminate the settlement loop. If it does not terminate, the model can continue writing text or call unrelated tools after the handoff.

### Pass B Render Extension

`extensions/two-pass-render/index.ts` owns all player-visible prose delivery.

Registration:

```ts
pi.registerMessageRenderer(PROSE_CUSTOM_TYPE, renderProseMessage);
registerRerollCommand(pi, callbacks);
pi.on("message_end", strip leaked settlement prose);
registerTwoPassRenderLifecycle({
  onAgentEnd: (handler) => pi.on("agent_end", handler),
  onAgentSettled: (handler) => pi.on("agent_settled", handler),
  sendMessage: (message, options) => pi.sendMessage(message, options),
});
```

Pass B lifecycle:

1. `agent_end`: read current session branch.
2. `readRenderChronology(...)`: project branch through `projectSessionChronology(..., { kind: "render" })`.
3. If latest turn has `awaitingDelivery`, process it once by `toolCallId`.
4. For `needsRender=false`, queue a direct reply delivery.
5. For `needsRender=true`, render prose via `renderProse(...)` and queue the result.
6. `agent_settled`: drain queued deliveries and send `PROSE_CUSTOM_TYPE` custom messages with `{ triggerTurn: false }`.

Hard boundary:

- `agent_end` may render and queue, but must not deliver directly.
- `agent_settled` may deliver, but must not render.
- Delivered prose must use `triggerTurn: false`.
- `renderedToolCallIds` prevents duplicate render for the same packet call.

### Session Chronology Model

`engine/session-chronology/session-chronology.ts` is the cross-pass ledger. It is the stable contract between settlement, render, reroll, audit, and compaction.

Core constants:

```ts
export const PROSE_CUSTOM_TYPE = "fsn-prose";
export const SUBMIT_DIRECTION_PACKET_TOOL = "submit_direction_packet";
```

Important projections:

- `{ kind: "render" }` -> `RenderChronologyView`
- `{ kind: "settlement" }` -> `SettlementChronologyView`
- `{ kind: "reroll" }` -> `RerollChronologyView`

Turn states:

- delivered narrative: accepted render packet + associated `fsn-prose` delivery.
- awaiting narrative: accepted render packet without associated prose delivery.
- delivered direct: accepted direct packet + associated direct reply delivery.
- awaiting direct: accepted direct packet without associated direct reply delivery.

Association key:

- `submit_direction_packet` tool call id -> `fsn-prose.details.too
lCallId`.

Blocking anomalies include:

- duplicate packet tool call id.
- multiple accepted packets in one turn.
- invalid packet.
- orphan prose delivery.
- delivery before packet result.
- delivery crossing the next player boundary.
- delivery kind mismatch.
- superseded awaiting delivery.

Porting rule: keep `toolCallId` as the only foreign key. Do not associate prose by order, text similarity, or timestamps.

### Renderer Prompt Assembly

`engine/render/render-turn.ts` builds the Pass B message list.

Message shape:

```text
[user early digest?]
[user previous player input]
[assistant previous prose]
[user previous player input]
[assistant previous prose]
[user current player input + render names + NPC render cards + direction packet + length floor]
```

Important behavior:

- Delivered direct replies are excluded from render prose history.
- Recent delivered prose is fed as assistant messages so the renderer treats it as prior body prose.
- Older delivered prose can be demoted to digest lines.
- Full prose window uses hysteresis to keep prompt-cache prefixes stable.
- Current packet is included as JSON in the final user message.
- Actor render names are injected to prevent retranslation and accidental hidden-name use.
- NPC render cards are player-safe style and behavior hints, not new facts.
- Suggested actions are UI-only and explicitly banned from prose.

Porting rule: Pass B input must be packet-bound and history-aware. Do not ask the renderer to infer current facts from raw Pass A scratch messages.

### Renderer System Prompt

`buildRendererSystemPrompt(mode)` in `engine/prompt-assembly/injection.ts` constructs the clean-room renderer system prompt.

Files:

- `prompts/preset-render.json`
- `prompts/render/system.md`
- `prompts/render/opening-protocol.md`
- `prompts/render/style-rules.md`
- `prompts/render/style-blacklist.md`
- `prompts/render/protocol.md`
- `prompts/render/output-contract.md`

Behavior:

- Includes render-only modules and `both` modules if configured.
- Includes `opening-protocol.md` only when `RenderChronologyView.mode === "opening"`.
- Includes no tool schemas.
- Includes no settlement mechanical policy.
- Includes no backstage secret ledger.

Porting rule: renderer prompt should know how to write prose, not how to settle the world.

### Render Execution and Retry

`renderProse(...)` in `extensions/two-pass-render/index.ts` is the render execution loop.

Flow:

1. Resolve renderer model. `FATE_RENDER_MODEL=provider/model-id` can override the settlement model.
2. Fetch model auth through `ctx.modelRegistry.getApiKeyAndHeaders(model)`.
3. Build system prompt and renderer messages.
4. Call `streamProse(...)` for the first draft.
5. Run `lintRenderedProse(draft, unrevealedSecrets, packet)`.
6. If clean, return final text.
7. If findings exist, retry up to `resolveRenderLintRetries(ctx)`.
8. Retry prompt is `baseMessages + assistant(firstDraft) + user(violation list + rewrite instruction)`.
9. If secret leaks persist, redact secret strings before delivery.
10. If style findings persist without leaks, deliver with `lintRuleIds` metadata.

Render call parameters:

- `maxTokens`: `RENDERER_MAX_TOKENS`.
- `temperature`: `FATE_RENDER_TEMPERATURE` or default.
- `sessionId`: separate renderer cache partition.
- `cacheRetention`: configurable.

Porting rule: retries must preserve packet facts. Retry prompts can change prose surface only.

### Streaming and Preview Widgets

`streamProse(...)` wraps the model stream.

Behavior:

- Converts internal `RendererMessage` objects to pi-ai stream messages.
- Adds assistant prefill unless the active model/provider rejects assistant prefill.
- Streams `text_delta` into a temporary render preview widget.
- Captures `done` usage into a Pass B usage widget.
- Clears the preview widget on failure or after delivery.
- Strips thinking residue before linting and delivery.
- Throws if the final text is empty.

Important helpers:

- `supportsAssistantPrefill(...)`
- `stripThinkingResidue(...)`
- `updateRenderWidget(...)`
- `clearRenderWidget(...)`
- `captureUsage(...)`

Porting rule: preview widgets are optional; thinking stripping and empty-output failure are not optional for model robustness.

### Prose Delivery Queue

`extensions/two-pass-render/prose-delivery.ts` isolates delivery state.

Types:

- `PendingProseDelivery`
- `SettledProseDelivery`
- `RenderedProseDeliveryInput`

Delivery kinds:

- `direct-reply`: `needsRender=false` direct response.
- `render-fallback`: renderer unavailable; display packet summary.
- `rendered`: normal Pass B prose.

Queue behavior:

- `queue(...)` appends pending delivery.
- `settle(...)` drains all current deliveries exactly once.

Porting rule: use a queue even if only one delivery is expected. It protects queued continuations and avoids `agent_end` delivery races.

### Prose Persistence and Display

Prose delivery uses custom messages, not assistant messages.

```ts
pi.sendMessage(
  { customType: PROSE_CUSTOM_TYPE, content: text, display: true, details },
  { triggerTurn: false },
);
```

Renderer registration:

```ts
pi.registerMessageRenderer(PROSE_CUSTOM_TYPE, renderProseMessage);
```

Display renderer:

- Joins text parts when needed.
- Renders via `Markdown(text, 1, 0, getMarkdownTheme())`.

Porting rule: keep prose as a first-class custom message type. Do not write it back as ordinary assistant text.

### Choice Widget Integration

`extensions/two-pass-render/index.ts` imports `setChoiceWidget` from `extensions/player-choices/index.ts`.

Behavior:

- For rendered deliveries, suggested actions are read from `delivery.details.suggestedActions`.
- For direct replies and fallbacks, choices are cleared or empty.
- Reroll persists suggested actions again so `/choice` still works after replacing prose.

Porting rule: if the target project has choice UI, store suggestions in prose delivery details, not only in ephemeral widgets.

### Reroll Structure

`extensions/two-pass-render/reroll.ts` implements `/reroll`.

Flow:

1. Reject non-empty args.
2. Reject if runtime is not idle.
3. `findRerollTarget(ctx.sessionManager.getBranch())` locates the latest leaf prose and associated packet.
4. Reject if no prose, not leaf, root prose, invalid chronology, or direct reply.
5. Render again with same `RenderChronologyView`, same packet, and a random variant key.
6. Recheck `isRerollTargetStillCurrent(...)` after rendering.
7. Navigate to the prose parent if needed.
8. Prune old prose branch if safe via `pruneRerolledProse(...)`.
9. Send new `fsn-prose` custom message with `kind: "rerolled"` and `triggerTurn: false`.
10. Re-save choices and digest.

Hard boundary:

- Reroll must not call settlement tools.
- Reroll must not mutate state.
- Reroll must not work on non-leaf prose.
- Reroll must preserve `toolCallId` and packet facts.

### Rewind Interaction

`extensions/rewind/prune.ts` supports safe branch deletion for reroll.

Important behavior:

- `pruneRerolledProse(...)` physically deletes only pure prose subtrees.
- If the abandoned subtree contains non-prose history, pruning returns false and leaves old branch intact.

Porting rule: reroll replacement should be safe under branching session trees. Never delete a subtree unless it contains only replaceable prose.

### Compaction Interaction

`extensions/compaction-policy/index.ts` owns deterministic settlement-side compaction.

Design:

- Canonical state is injected every turn from state store.
- Render-side prose history is managed by `two-pass-render` through full/digest windows.
- Compaction summary is mechanically extracted from `submit_direction_packet` arguments.
- No LLM is used for compaction summary.

Key function:

- `buildSettlementCompactionSummary(chronology.value.turns, previousSummary)`.

Porting rule: compaction should not summarize hidden scratch prose. Use packet facts as the deterministic event ledger.

### Audit Interaction

Audit and lint modules assume final delivered prose is `fsn-prose`.

Relevant files:

- `engine/audit/session-audit.ts`
- `engine/audit/lint-rules.ts`
- `engine/audit/lint-blacklist-sync.test.ts`

Behavior:

- Two-pass turns use `fsn-prose` custom messages as final prose.
- Single-pass legacy sessions can fall back to last assistant text.
- Prose length checks use packet context.
- Secret leak checks scan final prose.

Porting rule: update audit code to treat the target prose custom type as the final visible text.

### Agent-Oriented Dependency Graph

```text
start.sh / start.ps1
  ├─ extension.ts                         # Pass A settlement
  │   ├─ buildSettlementSystemPrompt
  │   ├─ projectSettlementWorkingSet
  │   ├─ projectSessionChronology(kind=settlement)
  │   ├─ stripLeakedSettlementProse
  │   ├─ injectGmPromptMessages
  │   └─ registerAllTools
  │       └─ submit_direction_packet
  │           ├─ parseDirectionPacket
  │           ├─ validateRenderDirectionPacket
  │           └─ scanDirectionPacket
  │
  └─ extensions/two-pass-render/index.ts   # Pass B render
      ├─ registerMessageRenderer(fsn-prose)
      ├─ registerRerollCommand
      ├─ on message_end -> strip leaked Pass A prose
      ├─ on agent_end
      │   ├─ projectSessionChronology(kind=render)
      │   ├─ buildRendererSystemPrompt
      │   ├─ buildRendererMessages
      │   ├─ streamProse
      │   ├─ lintRenderedProse
      │   ├─ buildLintRetryMessages
      │   └─ createProseDelivery
      └─ on agent_settled
          └─ sendMessage(customType=fsn-prose, triggerTurn=false)
```

### Migration Order For Agents

When copying this architecture to another project, implement in this order:

1. Define `DirectionPacket` and parser.
2. Add terminating `submit_direction_packet` tool.
3. Add `PROSE_CUSTOM_TYPE` and `SUBMIT_DIRECTION_PACKET_TOOL` constants.
4. Implement session chronology projection.
5. Add minimal Pass A context filtering so prose custom messages do not enter settlement history.
6. Add `buildRendererMessages(...)` and minimal renderer prompt files.
7. Add `prose-delivery.ts` queue.
8. Add `two-pass-render/index.ts` lifecycle with direct replies first.
9. Add streaming render for `needsRender=true`.
10. Add lint retry and secret redaction.
11. Add `/reroll` only after normal delivery is stable.
12. Add compaction/audit integration after session chronology is stable.

Do not implement reroll, digest writer, choice widgets, preview widgets, or compaction before direct reply and normal render delivery are passing tests.

### Minimal Smoke Test Scenario

Use this exact runtime pattern to verify a port:

1. User sends: `Open the door carefully.`
2. Pass A calls `submit_direction_packet` with `needsRender=true`.
3. Tool result is successful and terminating.
4. `agent_end` fires.
5. Pass B sees `awaitingDelivery.toolCallId === packetToolCallId`.
6. Pass B renders or falls back.
7. `agent_settled` fires.
8. Runtime appends one custom message:

```json
{
  "customType": "project-prose",
  "content": "...final prose...",
  "display": true,
  "details": {
    "kind": "rendered",
    "toolCallId": "same packet tool call id",
    "lintRuleIds": []
  }
}
```

9. No new agent turn starts.
10. Next user turn sees previous prose only as controlled continuity/history, not as raw settlement assistant text.

### Non-Negotiable Invariants

- One narrative user turn has one accepted packet.
- One accepted render packet has one delivered prose custom message.
- `toolCallId` links packet and prose.
- Pass A can mutate state; Pass B cannot mutate state.
- Pass A cannot write final prose.
- Pass B cannot invent facts outside the packet.
- Prose delivery must use `{ triggerTurn: false }`.
- Secret-bearing internal names must not enter renderer-visible packet fields.
- Reroll preserves packet facts and state.
- Chronology anomalies block unsafe projections instead of guessing.
