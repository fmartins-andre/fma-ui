// Environment the registry and its site need, validated in one place: the
// registry generator (packages/ui/scripts/gen-registry-json.ts) and apps/web's
// Vite config (dev server and build) both fail fast without it. A Vite plugin
// would cover only the latter, so this is a zod schema both can call.
//
// Node-only (reads files and process.env): not exported from the package's
// browser-safe index, import it as "@fma-ui/registry/env".

import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const ROOT_ENV_FILE = join(import.meta.dirname, "..", "..", "..", ".env");

const SITE_URL_HELP =
  "public URL where apps/web is deployed, e.g. https://ui.example.com — the registry's " +
  "homepage (consumers fetch <url>/r/{name}.json) and the Cloudflare Worker's custom domain";

// zod runs refinements even after the URL check failed; that one reports it.
const isOrigin = (value: string) => {
  if (!URL.canParse(value)) return true;
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash;
};

export const RegistryEnvSchema = z.object({
  FMA_UI_SITE_URL: z
    .string({ error: "is not set" })
    .trim()
    .min(1, "is not set")
    .pipe(z.url({ protocol: /^https?$/, error: "must be a valid http(s) URL" }))
    .refine(isOrigin, "must be an origin only (no path, query or hash)")
    .transform((value) => new URL(value).origin)
    .describe(SITE_URL_HELP),
});

export type RegistryEnv = { siteUrl: string };

/**
 * Reads and validates the required variables. Loads the repo root's `.env`
 * into `process.env` first (unless `dotenv` is false); it never overrides a
 * variable already set, so CI and Cloudflare's build settings win. Throws one
 * error listing everything that is missing or invalid.
 */
export function readRegistryEnv(
  env: Record<string, string | undefined> = process.env,
  { dotenv = true }: { dotenv?: boolean } = {},
): RegistryEnv {
  if (dotenv && existsSync(ROOT_ENV_FILE)) process.loadEnvFile(ROOT_ENV_FILE);
  const result = RegistryEnvSchema.safeParse(env);
  if (result.success) return { siteUrl: result.data.FMA_UI_SITE_URL };
  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.join(".")} ${issue.message}`,
  );
  const help = Object.entries(RegistryEnvSchema.shape).map(
    ([name, schema]) => `  ${name}: ${schema.description}`,
  );
  throw new Error(
    [
      "Missing or invalid environment variables:",
      ...problems,
      "",
      ...help,
      "",
      "Set them in the environment or in a .env file at the repo root (see .env.example).",
    ].join("\n"),
  );
}
