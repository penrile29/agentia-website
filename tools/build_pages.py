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
    destination.mkdir(parents=True, exist_ok=True)
    for source in (ROOT / 'v2').iterdir():
        if source.is_file() and source.suffix in ('.html', '.css', '.js'):
            content = source.read_text(encoding='utf-8')
            content = content.replace('../assets/', 'assets/').replace('../agentic.css', 'agentic.css')
            # Keep policy/comparison links on the existing main website. Root-relative
            # links would otherwise leave GitHub's /agentia-website/ project prefix.
            content = re.sub(r'href="/(privacy|security|terms|legal)/"', r'href="https://oakbase.ai/\1/"', content)
            content = content.replace('href="/"', 'href="https://oakbase.ai/"')
            (destination / source.name).write_text(content, encoding='utf-8')
    shutil.copy2(ROOT / 'agentic.css', destination / 'agentic.css')
    shutil.copytree(ROOT / 'assets', destination / 'assets')
    (destination / '.nojekyll').touch()
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    (destination / 'build-info.json').write_text(json.dumps({'source_commit': commit, 'source_path': 'v2/'}, indent=2) + '\n', encoding='utf-8')

    references = References((destination / 'index.html').read_text(encoding='utf-8')).paths
    for stylesheet in destination.glob('*.css'):
        references.extend(re.findall(r'url\([\'"]?([^\)\'\"]+)', stylesheet.read_text(encoding='utf-8')))
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
