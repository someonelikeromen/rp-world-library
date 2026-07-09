---
name: pi-multiagent-rpc-timeout
description: Use when agent_team child agents fail with `RPC command prompt timed out waiting for response`, especially read-only/audit agents that fail before producing a first response.
---

# pi-multiagent RPC Timeout

## Trigger

Use this skill when `agent_team` runs fail with messages like:

```text
RPC command prompt timed out waiting for response.
```

Common symptoms:

- Child agent launches but fails before first useful output.
- Read-only/audit agents fail quickly, while extraction or write-capable agents may still work.
- `timeoutSecondsPerStep` and `maxRunSeconds` are already large, but the failure still happens within seconds.

## Diagnosis

This error is usually **not** controlled by graph-level `timeoutSecondsPerStep`.

In `pi-multiagent`, the prompt command ACK timeout is controlled by a hardcoded constant:

```text
C:/Users/22134/.pi/agent/npm/node_modules/pi-multiagent/extensions/multiagent/src/rpc-child-controller.ts
```

Relevant source:

```ts
const ACK_TIMEOUT_MS = 60_000;
```

This value controls how long the parent waits for the child Pi process to acknowledge the initial `prompt` RPC command. If the child/model does not respond within this window, the step fails with:

```text
RPC command prompt timed out waiting for response.
```

## Local Patch Applied

For this project environment, the local package was patched from:

```ts
const ACK_TIMEOUT_MS = 10_000;
```

to:

```ts
const ACK_TIMEOUT_MS = 60_000;
```

This gives child agents up to 60 seconds to acknowledge the first prompt.

## Important Notes

- Reload/restart Pi after changing this source file so the extension reloads the patched TypeScript.
- `graph.limits.timeoutSecondsPerStep` still controls total step runtime, not this first RPC ACK timeout.
- `options.maxRunSeconds` controls total run lifetime, not this first RPC ACK timeout.
- `run_status.waitSeconds` only controls how long the parent waits for status events.
- If the timeout persists after this patch, suspect provider/model latency, model `thinking` level, or child process startup problems.

## Practical Mitigations

When launching fragile audit/read-only agents:

- Prefer faster models or lower thinking levels for quick verification tasks.
- Keep the delegated prompt small and explicit.
- Ask the child to return a concise final directly instead of doing broad open-ended exploration.
- For quick probes, consider using direct parent tools instead of delegating.

