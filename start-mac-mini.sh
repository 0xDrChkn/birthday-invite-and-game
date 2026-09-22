#!/bin/sh
set -eu
if [ "$(uname -s)" != Darwin ]; then
  echo 'Run this command on the Mac mini running macOS.' >&2
  exit 1
fi
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ -z "${NODE_BIN:-}" ]; then
  NODE_BIN=$(command -v node || true)
  if [ -n "$NODE_BIN" ] && ! "$NODE_BIN" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' 2>/dev/null; then
    NODE_BIN=''
  fi
fi
if [ -z "$NODE_BIN" ] || ! "$NODE_BIN" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' 2>/dev/null; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/v*/bin/node; do
    if [ -x "$candidate" ] && "$candidate" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' 2>/dev/null; then
      NODE_BIN=$candidate
      break
    fi
  done
fi
if [ -z "$NODE_BIN" ]; then
  echo 'Install Node.js 24 LTS from https://nodejs.org/ and run this command again.' >&2
  exit 1
fi
exec "$NODE_BIN" "$SCRIPT_DIR/local-server/launch.mjs" "$@"
