# Bun Guard 🛡️

**The Autonomous Supply Chain Watchdog.**

> _You blindly merge Renovate PRs. We know you do. Bun Guard makes that safe._

## The Problem: The "LGTM" Reflex

Modern software development relies on thousands of third-party dependencies. When a bot like Renovate or Dependabot opens a Pull Request to bump a library from `v1.2.0` to `v1.2.1`, 99% of developers click "Merge" without reading the code.

Attackers know this. Supply chain attacks don't happen in the Git repo; they happen in the published artifact (NPM tarball) or via obfuscated code hidden in massive diffs.

## The Solution

**Bun Guard** acts as an AI Security Analyst that lives in your CI pipeline. It doesn't just scan for CVEs; it **reads the code** so you don't have to.

### How It Works (The Core Engine)

1.  **Interception:** Detects a package update (e.g., `is-odd` updated to `3.0.1`).
2.  **Forensics:** Spins up an isolated, ephemeral sandbox.
    - Installs the _previous_ version.
    - Installs the _new_ version.
    - Generates a precise **Git Diff** of the `node_modules` (excluding noise like lockfiles).
3.  **AI Analysis:** Feeds the diff to a specialized LLM Agent trained to spot:
    - Obfuscated code.
    - Unexpected network calls.
    - Suspicious filesystem access.
    - Tampering with build scripts.
4.  **Verdict:** Posts a summary comment on your PR: _"Safe to merge: Logic update only"_ or _"BLOCKING: Detected unauthorized network access."_

---

## Project Architecture

This monorepo contains two distinct implementations of this vision.

### 1. Bun Guard (Open Source / Self-Hosted)

**Location:** [`apps/cli`](./apps/cli)

This is the current focus. It is a CLI tool designed to run inside **GitHub Actions** (or any CI runner). It is stateless, serverless, and private.

- **Workflow:**
  1.  Dependabot/Renovate opens a PR.
  2.  GitHub Action triggers `bun-guard`.
  3.  `bun-guard` generates the diff locally in the runner.
  4.  `bun-guard` uses your API Key (OpenAI/Anthropic) to review the code.
  5.  It posts the verdict to the PR.
- **Status:** **PoC Complete.** (See usage below).

### 2. ES Vanguard (SaaS / Ecosystem Watchdog)

**Location:** [`apps/api`](./apps/api), [`apps/watcher`](./apps/watcher), [`apps/sandbox`](./apps/sandbox)

This is the distributed, enterprise-grade architecture designed to monitor the **entire NPM ecosystem** in real-time.

- **Watcher:** Polls NPM for every new package publish.
- **API:** A central orchestration brain (Hono + Cloudflare/Cloud Run).
- **Sandbox:** Ephemeral Cloud Run Jobs that "detonate" packages in a secure environment.
- **Goal:** To pre-cache security verdicts for every package on NPM, creating a "VirusTotal for JavaScript."
- **Status:** **Frozen / Reference.** We are keeping this code as a blueprint for the future SaaS expansion, but development is currently focused on the CLI.

---

## Getting Started (Local PoC)

You can currently test the "Brain" and "Eyes" of Bun Guard using the CLI prototype.

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- Git
- A Groq API Key (or OpenAI/Anthropic compatible key)

### Setup

1.  Clone the repo:
    ```bash
    git clone https://github.com/yourusername/bun-guard.git
    cd bun-guard
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Configure Environment:
    Create `.env` in `apps/cli/.env`:
    ```ini
    GROQ_API_KEY=your_key_here
    ```

### Running a Scan

You can manually trigger a review for any NPM package version.

```bash
# Go to the CLI app
cd apps/cli

# Scan is-odd version 3.0.1 (vs 3.0.0)
bun run start --pkg is-odd --ver "3.0.1"
```

**What happens next:**

1.  Bun Guard creates a secure temp directory in your OS `tmp` folder.
2.  It resolves `3.0.0` as the previous stable version.
3.  It runs `git diff` between the two installs.
4.  It sends the diff to the AI.
5.  It prints the Verdict and Explanation to your terminal.

---

## Tech Stack

- **Runtime:** [Bun](https://bun.sh).
- **Framework:** [Hono](https://hono.dev).
- **AI:** Vercel AI SDK.
- **Package Manager:** Bun (Workspaces + Catalogs).
