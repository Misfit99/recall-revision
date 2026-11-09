#!/bin/bash
# Regenerate the Core Java content files from the v2 revision PDFs.
# Usage: PYTHON=/path/to/python-with-pymupdf ./build_core_java.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../.."
OUT="$HERE/../content/core-java"
PY="${PYTHON:-python3}"
mkdir -p "$OUT"
for d in 1 2 3 4A 4B 5 6; do
  id="day-$(echo "$d" | tr 'A-Z' 'a-z')"
  "$PY" "$HERE/extract_revision_pdf.py" core-java "$id" "$SRC/Core_Java_SDE2_Revision_Day${d}_v2_dark.pdf" "$OUT/$id.js"
done
