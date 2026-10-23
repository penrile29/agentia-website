#!/usr/bin/env python3
"""Copy V2 into an isolated preview and add only the manual graph story."""
from __future__ import annotations

import json
from pathlib import Path
import shutil
import sys
import tempfile

V3 = Path(__file__).resolve().parents[1]
REPOSITORY = V3.parent
DESTINATION = V3 / 'dist'
sys.path.insert(0, str(REPOSITORY / 'tools'))

import build_pages as pages
from extend_graph_story import SCOPE, extend


def build() -> None:
    with tempfile.TemporaryDirectory(prefix='.dist-build-', dir=V3) as temporary:
        stage = Path(temporary) / 'public'
        # Use V2's public allowlist and path rewriting; never edit its source.
        pages.build(stage, preview=True)
        extend(stage, V3)

        spanish = stage / 'es/index.html'
        spanish.parent.mkdir()
        spanish.write_text('''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0; url=../?lang=es#platform">
<title>Oakbase — Vista previa del grafo</title></head><body>
<p><a href="../?lang=es#platform">Abrir la vista previa en español</a></p>
</body></html>
''', encoding='utf-8')
        (stage / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
        metadata = json.loads((stage / 'build-info.json').read_text())
        metadata.update({'source_path': 'v2/', 'preview_extension': 'v3/graph-story', 'scope': SCOPE})
        (stage / 'build-info.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')

        checked = pages.validate_references(stage)
        if DESTINATION.is_symlink():
            raise SystemExit('Refusing to replace a symlink at v3/dist.')
        if DESTINATION.exists():
            shutil.rmtree(DESTINATION)
        shutil.move(str(stage), str(DESTINATION))
    print(f'Built V2 + graph story in {DESTINATION}; checked {checked} references. Original v2/ unchanged.')


if __name__ == '__main__':
    build()
