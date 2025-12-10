type JobParams = {
  missionId: string;
  pkg: string;
  ver: string;
};

export async function spawnSandbox(params: JobParams) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    return spawnCloudRunJob(params);
  } else {
    return spawnLocalProcess(params);
  }
}

// LOCAL DEV STRATEGY
async function spawnLocalProcess({ missionId, pkg, ver }: JobParams) {
  console.log(`[Infra] 💻 Spawning Local Subprocess for ${pkg}...`);

  // We point relatively to the sandbox script
  const sandboxScript = Bun.resolveSync(
    "../../../sandbox/src/index.ts",
    import.meta.dir
  );
  const apiUrl = "http://localhost:3000";

  // Fire and forget the subprocess
  Bun.spawn({
    cmd: [
      "bun",
      "run",
      sandboxScript,
      "--mission",
      missionId,
      "--pkg",
      pkg,
      "--ver",
      ver,
      "--apiUrl",
      apiUrl,
    ],
    stdout: "inherit", // Pipe logs to API console so we can see it working
    stderr: "inherit",
  });
}

// PROD STRATEGY (Placeholder for now)
async function spawnCloudRunJob(_params: JobParams) {
  console.log(`[Infra] ☁️ Triggering Cloud Run Job (Not implemented yet)`);
}
