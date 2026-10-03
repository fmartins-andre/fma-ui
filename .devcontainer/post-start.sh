#!/usr/bin/env bash
# Runs every time the dev container starts.
set -euo pipefail

pnpm install --frozen-lockfile

# Chromium + OS libs for `pnpm test:storybook` (packages/ui) — story
# interaction tests run in a real headless browser via @storybook/addon-vitest.
# Idempotent: no-ops if already cached in ~/.cache/ms-playwright.
#
# The browser is downloaded as the "node" user so it lands in node's cache
# (under sudo it would go to /root/.cache and be invisible to the tests).
# Only the OS deps (apt-get) need root; sudo resets PATH (secure_path) and
# can't see pnpm/node_modules binaries, so call playwright by absolute path
# and forward PATH so the bin shim can find node.
pnpm --filter @fma-ui/ui exec playwright install chromium
sudo env "PATH=$PATH" "$PWD/packages/ui/node_modules/.bin/playwright" install-deps chromium
