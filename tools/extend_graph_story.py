"""Add the approved graph story to a generated V2 website, without hosting policy."""
from __future__ import annotations

from hashlib import sha256
import importlib.util
from pathlib import Path
import re
import shutil
import subprocess


EXTENSIONS = ('graph-story.css', 'graph-story.js')
SCOPE = '18-second graph-to-agent story with video controls in the existing platform section'


def extend(destination: Path, source: Path) -> None:
    """Extend generated public files using the graph-story sources in ``source``.

    ``source`` is the V3 source directory, including scripts/patch_graph.py.
    Preview indexing rules and production localization stay with their builders.
    """
    for name in EXTENSIONS:
        path = source / name
        if not path.is_file() or path.is_symlink():
            raise SystemExit(f'Missing graph extension: {path}')
    for name in EXTENSIONS:
        if name.endswith('.js'):
            subprocess.run(['node', '--check', str(source / name)], check=True)

    spec = importlib.util.spec_from_file_location('oakbase_graph_patch', source / 'scripts/patch_graph.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    for name in EXTENSIONS:
        shutil.copyfile(source / name, destination / name)

    script = destination / 'v2.js'
    original = script.read_text(encoding='utf-8')
    anchor = 'memoryExplorer=createMemoryExplorer();'
    if original.count(anchor) != 1:
        raise SystemExit('Expected exactly one V2 graph initialisation hook.')
    patched = original.replace(anchor, anchor + 'window.OakbaseMemoryExplorer=memoryExplorer;', 1)
    # A hidden/resizing viewport can report zero dimensions. Do not lay out
    # constellations until it has a measurable box (the next observer retries).
    patched = patched.replace('const h=viewport.clientHeight;if(w===graphWidth', 'const h=viewport.clientHeight;if(w<=0||h<=0)return;if(w===graphWidth', 1)
    patched = module.patch(patched, (source / 'graph-story-native.js').read_text(encoding='utf-8'))
    script.write_text(patched, encoding='utf-8')

    homepage = destination / 'index.html'
    original_html = homepage.read_text(encoding='utf-8')
    original_html = re.sub(r'v2\.js\?v=[^\"\']+', 'v2.js?v=' + sha256(patched.encode()).hexdigest()[:12], original_html)
    pattern = r'(<script\b[^>]*\bsrc=["\']v2\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>)'
    css_hash = sha256((source / 'graph-story.css').read_bytes()).hexdigest()[:12]
    js_hash = sha256((source / 'graph-story.js').read_bytes()).hexdigest()[:12]
    replacement = r'\1' + f'\n  <link rel="stylesheet" href="graph-story.css?v={css_hash}">\n  <script src="graph-story.js?v={js_hash}" defer></script>'
    updated, count = re.subn(pattern, replacement, original_html, count=1)
    if count != 1:
        raise SystemExit('Expected exactly one V2 script element in the homepage.')
    homepage.write_text(updated, encoding='utf-8')
    subprocess.run(['node', '--check', str(script)], check=True)
