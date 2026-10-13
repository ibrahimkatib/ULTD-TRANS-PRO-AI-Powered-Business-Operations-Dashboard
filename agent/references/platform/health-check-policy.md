# Platform Health Check Policy

Health checks are read-only. Access only the current organization/workspace and approved health tools. Never expose credentials or connection strings. Classify checks as healthy, degraded, unavailable, failed or unknown. Unchecked components must never be called healthy. Safe read-only retries are limited to two attempts.
