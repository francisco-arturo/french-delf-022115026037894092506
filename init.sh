#!/bin/bash
set -e

echo "=== Harness Initialization ==="

if ! command -v node >/dev/null 2>&1; then
  echo "node is not on PATH; this prototype needs Node 18 or newer for verification." >&2
  exit 1
fi

node verify.mjs

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Re-run verification before claiming done"
