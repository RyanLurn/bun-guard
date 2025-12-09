# bun-guard / sandbox 🔬

**The Detonation Chamber & Forensic Lab.**

This is the disposable, ephemeral agent that performs the actual security analysis. Unlike the API, which runs continuously, the Sandbox is triggered on-demand to inspect a specific package version. It is designed to be potentially compromised—executing untrusted code so your production environment doesn't have to.

## Architecture

- **Runtime:** Bun.
- **Infrastructure:** Google Cloud Run **Job**.
- **Isolation:** Runs inside Google's **gVisor** container runtime for kernel-level isolation.
- **Lifespan:** Seconds. It boots, analyzes, reports, and terminates.

## Responsibilities

The Sandbox executes a linear "Mission" consisting of several forensic phases:

1.  **Identity Verification:**
    - **Typosquat Detection:** Checks the package name against a database of popular packages to detect "dopplegangers" (e.g., `react-dom` vs `r3act-dom`).
    - **Metadata Analysis:** Checks package age, maintainer reputation, and release cadence via the NPM Registry API.

2.  **Static Analysis (The "Autopsy"):**
    - **Tarball Diffing:** Downloads the target version (`v1.0.1`) and the previous version (`v1.0.0`). It generates a file-by-file diff to see exactly what changed.
    - **Code Inspection:** Scans the diff for high-entropy strings (potential obfuscated code), base64 blobs, or suspicious IP addresses.
    - **Lockfile Analysis:** Parses `bun.lock` to detect dependency tree tampering.

3.  **Dynamic Analysis (The "Detonation"):**
    - **The Trap:** It attempts to run `bun install` with the target package.
    - **Instrumentation:** It uses a custom `[install.security]` scanner (native to Bun) and OS-level monitoring to detect:
      - Outbound network connections (Command & Control callbacks).
      - Filesystem modifications outside the install directory.
      - Access to sensitive environment variables (Honeytokens).

4.  **Reporting:**
    - Compiles a verdict (`SAFE`, `SUSPICIOUS`, or `MALWARE`).
    - Sends the verdict and a summarized log back to the **API** via a secured HTTP callback.

## Security Model

The Sandbox is architected under the assumption that the code being analyzed **is malware**.

- **Zero-Trust Identity:** The Sandbox container holds **no** database credentials or cloud permissions. It receives a single-use "Mission Token" at startup to authenticate its final report.
- **Network Restriction:** By default, the Sandbox runs in a restricted network profile that allows access to the NPM Registry but logs/blocks unknown egress traffic.
- **Ephemeral Existence:** Every analysis runs in a fresh, cold container. There is no persistence between jobs, preventing malware from establishing a foothold.
