#!/usr/bin/env bash
# Runs once when the dev container is first created.
set -euo pipefail

# Readline: search history by the prefix already typed (Up/Down arrow keys)
grep -Fxq '"\e[A": history-search-backward' ~/.inputrc 2>/dev/null || \
  printf '"\e[A": history-search-backward\n"\e[B": history-search-forward\n' >> ~/.inputrc

# Claude Code (native installer, installs to ~/.local/bin)
curl -fsSL https://claude.ai/install.sh | bash
