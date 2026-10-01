#!/usr/bin/env python3
"""Build the reviewed V2 as the root of a GitHub Pages project site."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = ('index.html', 'v2.css', 'v2.js')
ASSET_LITERAL_RE = re.compile(r'''["']((?:\.\./)?assets/[^"'\s]+)["']''')


class References(HTMLParser):
    def __init__(self, html: str) -> None:
        super().__init__()
        self.paths: list[str] = []
        self.feed(html)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        for key, value in attributes:
            if key in ('href', 'src') and value:
                self.paths.append(value)


def build(destination: Path) -> None:
    destination = destination.resolve()
    if destination.exists() and any(destination.iterdir()):
        raise SystemExit(f'Destination must be empty: {destination}')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    version = commit[:7]
    destination.mkdir(parents=True, exist_ok=True)
    for filename in PUBLIC_FILES:
        source = ROOT / 'v2' / filename
        content = source.read_text(encoding='utf-8').replace('../assets/', 'assets/')
        # Policy links stay on the main domain; assets retain the project prefix.
        content = re.sub(r'href="/(privacy|security|terms|legal)/"', r'href="https://oakbase.ai/\1/"', content)
        content = content.replace('href="/"', 'href="https://oakbase.ai/"')
        if filename == 'index.html':
            content = content.replace('href="v2.css"', f'href="v2.css?v={version}"')
            content = content.replace('src="v2.js"', f'src="v2.js?v={version}"')
        (destination / filename).write_text(content, encoding='utf-8')
    shutil.copytree(ROOT / 'assets/firm-knowledge', destination / 'assets/firm-knowledge')
    shutil.copy2(ROOT / 'assets/favicon.svg', destination / 'assets/favicon.svg')
    (destination / '.nojekyll').touch()
    (destination / 'build-info.json').write_text(json.dumps({'source_commit': commit, 'source_path': 'v2/'}, indent=2) + '\n', encoding='utf-8')

    references = References((destination / 'index.html').read_text(encoding='utf-8')).paths
    for stylesheet in destination.glob('*.css'):
        references.extend(re.findall(r'url\([\'"]?([^\)\'\"]+)', stylesheet.read_text(encoding='utf-8')))
    references.extend(ASSET_LITERAL_RE.findall((destination / 'v2.js').read_text(encoding='utf-8')))
    for reference in references:
        url = urlsplit(reference)
        if url.scheme or url.netloc or not url.path:
            continue
        target = (destination / url.path).resolve()
        if url.path.startswith('/') or not target.is_relative_to(destination) or not target.is_file():
            raise SystemExit(f'Invalid Pages asset: {reference}')
    print(f'Built V2 for GitHub Pages at {destination}; checked {len(references)} references.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', nargs='?', type=Path, default=ROOT / 'output/pages')
    build(parser.parse_args().destination)
