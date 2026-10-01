#!/usr/bin/env python3
"""Build the approved bilingual website for https://oakbase.ai."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import shutil
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

from build_pages import PUBLIC_FILES, ROOT, References, build as build_pages, validate_references
from check_robots import check as check_robots
from localize_production import generate as generate_languages


ORIGIN = 'https://oakbase.ai'
PAGES_ORIGIN = 'https://penrile29.github.io/agentia-website'
ROUTES = ('/', '/legal/', '/terms/', '/privacy/', '/security/', '/security/reporting/', '/subprocessors/')
LOCALIZED_ROUTES = tuple(f'/{lang}{route}' for lang in ('es', 'en') for route in ROUTES)
PRODUCTION_FILES = ('404.html', 'llms.txt', 'llms-full.txt')
# This inventory is intentionally explicit: private repository files and future
# additions to assets/ must never become public through a recursive copy.
PUBLIC_ASSETS = frozenset({
    'ASSET-SOURCES.md', 'LICENSE-dashboard-icons', 'LICENSE-gilbarbara-logos',
    'LICENSE-lobehub-icons', 'LICENSE-lucide', 'OFL-DM-Sans.txt',
    'calendar.svg', 'chatgpt.svg', 'claude.svg', 'clio.svg', 'copilot.svg',
    'dm-sans-latin-1.woff2', 'dm-sans.css', 'dynamics.svg', 'gmail.svg',
    'hubspot.svg', 'lucide-0.468.0.min.js', 'onenote.svg', 'outlook.svg',
    'salesforce.svg', 'slack.svg', 'teams.svg', 'whatsapp.svg',
})


class Metadata(HTMLParser):
    def __init__(self, content: str) -> None:
        super().__init__()
        self.canonicals: list[str] = []
        self.social_urls: list[str] = []
        self.feed(content)

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        attrs = dict(attributes)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('property') == 'og:url':
            self.social_urls.append(attrs.get('content', ''))


def validate_production(destination: Path) -> None:
    expected = set(PUBLIC_FILES) | set(PRODUCTION_FILES) | {
        'assets/favicon.svg', '.well-known/security.txt', 'robots.txt',
        'sitemap.xml', 'build-info.json',
    } | {f'assets/firm-knowledge/{name}' for name in PUBLIC_ASSETS}
    expected |= {route.lstrip('/') + 'index.html' for route in LOCALIZED_ROUTES}
    actual = {path.relative_to(destination).as_posix() for path in destination.rglob('*') if path.is_file()}
    if actual != expected:
        raise SystemExit(f'Production allowlist mismatch: extra={sorted(actual - expected)}, missing={sorted(expected - actual)}')
    for route in ROUTES + LOCALIZED_ROUTES:
        path = destination / route.lstrip('/') / 'index.html'
        content = path.read_text(encoding='utf-8')
        metadata = Metadata(content)
        expected_url = ORIGIN + (f'/en{route}' if route in ROUTES else route)
        if metadata.canonicals != [expected_url] or metadata.social_urls != [expected_url]:
            raise SystemExit(f'Invalid production metadata: {route}')
        if PAGES_ORIGIN in content:
            raise SystemExit(f'Preview site URL still present in {route}')
    # Absolute first-party links (also used by the 404 at arbitrary depths) must
    # resolve to a real file or public route within the production artifact.
    for path in destination.rglob('*.html'):
        for reference in References(path.read_text(encoding='utf-8')).paths:
            parsed = urlsplit(reference)
            if parsed.scheme != 'https' or parsed.netloc != 'oakbase.ai':
                continue
            target = (destination / unquote(parsed.path).lstrip('/')).resolve()
            if target.is_dir():
                target /= 'index.html'
            if not target.is_relative_to(destination) or not target.is_file():
                raise SystemExit(f'Missing production URL in {path.name}: {reference}')
    tree = ET.parse(destination / 'sitemap.xml')
    urls = [element.text for element in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    if urls != [ORIGIN + route for route in LOCALIZED_ROUTES]:
        raise SystemExit('Sitemap does not match the approved production routes')
    robots_errors = check_robots((destination / 'robots.txt').read_text(encoding='utf-8'))
    if robots_errors:
        raise SystemExit('Invalid public crawler policy: ' + '; '.join(robots_errors))


def build(destination: Path) -> None:
    destination = destination.resolve()
    asset_root = ROOT / 'assets/firm-knowledge'
    asset_paths = list(asset_root.rglob('*'))
    if any(path.is_symlink() for path in asset_paths):
        raise SystemExit('Production assets must not contain symbolic links')
    actual_assets = {path.relative_to(asset_root).as_posix() for path in asset_paths if path.is_file()}
    if actual_assets != PUBLIC_ASSETS:
        raise SystemExit('Review and update PUBLIC_ASSETS before publishing changed assets')
    build_pages(destination, preview=False)
    (destination / '.nojekyll').unlink()
    for route in ROUTES:
        path = destination / route.lstrip('/') / 'index.html'
        content = path.read_text(encoding='utf-8').replace(PAGES_ORIGIN, ORIGIN)
        if not Metadata(content).social_urls:
            content = content.replace('</head>', f'  <meta property="og:url" content="{ORIGIN + route}">\n</head>', 1)
        path.write_text(content, encoding='utf-8')
    generate_languages(destination, ROOT)
    # Old URLs also have a static fallback for plain-file previews. Production
    # nginx performs permanent redirects and respects explicit ?lang choices.
    for route in ROUTES:
        target = ORIGIN + '/en' + route
        content = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Oakbase</title><link rel="canonical" href="{target}">
<meta property="og:url" content="{target}"><meta http-equiv="refresh" content="0;url={target}">
</head><body><a href="{target}">Continue in English</a> · <a href="{ORIGIN}/es{route}">Continuar en español</a></body></html>'''
        (destination / route.lstrip('/') / 'index.html').write_text(content, encoding='utf-8')
    for filename in PRODUCTION_FILES:
        shutil.copy2(ROOT / 'production-assets' / filename, destination / filename)
    shutil.copy2(ROOT / 'robots.txt', destination / 'robots.txt')
    (destination / '.well-known').mkdir()
    shutil.copy2(ROOT / '.well-known/security.txt', destination / '.well-known/security.txt')
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += ''.join(f'  <url><loc>{ORIGIN + route}</loc></url>\n' for route in LOCALIZED_ROUTES)
    sitemap += '</urlset>\n'
    (destination / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
    build_info_path = destination / 'build-info.json'
    build_info = json.loads(build_info_path.read_text(encoding='utf-8'))
    build_info.update({'site_url': ORIGIN, 'target': 'production'})
    build_info_path.write_text(json.dumps(build_info, indent=2) + '\n', encoding='utf-8')
    checked = validate_references(destination)
    validate_production(destination)
    print(f'Built Oakbase production at {destination}; checked {checked} references and {len(LOCALIZED_ROUTES)} canonical routes.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', nargs='?', type=Path, default=ROOT / 'output/production')
    build(parser.parse_args().destination)
