#!/bin/sh
set -eu
if [ "$(uname -s)" != Darwin ]; then
  echo 'This installer is for the Mac mini running macOS.' >&2
  exit 1
fi
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NODE_BIN=${NODE_BIN:-$(command -v node || true)}
if [ -z "$NODE_BIN" ]; then
  echo 'Install Node.js 24 LTS from https://nodejs.org/ first, then run this installer again.' >&2
  exit 1
fi
exec "$NODE_BIN" "$SCRIPT_DIR/setup.mjs" --activate "$@"
