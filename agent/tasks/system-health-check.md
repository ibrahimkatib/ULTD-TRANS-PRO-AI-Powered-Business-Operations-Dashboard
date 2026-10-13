# System Health Check

```yaml
id: system-health-check
name: System Health Check
version: "1.0"
status: active
approval:
  required: false
tools:
  - database.health
  - storage.health
skills:
  - system-diagnostics
references:
  - platform/health-check-policy.md
policies:
  - security
  - privacy
```

Objective: determine whether authorized workspace services are functioning normally.
