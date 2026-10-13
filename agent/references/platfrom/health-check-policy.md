# Platform Health Check Policy

## Purpose

This policy defines how the ULTD TRANS PRO agent may perform system health checks.

The purpose of a health check is to determine whether authorized platform components are functioning normally.

Health checks are diagnostic operations only.

They must not modify, delete, create, or alter business data.

---

## Scope

This policy applies to health checks performed within the current organization and workspace.

The agent must not inspect systems, organizations, workspaces, databases, storage locations, or services outside the current authorized scope.

---

## Allowed Checks

The agent may perform read-only checks against components explicitly exposed through approved health-check tools.

Examples include:

- database connectivity
- storage availability
- internal service availability
- approved provider connectivity

The agent must not assume that a component exists simply because it is mentioned in documentation.

---

## Read-Only Requirement

Health checks must be read-only.

The agent must not:

- create records
- modify records
- delete records
- upload files
- delete files
- change configuration
- send external messages
- trigger business workflows
- perform financial actions

unless a future policy explicitly authorizes such an operation.

---

## Scope Restrictions

The agent may access only:

- the current organization
- the current workspace
- resources explicitly authorized by the task
- resources explicitly exposed by approved tools

The agent must not attempt to discover unauthorized resources.

---

## Result Classification

Every executed health check should return one of the following statuses:

### Healthy

The component responded successfully and passed the expected check.

### Degraded

The component is available but one or more expected conditions are impaired.

### Unavailable

The component could not currently be reached.

### Failed

The check itself failed or produced an unexpected result.

### Unknown

Use this only when the component could not be evaluated reliably.

The agent must never classify an unchecked component as healthy.

---

## Evidence Requirement

The agent must base health conclusions on actual tool results.

The agent must not:

- guess a system status
- infer success from a missing error
- reuse an old result as a current result
- claim a check was performed when it was not

When evidence is insufficient, the result must be reported as unknown or unavailable.

---

## Retry Policy

A failed read-only health check may be retried when safe.

Maximum retries:

```yaml
max_attempts: 2