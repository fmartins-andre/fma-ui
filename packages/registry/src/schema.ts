// Zod schemas for the shadcn registry format (https://ui.shadcn.com/schema/registry.json).
// Kept as a standalone package so both the registry generator (packages/ui) and any
// future tooling (e.g. a validator in CI, or the web app) share one source of truth.

import { z } from "zod";

export const RegistryItemFileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  type: z.enum([
    "registry:block",
    "registry:component",
    "registry:lib",
    "registry:hook",
    "registry:ui",
    "registry:page",
    "registry:file",
    "registry:style",
    "registry:theme",
    "registry:item",
  ]),
  target: z.string().optional(),
});

export const RegistryItemSchema = z.object({
  name: z.string(),
  type: z.enum([
    "registry:block",
    "registry:component",
    "registry:lib",
    "registry:hook",
    "registry:ui",
    "registry:page",
    "registry:file",
    "registry:style",
    "registry:theme",
    "registry:item",
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
  docs: z.string().optional(),
  registryDependencies: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  files: z.array(RegistryItemFileSchema),
  tailwind: z
    .object({
      config: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  cssVars: z.record(z.string(), z.any()).optional(),
  css: z.record(z.string(), z.any()).optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const RegistrySchema = z.object({
  name: z.string(),
  $schema: z.string(),
  homepage: z.string().url().optional(),
  items: z.array(RegistryItemSchema),
});

export type RegistryItem = z.infer<typeof RegistryItemSchema>;
export type RegistryItemFile = z.infer<typeof RegistryItemFileSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

// Metadata authored by hand next to each component (src/core/<name>/meta.json).
// Not part of the shadcn schema — the registry generator reads this and folds it
// into a full RegistryItem.
export const ComponentMetaSchema = z.object({
  name: z.string(),
  category: z.string(),
  status: z.enum(["stable", "experimental"]),
  source: z.enum(["shadcn", "customized", "original", "third-party"]),
  // Where this came from when source is "third-party": the registry item URL
  // or "@namespace/name" ref you passed to add-from-registry.ts. Kept for
  // attribution/license tracking when republishing someone else's component.
  origin: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
});

export type ComponentMeta = z.infer<typeof ComponentMetaSchema>;
