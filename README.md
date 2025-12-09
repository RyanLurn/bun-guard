# bun-guard 🛡️

**The Autonomous Supply Chain Watchdog for the Bun & Node.js Ecosystem.**

> _You blindly merge Renovate PRs. We know you do. `bun-guard` makes that safe._

## The Problem: The "LGTM" Reflex

Modern software development relies on thousands of third-party dependencies. When a bot like Renovate or Dependabot opens a Pull Request to bump a library from `v1.2.0` to `v1.2.1`, 99% of developers click "Merge" without reading the code.

Attackers know this.

1.  **The Artifact Gap:** The code you see on GitHub is often _not_ the code published to NPM. Hackers inject malware into the published tarball while keeping the git repo clean.
2.  **Postinstall Scripts:** A simple `npm install` can trigger arbitrary code execution on your machine or CI server, stealing environment variables before you even run the app.
3.  **Typosquatting & Social Engineering:** Malicious packages often look identical to legitimate ones, or legitimate packages are hijacked by bad actors.

Manual review is impossible at scale. Existing static analysis tools are too noisy. We need a system that _behaves_ like a security researcher, but runs at the speed of a machine.

## What is bun-guard?

`bun-guard` is an autonomous agent system that acts as a **Dynamic Security Sandbox** for your Pull Requests.

Instead of just scanning for known CVEs (which are often discovered weeks too late), `bun-guard` proactively "detonates" dependency updates in an isolated environment to observe their behavior before they touch your codebase.

It operates on a simple philosophy: **Trust, but Verify.**

## How It Works

When a dependency update is detected in your repository:

1.  **The Interception:** `bun-guard` halts the PR and spins up a disposable, isolated micro-VM (a "Sandbox").
2.  **The Trap:** The Sandbox installs the new package version in a quarantined sandbox heavily instrumented with sensors.
3.  **Dynamic Forensics:** It monitors the installation process for suspicious activity:
    - Did the package try to access the network during install? (e.g., sending `.env` to a foreign IP).
    - Did it modify files outside its directory?
    - Did it spawn obfuscated shell commands?
4.  **Artifact Analysis:** It compares the actual NPM tarball against the previous version (and the source code) to detect hidden "dark code" injected during the publish step.
5.  **The Verdict:**
    - **✅ Safe:** The PR is auto-approved or commented with a "Safe" badge.
    - **⚠️ Suspicious:** The PR is blocked, and a detailed forensic report is posted, highlighting the exact lines of code or network requests that triggered the alarm.

## Why Bun?

We built `bun-guard` on top of the **Bun** runtime for three reasons:

1.  **Speed:** Bun installs packages up to 30x faster than npm. This allows us to run dynamic sandbox tests in seconds, not minutes, keeping your CI pipeline fast.
2.  **Native Tooling:** Bun's text-based lockfile (`bun.lock`) and built-in security features allow for deeper, faster inspection of the dependency tree.
3.  **Isolation:** We leverage Bun's modern runtime features to execute untrusted code with tighter constraints than traditional Node.js environments.

## The "Global Immune System"

`bun-guard` utilizes a **Global Upgrade Registry**. If a popular package update (e.g., `express@5.0.0`) is scanned by one agent and deemed safe, that verdict is cryptographically signed and cached.

Your agent doesn't need to re-scan the world; it only needs to scan what is unique to _you_, making the system faster and smarter the more it is used.
