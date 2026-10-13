# Agent Runtime v0.6

v0.6 replaces the classification-only agent endpoint with a real provider/tool loop.

## Runtime

`POST /api/agent/run` creates an `Execution`, resolves the first workspace, invokes the configured provider, handles function calls through the Tool Registry, and records audit events.

## Tool boundary

The model never receives a raw database connection. It receives explicit function schemas from `tools/registry.ts`. Each registered tool has:

- name
- description
- JSON schema
- risk level
- approval flag
- server-side implementation

## v0.6 tools

### `customer_search`
Read-only, workspace-scoped contact search.

### `request_send_email_approval`
Side-effect request boundary. It creates a pending `Approval` record and stops the execution before any email provider is called.

## Provider

OpenAI's Responses API is used through `providers/ai/openai.ts`. The server executes function calls and sends `function_call_output` results back to the model.

## Safety sequence

`User Request → Agent → Tool Registry → Policy/Approval Gate → Tool Execution → Audit → Response`

## Environment

Set:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=...
AI_MODEL=gpt-5.5
AGENT_MODE=live
```

The app remains in simulation mode when `AGENT_MODE` is not `live` or no API key is present.
