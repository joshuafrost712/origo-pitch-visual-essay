#!/bin/bash
# Downloads the essay's public-domain manuscript images from Wikimedia Commons
# at bounded widths, into src/assets/manuscripts/. Licenses and credits are
# recorded in CREDITS.md; verify the license on each Commons file page before
# adding a new image here.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/assets/manuscripts
mkdir -p "$OUT"

# fetch <commons file title (no File: prefix, URL-encoded)> <out name> <max width; 0 = original>
fetch() {
  local title="$1" out="$2" width="$3" url
  if [ "$width" = "0" ]; then
    url=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=File:${title}&prop=imageinfo&iiprop=url" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d['query']['pages'].values())[0]['imageinfo'][0]['url'])")
  else
    url=$(curl -s "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=File:${title}&prop=imageinfo&iiprop=url&iiurlwidth=${width}" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d['query']['pages'].values())[0]['imageinfo'][0]['thumburl'])")
  fi
  echo "$out <- $url"
  curl -sL -o "$OUT/$out" "$url"
}

fetch "Manchester%2C%20John%20Rylands%20Library%20Ms%20Greek%20P%20457%20(Papyrus%2052)%20recto%20John%2018%2C%2031-33.jpg" p52-recto.jpg 1600
fetch "Bifolio%20from%20Paul's%20Letter%20to%20the%20Romans%2C%20the%20end%20of%20Paul's%20Letter%20to%20the%20Philippians%20and%20the%20beginning%20of%20Paul's%20Letter%20to%20the%20Colossians.jpg" p46-romans.jpg 1800
fetch "Codex%20Sinaiticus%20Matthew%206%2C4-32.JPG" sinaiticus-matt6.jpg 0
fetch "POxy%205100.jpg" poxy5100-letter.jpg 0
fetch "Great%20Isaiah%20Scroll.jpg" isaiah-scroll.jpg 2400
fetch "British%20Museum%20Flood%20Tablet.jpg" flood-tablet.jpg 0

ls -la "$OUT"
