# AI Copilot Architecture

## Current stage

The Copilot is data-grounded but provider-neutral.

Flow:

User question -> `/api/copilot` -> Business Intelligence layer -> PostgreSQL -> structured answer.

This stage proves the business-data and tool boundary before connecting an external LLM.

## Next stage

The LLM will sit above the same tools and context layer:

User -> LLM Agent -> approved tool calls -> Business Intelligence / APIs -> verification -> response.

The LLM should not receive unrestricted database access. It should receive narrowly scoped tools and structured business context.

## Planned tools

- business.get_snapshot
- business.get_pipeline
- finance.get_overdue_invoices
- customers.find
- activities.get_priority
- campaigns.get_performance
- reports.generate
- email.draft
- email.send (approval capable)

## Approval boundary

Read-only analysis can be automatic.
External side effects such as sending campaigns, changing records, or financial actions can require human approval.
