#!/usr/bin/env bash
# Runs every time the dev container starts.
set -euo pipefail

pnpm install --frozen-lockfile
