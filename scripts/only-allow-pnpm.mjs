// Root `preinstall` guard: fail `npm install` / `yarn` early, like `only-allow pnpm`, but
// without downloading and running an unpinned package via `npx` on every install.
// biome-ignore lint/suspicious/noUndeclaredEnvVars: install hook, not a turbo task
const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  const used = userAgent.split("/")[0] || "an unknown package manager";
  console.error(
    `\nThis repository requires pnpm, but it was installed with ${used}.\n` +
      "Run `corepack enable` and then `pnpm install`.\n",
  );
  process.exit(1);
}
