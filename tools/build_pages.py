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
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = (
    'index.html', 'v2.css', 'v2.js', 'i18n.js', 'i18n-static.js', 'i18n-dynamic.js',
    'legal/index.html', 'legal/legal.css', 'legal/legal.js',
    'privacy/index.html', 'terms/index.html', 'security/index.html',
    'security/reporting/index.html', 'subprocessors/index.html',
)
ASSET_LITERAL_RE = re.compile(r'''["']((?:\.\./)*assets/[^"'\s]+)["']''')
CSS_URL_RE = re.compile(r'''url\(\s*(['"]?)(.*?)\1\s*\)''', re.IGNORECASE)
CSS_IMPORT_RE = re.compile(r'''@import\s+['"]([^'"]+)['"]''', re.IGNORECASE)
VERSIONED_FILES = frozenset({'v2.css', 'v2.js', 'i18n.js', 'i18n-static.js', 'i18n-dynamic.js', 'legal.css', 'legal.js'})


class References(HTMLParser):
    def __init__(self, html: str) -> None:
        super().__init__()
        self.paths: list[str] = []
        self.ids: set[str] = set()
        self.feed(html)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        for key, value in attributes:
            if key == 'id' and value:
                self.ids.add(value)
            if key in ('href', 'src', 'poster') and value:
                self.paths.append(value)
            if key == 'srcset' and value and not value.strip().startswith('data:'):
                self.paths.extend(item.strip().split()[0] for item in value.split(',') if item.strip())


def version_asset(match: re.Match[str], version: str) -> str:
    attribute, quote, reference = match.groups()
    url = urlsplit(reference)
    if url.scheme or url.netloc or Path(url.path).name not in VERSIONED_FILES:
        return match.group(0)
    return f'{attribute}={quote}{url.path}?v={version}{quote}'


def validate_references(destination: Path) -> int:
    destination = destination.resolve()
    documents: dict[Path, References] = {}
    references: list[tuple[Path, str]] = []
    for source in destination.rglob('*'):
        if not source.is_file():
            continue
        if source.suffix == '.html':
            document = References(source.read_text(encoding='utf-8'))
            documents[source] = document
            references.extend((source, value) for value in document.paths)
        elif source.suffix == '.css':
            content = re.sub(r'/\*.*?\*/', '', source.read_text(encoding='utf-8'), flags=re.DOTALL)
            references.extend((source, match.group(2)) for match in CSS_URL_RE.finditer(content))
            references.extend((source, value) for value in CSS_IMPORT_RE.findall(content))
        elif source.suffix in ('.js', '.mjs'):
            references.extend((source, value) for value in ASSET_LITERAL_RE.findall(source.read_text(encoding='utf-8')))
    for source, reference in references:
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            continue
        path = unquote(url.path)
        target = (source.parent / path).resolve() if path else source
        if target.is_dir():
            target = target / 'index.html'
        if path.startswith('/') or not target.is_relative_to(destination) or not target.is_file():
            raise SystemExit(f'Invalid Pages reference in {source.relative_to(destination)}: {reference}')
        if url.fragment and target.suffix == '.html':
            document = documents.get(target)
            if document is None:
                document = References(target.read_text(encoding='utf-8'))
                documents[target] = document
            if unquote(url.fragment) not in document.ids:
                raise SystemExit(f'Missing Pages fragment in {source.relative_to(destination)}: {reference}')
    return len(references)


def build(destination: Path, *, preview: bool = True) -> None:
    destination = destination.resolve()
    if destination.exists() and any(destination.iterdir()):
        raise SystemExit(f'Destination must be empty: {destination}')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    version = commit[:7]
    destination.mkdir(parents=True, exist_ok=True)
    for filename in PUBLIC_FILES:
        source = ROOT / 'v2' / filename
        # V2 becomes the published root. Remove exactly one parent segment
        # before shared assets, including on deeper legal policy routes.
        content = source.read_text(encoding='utf-8').replace('../assets/', 'assets/')
        if source.suffix == '.html':
            content = re.sub(r'''(href|src)=(["'])([^"']+)\2''',
                             lambda match: version_asset(match, version), content)
            if preview:
                content = re.sub(r'<meta\s+name="robots"[^>]*>\s*', '', content)
                content = content.replace('</head>', '  <meta name="robots" content="noindex,follow">\n</head>', 1)
        target = destination / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding='utf-8')
    shutil.copytree(ROOT / 'assets/firm-knowledge', destination / 'assets/firm-knowledge')
    shutil.copy2(ROOT / 'assets/favicon.svg', destination / 'assets/favicon.svg')
    (destination / '.nojekyll').touch()
    (destination / 'build-info.json').write_text(json.dumps({'source_commit': commit, 'source_path': 'v2/'}, indent=2) + '\n', encoding='utf-8')

    checked = validate_references(destination)
    print(f'Built V2 for GitHub Pages at {destination}; checked {checked} references.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', nargs='?', type=Path, default=ROOT / 'output/pages')
    build(parser.parse_args().destination)
