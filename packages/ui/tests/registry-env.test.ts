import { readRegistryEnv } from "@fma-ui/registry/env";
import { describe, expect, it } from "vitest";

const read = (env: Record<string, string>) => readRegistryEnv(env, { dotenv: false });

describe("readRegistryEnv", () => {
  it("returns the site URL as an origin", () => {
    expect(read({ FMA_UI_SITE_URL: "https://ui.example.com" })).toEqual({
      siteUrl: "https://ui.example.com",
    });
    expect(read({ FMA_UI_SITE_URL: " https://ui.example.com/ " }).siteUrl).toBe(
      "https://ui.example.com",
    );
  });

  it("fails when the site URL is missing", () => {
    expect(() => read({})).toThrow(/FMA_UI_SITE_URL is not set/);
    expect(() => read({ FMA_UI_SITE_URL: "  " })).toThrow(/FMA_UI_SITE_URL is not set/);
  });

  it("fails on a URL that isn't a plain http(s) origin", () => {
    expect(() => read({ FMA_UI_SITE_URL: "ui.example.com" })).toThrow(
      /must be a valid http\(s\) URL/,
    );
    expect(() => read({ FMA_UI_SITE_URL: "ftp://ui.example.com" })).toThrow(
      /must be a valid http\(s\) URL/,
    );
    expect(() => read({ FMA_UI_SITE_URL: "https://ui.example.com/r" })).toThrow(/origin only/);
  });

  it("explains where to set it", () => {
    expect(() => read({})).toThrow(/\.env\.example/);
  });
});
