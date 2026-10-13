# ULTD TRANS PRO

AI-native Business Operations Platform.

## What this project demonstrates

A configurable operating layer that connects business data, customer operations, finance, reporting, people operations, AI agents and automation.

## Current mode

The platform is database-backed and ships with realistic demo data. The AI Copilot and provider integrations are intentionally in simulation/readiness mode until an AI provider is connected.

## Main modules

- Command Center
- Customers & Companies
- Deals & Pipeline
- Activities
- Invoices & Revenue
- Campaigns
- Insights & Reports
- People & HR
- AI Copilot
- Agents, Tasks, Workflows
- Executions, Approvals, Audit
- Integrations

## Local setup

```powershell
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

## Environment

Copy `.env.example` to `.env` and set DATABASE_URL and DIRECT_URL. AI and email providers can be connected later through environment variables.

## Setup order

1. Create `.env` from `.env.example`.
2. Run `npm.cmd install` (this runs `prisma generate` automatically).
3. Run `npm.cmd run db:migrate`.
4. Run `npm.cmd run db:seed`.
5. Run `npm.cmd run dev`.

Prisma Client is generated into `generated/prisma` and is intentionally ignored by Git.


## v0.6 — Real Agent Runtime

v0.6 introduces a real AI provider loop, an explicit Tool Registry, workspace-scoped `customer_search`, execution/audit tracing, and a human-approval boundary for outbound email requests.

See `docs/AGENT-RUNTIME-V0.6.md`.


## AI providers

The agent runtime supports OpenAI and Gemini. Gemini uses Google's OpenAI-compatible Chat Completions endpoint, so the same OpenAI SDK can remain installed. Set `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `AI_MODEL=gemini-2.5-flash` for the free-tier test setup.
