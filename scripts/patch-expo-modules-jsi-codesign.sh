#!/bin/bash
# ExpoModulesJSI xcframework build fails codesign on iCloud/Desktop paths because
# extended attributes (com.apple.fileprovider.fpfs#P, etc.) are not allowed.
# Disable signing for this intermediate pod framework build; the app is still signed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="${ROOT}/node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"

if [[ ! -f "$SCRIPT" ]]; then
  exit 0
fi

if grep -q 'CODE_SIGNING_ALLOWED=NO' "$SCRIPT"; then
  exit 0
fi

python3 - "$SCRIPT" <<'PY'
from pathlib import Path
import sys

script = Path(sys.argv[1])
text = script.read_text()
needle = "    SWIFT_COMPILATION_MODE=wholemodule \\\n  )"
replacement = (
    "    SWIFT_COMPILATION_MODE=wholemodule \\\n"
    "    CODE_SIGNING_ALLOWED=NO \\\n"
    "    CODE_SIGNING_REQUIRED=NO \\\n"
    "  )"
)
if needle not in text:
    sys.exit(0)
script.write_text(text.replace(needle, replacement, 1))
PY

echo "patched expo-modules-jsi build-xcframework.sh (disable intermediate codesign)"
