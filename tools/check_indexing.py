#!/usr/bin/env python3
"""Check crawlable, localized pages in a production build without running JavaScript."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET


LANGUAGES = ('es', 'en')
ROUTES = ('', 'legal/', 'privacy/', 'terms/', 'security/', 'security/reporting/', 'subprocessors/')
VOID_TAGS = frozenset('area base br col embed hr img input link meta param source track wbr'.split())
INVISIBLE_TAGS = frozenset(('head', 'script', 'style', 'template'))


def normalized(value: str) -> str:
    return ' '.join(value.split())


@dataclass
class Element:
    tag: str
    attrs: dict[str, str | None] = field(default_factory=dict)
    children: list[Element | str] = field(default_factory=list)

    def elements(self):
        yield self
        for child in self.children:
            if isinstance(child, Element):
                yield from child.elements()

    def hidden(self) -> bool:
        return bool(self.tag in INVISIBLE_TAGS or 'hidden' in self.attrs or
                    self.attrs.get('aria-hidden') == 'true' or
                    re.search(r'(?:display\s*:\s*none|visibility\s*:\s*hidden)', self.attrs.get('style') or ''))

    def visible_elements(self):
        if self.hidden():
            return
        yield self
        for child in self.children:
            if isinstance(child, Element):
                yield from child.visible_elements()

    def text(self, visible: bool = False) -> str:
        if visible and self.hidden():
            return ''
        return normalized(' '.join(child.text(visible) if isinstance(child, Element) else child
                                   for child in self.children))


class Document(HTMLParser):
    def __init__(self, content: str):
        super().__init__(convert_charrefs=True)
        self.root = Element('document')
        self.stack = [self.root]
        self.feed(content)
        self.close()

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)

    def find(self, tag=None, **attrs):
        return [node for node in self.root.elements()
                if (tag is None or node.tag == tag) and
                all(name in node.attrs if value is None else node.attrs.get(name) == value
                    for name, value in attrs.items())]


class IndexingCheck:
    def __init__(self, directory: Path):
        self.directory = directory.resolve()
        self.errors: list[str] = []
        self.documents: dict[Path, Document] = {}
        self.base = ''
        self.checked_references = 0
        self.checked_copy = 0

    def fail(self, source: Path | str, message: str):
        label = str(source.relative_to(self.directory)) if isinstance(source, Path) else source
        self.errors.append(f'{label}: {message}')

    def document(self, source: Path) -> Document:
        if source not in self.documents:
            self.documents[source] = Document(source.read_text(encoding='utf-8'))
        return self.documents[source]

    def page(self, language: str, route: str) -> Path:
        return self.directory / language / route / 'index.html'

    def canonical(self, source: Path) -> str:
        links = [node.attrs.get('href') or '' for node in self.document(source).find('link')
                 if 'canonical' in (node.attrs.get('rel') or '').split()]
        if len(links) != 1:
            self.fail(source, f'expected one canonical link, found {len(links)}')
        return links[0] if links else ''

    def check_metadata(self, source: Path, language: str, route: str):
        doc = self.document(source)
        html = doc.find('html')
        if len(html) != 1 or html[0].attrs.get('lang') != language:
            self.fail(source, f'initial HTML must declare lang="{language}"')
        expected = self.base + language + '/' + route
        if self.canonical(source) != expected:
            self.fail(source, f'canonical must be {expected}')
        alternates: dict[str, list[str]] = {}
        for node in doc.find('link'):
            if 'alternate' in (node.attrs.get('rel') or '').split() and node.attrs.get('hreflang'):
                alternates.setdefault(node.attrs['hreflang'], []).append(node.attrs.get('href') or '')
        for alternate in (*LANGUAGES, 'x-default'):
            target_language = 'en' if alternate == 'x-default' else alternate
            target = self.base + target_language + '/' + route
            if alternates.get(alternate) != [target]:
                self.fail(source, f'hreflang {alternate!r} must occur once and point to {target}')
        titles = doc.find('title')
        if len(titles) != 1 or not titles[0].text():
            self.fail(source, 'missing initial document title')
        descriptions = doc.find('meta', name='description')
        if len(descriptions) != 1 or not normalized(descriptions[0].attrs.get('content') or ''):
            self.fail(source, 'missing initial meta description')
        for meta in doc.find('meta', name='robots'):
            if 'noindex' in (meta.attrs.get('content') or '').lower():
                self.fail(source, 'indexable route contains noindex')
        visible = list(doc.root.visible_elements())
        headings = [node.text(visible=True) for node in visible if node.tag == 'h1' and node.text(visible=True)]
        if not headings:
            self.fail(source, 'missing readable initial H1')
        for node in visible:
            if node.attrs.get('data-lang') == ('en' if language == 'es' else 'es') and node.text(visible=True):
                self.fail(source, f'other-language data-lang block is initially visible: {node.text()[:65]}')
                break
        for node in doc.find('title'):
            authored = node.attrs.get('data-title-' + language)
            if authored and node.text() != normalized(authored):
                self.fail(source, 'initial title differs from its authored language title')

    def static_catalog(self):
        files = sorted(self.directory.rglob('i18n-static.js'))
        if not files:
            self.fail('home', 'missing static translation catalog')
            return {}
        source = files[0]
        match = re.search(r'window\.OakbaseStaticCopy\s*=\s*(\{.*\})\s*;?\s*$',
                          source.read_text(encoding='utf-8'), re.DOTALL)
        try:
            if not match:
                raise ValueError('expected window.OakbaseStaticCopy JSON assignment')
            return json.loads(match.group(1))
        except (ValueError, json.JSONDecodeError) as error:
            self.fail(source, f'cannot read static translation catalog: {error}')
            return {}

    def check_home(self, source: Path, language: str, catalog: dict):
        doc = self.document(source)
        copy = catalog.get(language, {})
        count = 0
        for node in doc.root.elements():
            for attribute, key in node.attrs.items():
                if attribute != 'data-i18n' and not attribute.startswith('data-i18n-'):
                    continue
                if key not in copy:
                    self.fail(source, f'missing {language} translation for {key!r}')
                    continue
                expected = copy[key]
                if attribute in ('data-i18n', 'data-i18n-html'):
                    actual = node.text()
                    if attribute == 'data-i18n-html':
                        expected = Document(expected).root.text()
                else:
                    actual = node.attrs.get(attribute.removeprefix('data-i18n-')) or ''
                if normalized(actual) != normalized(expected):
                    self.fail(source, f'{key!r} is not rendered in {language} in the initial HTML')
                count += 1
        if count < 20:
            self.fail(source, f'only {count} authored translations found; expected prerendered home copy')
        self.checked_copy += count
        bodies = doc.find('tbody', **{'data-role-rows': None})
        rows = [node for body in bodies for node in body.visible_elements() if node.tag == 'tr']
        if len(bodies) != 1 or len(rows) != 6:
            self.fail(source, f'role matrix must contain six initial rows, found {len(rows)}')
        for index, row in enumerate(rows, 1):
            cells = [node for node in row.children if isinstance(node, Element) and node.tag in ('th', 'td')]
            if not cells or not cells[0].text(visible=True):
                self.fail(source, f'role matrix row {index} has an empty role label')
            if len(cells) < 2:
                self.fail(source, f'role matrix row {index} has no skill cells')
        types = set()

        def collect_types(value):
            if isinstance(value, dict):
                kind = value.get('@type', [])
                types.update([kind] if isinstance(kind, str) else kind)
                for child in value.values():
                    collect_types(child)
            elif isinstance(value, list):
                for child in value:
                    collect_types(child)

        for script in doc.find('script', type='application/ld+json'):
            try:
                collect_types(json.loads(script.text()))
            except (ValueError, TypeError) as error:
                self.fail(source, f'invalid JSON-LD: {error}')
        for kind in ('Organization', 'WebSite'):
            if kind not in types:
                self.fail(source, f'missing {kind} JSON-LD')

    def check_language_pairs(self):
        for route in ROUTES:
            pair = [self.document(self.page(language, route)) for language in LANGUAGES]
            for label, read in (
                ('title', lambda doc: ' '.join(node.text() for node in doc.find('title'))),
                ('description', lambda doc: ' '.join(node.attrs.get('content') or ''
                                                     for node in doc.find('meta', name='description'))),
                ('H1', lambda doc: ' '.join(node.text(visible=True)
                                           for node in doc.root.visible_elements() if node.tag == 'h1')),
            ):
                if normalized(read(pair[0])) == normalized(read(pair[1])):
                    self.fail(route or 'home', f'ES and EN initial {label} are identical')
            if not route:
                role_labels = []
                for doc in pair:
                    labels = []
                    for body in doc.find('tbody', **{'data-role-rows': None}):
                        for row in body.visible_elements():
                            if row.tag == 'tr':
                                cells = [child for child in row.children
                                         if isinstance(child, Element) and child.tag in ('th', 'td')]
                                labels.append(cells[0].text(visible=True) if cells else '')
                    role_labels.append(labels)
                for index, (spanish, english) in enumerate(zip(*role_labels), 1):
                    if spanish == english:
                        self.fail('home', f'role label {index} is identical in ES and EN initial HTML')

    def check_sitemap(self):
        source = self.directory / 'sitemap.xml'
        try:
            root = ET.parse(source).getroot()
        except (OSError, ET.ParseError) as error:
            self.fail(source, f'cannot read sitemap: {error}')
            return
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [node.text or '' for node in root.findall('s:url/s:loc', ns)]
        expected = {self.base + language + '/' + route for language in LANGUAGES for route in ROUTES}
        for missing in sorted(expected - set(urls)):
            self.fail(source, f'missing localized URL {missing}')
        for extra in sorted(set(urls) - expected):
            self.fail(source, f'unexpected noncanonical URL {extra}')
        if len(urls) != len(set(urls)):
            self.fail(source, 'duplicate URL entries')

    def check_reference(self, source: Path, value: str):
        value = value.strip()
        if not value:
            return
        url = urlsplit(value)
        if url.scheme and url.scheme not in ('http', 'https'):
            if url.scheme == 'javascript':
                self.fail(source, f'JavaScript URL is not a crawlable local link: {value}')
            return
        base_url = urlsplit(self.base)
        if url.netloc and url.netloc != base_url.netloc:
            return
        source_url = self.base + source.relative_to(self.directory).as_posix()
        target_url = urlsplit(urljoin(source_url, value))
        path = unquote(target_url.path)
        base_path = unquote(base_url.path)
        if not path.startswith(base_path):
            self.fail(source, f'local URL escapes published base path: {value}')
            return
        target = (self.directory / path[len(base_path):]).resolve()
        if not target.is_relative_to(self.directory):
            self.fail(source, f'local reference escapes build: {value}')
            return
        if target.is_dir():
            target /= 'index.html'
        self.checked_references += 1
        if not target.is_file():
            self.fail(source, f'broken local reference: {value}')
        elif target_url.fragment and target.suffix == '.html':
            ids = {node.attrs.get('id') for node in self.document(target).root.elements()}
            if unquote(target_url.fragment) not in ids:
                self.fail(source, f'broken local fragment: {value}')

    def check_references(self):
        for source in sorted(self.directory.rglob('*')):
            if not source.is_file():
                continue
            references = []
            if source.suffix == '.html':
                for node in self.document(source).root.elements():
                    references.extend(node.attrs[key] for key in ('href', 'src', 'poster')
                                      if node.attrs.get(key))
                    srcset = node.attrs.get('srcset') or ''
                    if srcset and not srcset.lstrip().startswith('data:'):
                        references.extend(item.strip().split()[0] for item in srcset.split(',') if item.strip())
                    if node.attrs.get('style'):
                        references.extend(match[1] for match in re.findall(
                            r'url\(\s*([\'"]?)(.*?)\1\s*\)', node.attrs['style'], re.IGNORECASE))
            elif source.suffix == '.css':
                content = re.sub(r'/\*.*?\*/', '', source.read_text(encoding='utf-8'), flags=re.DOTALL)
                references.extend(match[1] for match in re.findall(
                    r'url\(\s*([\'"]?)(.*?)\1\s*\)', content, re.IGNORECASE))
                references.extend(re.findall(r'@import\s+[\'"]([^\'"]+)[\'"]', content, re.IGNORECASE))
            elif source.suffix in ('.js', '.mjs'):
                references.extend(re.findall(r'''["']((?:(?:\.\./)*|\./|/)assets/[^"'\s]+)["']''',
                                             source.read_text(encoding='utf-8')))
            for reference in references:
                self.check_reference(source, reference)

    def run(self) -> int:
        if not self.directory.is_dir():
            self.fail('build', f'directory does not exist: {self.directory}')
        missing = [self.page(language, route) for language in LANGUAGES for route in ROUTES
                   if not self.page(language, route).is_file()]
        for source in missing:
            self.fail(source, 'missing localized HTML route')
        if not missing and self.directory.is_dir():
            english = self.canonical(self.page('en', ''))
            parts = urlsplit(english)
            if parts.scheme != 'https' or not parts.netloc or not parts.path.endswith('/en/') or parts.query or parts.fragment:
                self.fail('en/index.html', 'canonical must be an absolute HTTPS URL ending in /en/')
            else:
                self.base = english[:-3]
                catalog = self.static_catalog()
                for language in LANGUAGES:
                    for route in ROUTES:
                        source = self.page(language, route)
                        self.check_metadata(source, language, route)
                        if not route:
                            self.check_home(source, language, catalog)
                self.check_language_pairs()
                self.check_sitemap()
                self.check_references()
        if self.errors:
            for error in self.errors:
                print(f'FAIL: {error}', file=sys.stderr)
            print(f'Indexing check failed: {len(self.errors)} error(s).', file=sys.stderr)
            return 1
        print(f'PASS: 14 localized routes, reciprocal hreflang, sitemap, home JSON-LD, '
              f'12 role rows, {self.checked_copy} initial translations and '
              f'{self.checked_references} local references.')
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('build_directory', type=Path, help='Production build directory containing en/ and es/.')
    return IndexingCheck(parser.parse_args().build_directory).run()


if __name__ == '__main__':
    raise SystemExit(main())
