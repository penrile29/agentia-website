#!/usr/bin/env python3
"""Validate the local V2 static website without installing dependencies."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit

from preview_v2 import ROOT, resolve_public_path


class Document(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids: list[str] = []
        self.references: list[tuple[str, str, int]] = []
        self.inline_scripts: list[tuple[str, str, int]] = []
        self.inline_styles: list[str] = []
        self.active_script: tuple[str, int] | None = None
        self.script_parts: list[str] = []
        self.in_style = False
        self.feed(path.read_text(encoding='utf-8'))
        self.close()

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        line = self.getpos()[0]
        for attribute in ('src', 'poster'):
            if attrs.get(attribute):
                self.references.append(('asset', attrs[attribute], line))
        if attrs.get('srcset'):
            # Data URIs do not need file validation. Ordinary local srcsets are
            # comma-separated URLs with optional width/density descriptors.
            if not attrs['srcset'].strip().startswith('data:'):
                for item in attrs['srcset'].split(','):
                    if item.strip():
                        self.references.append(('asset', item.strip().split()[0], line))
        if attrs.get('href'):
            kind = 'link' if tag in ('a', 'area') else 'asset'
            # Canonical URLs identify the eventual page; they do not fetch assets.
            if tag == 'link' and 'canonical' in attrs.get('rel', '').split():
                kind = 'link'
            self.references.append((kind, attrs['href'], line))
        if tag == 'form' and attrs.get('action'):
            self.references.append(('form', attrs['action'], line))
        if attrs.get('style'):
            self.inline_styles.append(attrs['style'])
        if tag == 'script' and not attrs.get('src'):
            script_type = attrs.get('type', '').lower()
            if script_type in ('', 'module', 'text/javascript', 'application/javascript'):
                self.active_script = (script_type, line)
                self.script_parts = []
        if tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag: str) -> None:
        if tag == 'script' and self.active_script:
            script_type, line = self.active_script
            self.inline_scripts.append((''.join(self.script_parts), script_type, line))
            self.active_script = None
            self.script_parts = []
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data: str) -> None:
        if self.active_script:
            self.script_parts.append(data)
        if self.in_style:
            self.inline_styles.append(data)


class Validator:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.documents: dict[Path, Document] = {}
        self.checked_references = 0
        self.checked_scripts = 0

    def fail(self, source: Path, message: str) -> None:
        self.errors.append(f'{source.relative_to(ROOT)}: {message}')

    def document(self, path: Path) -> Document:
        if path not in self.documents:
            self.documents[path] = Document(path)
        return self.documents[path]

    def reference(self, source: Path, kind: str, value: str, line: int = 0) -> None:
        value = value.strip()
        if not value:
            return
        self.checked_references += 1
        parsed = urlsplit(value)
        label = f'line {line}: ' if line else ''
        if parsed.scheme or parsed.netloc:
            if kind == 'link' and parsed.scheme in ('https', 'http', 'mailto', 'tel'):
                return
            if kind == 'asset' and parsed.scheme == 'data':
                return
            self.fail(source, f'{label}external or unsafe {kind} reference: {value}')
            return
        if kind == 'form':
            self.fail(source, f'{label}forms must be handled locally without an action URL')
            return
        if not parsed.path:
            target = source
        else:
            if parsed.path.startswith('/'):
                url_path = parsed.path
            else:
                # Resolve harmless ../ references relative to this public source,
                # then let the server enforce its public path allowlist.
                target_path = (source.parent / unquote(parsed.path)).resolve()
                try:
                    url_path = '/' + target_path.relative_to(ROOT).as_posix()
                except ValueError:
                    self.fail(source, f'{label}reference escapes the website: {value}')
                    return
            try:
                target, _ = resolve_public_path(url_path)
            except (ValueError, OSError) as exc:
                self.fail(source, f'{label}missing or private reference: {value} ({exc})')
                return
        if parsed.fragment and target.suffix.lower() == '.html':
            if unquote(parsed.fragment) not in self.document(target).ids:
                self.fail(source, f'{label}missing fragment target: {value}')

    def css(self, source: Path, content: str) -> None:
        # Strip comments so examples in comments cannot cause false failures.
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        for match in re.finditer(r'url\(\s*([\'"]?)(.*?)\1\s*\)', content, re.IGNORECASE):
            self.reference(source, 'asset', match.group(2))
        for match in re.finditer(r'@import\s+[\'"]([^\'"]+)[\'"]', content, re.IGNORECASE):
            self.reference(source, 'asset', match.group(1))

    def javascript(self, source: Path, node: str, content: str | None = None,
                   script_type: str = '', line: int = 0) -> None:
        self.checked_scripts += 1
        if content is None:
            result = subprocess.run([node, '--check', str(source)], capture_output=True, text=True)
        else:
            with tempfile.TemporaryDirectory(prefix='oakbase-v2-check-') as directory:
                temporary = Path(directory) / ('inline.mjs' if script_type == 'module' else 'inline.js')
                temporary.write_text(content, encoding='utf-8')
                result = subprocess.run([node, '--check', str(temporary)], capture_output=True, text=True)
        if result.returncode:
            label = f'inline script on line {line}: ' if content is not None else ''
            self.fail(source, f'{label}JavaScript syntax error\n{result.stderr.strip()}')

    def run(self) -> int:
        directory = ROOT / 'v2'
        if not (directory / 'index.html').is_file():
            print('FAIL: v2/index.html is missing.', file=sys.stderr)
            return 1
        sources = sorted(path for path in directory.rglob('*') if path.is_file())
        node = shutil.which('node')
        if not node:
            self.errors.append('Node.js is required for JavaScript syntax checks (node --check).')
        for source in sources:
            if source.suffix.lower() == '.html':
                document = self.document(source)
                for identifier, count in Counter(document.ids).items():
                    if count > 1:
                        self.fail(source, f'duplicate id {identifier!r} ({count} occurrences)')
                for kind, value, line in document.references:
                    self.reference(source, kind, value, line)
                for style in document.inline_styles:
                    self.css(source, style)
                if node:
                    for content, script_type, line in document.inline_scripts:
                        self.javascript(source, node, content, script_type, line)
            elif source.suffix.lower() == '.css':
                self.css(source, source.read_text(encoding='utf-8'))
            elif source.suffix.lower() in ('.js', '.mjs') and node:
                self.javascript(source, node)
        if self.errors:
            print('\n'.join(f'FAIL: {error}' for error in self.errors), file=sys.stderr)
            return 1
        print(f'PASS: V2 assets, IDs, fragments, and {self.checked_scripts} JavaScript file(s)/block(s).')
        print(f'Checked {self.checked_references} references across {len(sources)} V2 files.')
        return 0


if __name__ == '__main__':
    raise SystemExit(Validator().run())
