# bun-guard / api 🧠

**The Orchestrator & Control Plane.**

This service acts as the "Brain" of the operation. It is a lightweight HTTP server built with **Hono** that handles coordination between GitHub, our Database, and the ephemeral Sandboxes.

## Architecture

- **Runtime:** Bun (running inside a Google Cloud Run Service).
- **Framework:** [Hono](https://hono.dev) (Standard Web API).
- **Database:** Turso (LibSQL) via Drizzle ORM (HTTP driver).
- **Infrastructure:** Google Cloud Run (Service).

## Responsibilities

1.  **Webhook Ingestion:**
    - Listens for `pull_request` events from GitHub.
    - Filters for dependency updates (e.g., Renovate/Dependabot PRs).
    - Validates payloads and verifies signatures.

2.  **Mission Control:**
    - **Deduplication:** Uses the database to handle "Thundering Herd" scenarios (e.g., 100 repos updating `react` simultaneously). It ensures only _one_ Global Security Scan runs per package version.
    - **Queue Management:** Tracks the state of every scan (`pending` -> `processing` -> `completed`).

3.  **Sandbox Orchestration:**
    - Uses the Google Cloud SDK to trigger **Cloud Run Jobs** (The "Sandbox").
    - Passes mission parameters (Package Name, Version, Mission ID) to the Sandbox via CLI arguments.

4.  **Telemetry Ingest:**
    - Receives reports/verdicts from the Sandboxes.
    - Updates the "Upgrade Registry" (Cache).
    - Posts comments back to GitHub based on the verdict.
