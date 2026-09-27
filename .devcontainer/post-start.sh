#!/usr/bin/env bash
# Runs every time the dev container starts.
set -euo pipefail

pnpm install --frozen-lockfile

# Chromium + OS libs for `pnpm test:storybook` (packages/ui) — story
# interaction tests run in a real headless browser via @storybook/addon-vitest.
# Idempotent: no-ops if already cached in ~/.cache/ms-playwright. Needs sudo
# for the OS deps (--with-deps runs apt-get); the devcontainer base image
# grants the "node" user passwordless sudo.
sudo pnpm --filter @fmartinsandre/ui exec playwright install --with-deps chromium
