#!/usr/bin/env bash
# Runs every time the dev container starts.
set -euo pipefail

# GitHub credentials from the gh CLI (`gh auth login`), not from the host:
# VS Code's forwarding helper asks the host's git, which falls back to a
# desktop askpass prompt. A URL-scoped helper list starting with an empty
# entry overrides the generic one. Same config `gh auth setup-git` writes,
# but it works before login (and VS Code may rewrite ~/.gitconfig on reconnect).
git config --global --replace-all credential.https://github.com.helper ""
git config --global --add credential.https://github.com.helper "!/usr/bin/gh auth git-credential"
git config --global --replace-all credential.https://gist.github.com.helper ""
git config --global --add credential.https://gist.github.com.helper "!/usr/bin/gh auth git-credential"

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
