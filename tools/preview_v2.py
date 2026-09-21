#!/usr/bin/env python3
"""Read-only, loopback-only preview of the current Oakbase site and /v2/."""

from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIRECTORIES = frozenset({
    "assets", "v2", "legal", "law-firms", "operations", "privacy",
    "security", "subprocessors", "terms", "wealth-management",
})
PUBLIC_ROOT_FILES = frozenset({
    "index.html", "404.html", "industries.html", "agentic.css",
    "commercial.css", "styles.css", "site.js", "robots.txt", "sitemap.xml",
    "llms.txt", "llms-full.txt",
})
PUBLIC_EXTENSIONS = frozenset({
    ".html", ".css", ".js", ".mjs", ".svg", ".png", ".jpg", ".jpeg", ".gif",
    ".webp", ".avif", ".ico", ".woff", ".woff2", ".ttf", ".otf",
    ".webm", ".mp4", ".txt", ".xml",
})
BLOCKED_SEGMENTS = frozenset({
    "crm", "tools", "node_modules", "secrets", "secret", "env",
    "credentials", "credential", "passwords", "password",
})
CSP = "; ".join([
    "default-src 'self'", "connect-src 'none'", "form-action 'none'",
    "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:", "img-src 'self' data:",
    "object-src 'none'", "frame-src 'none'", "frame-ancestors 'none'",
    "base-uri 'none'", "worker-src 'none'",
])

# Inserted only into response bytes; the current site's files remain unchanged.
# Install the capture handler before the original page's scripts run.
LEGACY_GUARD = """<script data-local-preview-guard>
(() => {
  const message = 'Local preview only. This form has not sent any information.';
  function announce() {
    let notice = document.getElementById('oakbase-local-preview-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'oakbase-local-preview-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483647;padding:14px 18px;background:#173b31;color:#fff;border-radius:8px;font:14px/1.5 system-ui;box-shadow:0 4px 20px #0002';
      document.body.appendChild(notice);
    }
    notice.textContent = message;
  }
  document.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    announce();
  }, true);
  HTMLFormElement.prototype.submit = announce;
  HTMLFormElement.prototype.requestSubmit = announce;
  document.addEventListener('DOMContentLoaded', () => {
    const badge = document.createElement('a');
    badge.id = 'oakbase-local-preview-badge';
    badge.href = '/v2/';
    badge.textContent = 'LOCAL PREVIEW · Forms disabled · View V2 →';
    badge.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:2147483646;padding:9px 13px;background:#173b31;color:#fff;border:1px solid #ffffff50;border-radius:6px;font:11px/1.4 system-ui;text-decoration:none;box-shadow:0 3px 14px #0002';
    document.body.appendChild(badge);
  });
})();
</script>"""


def is_public_path(relative: Path) -> bool:
    parts = relative.parts
    if not parts or any(
        part.startswith('.') or part.lower() in BLOCKED_SEGMENTS
        or Path(part).stem.lower() in BLOCKED_SEGMENTS for part in parts
    ):
        return False
    if relative.suffix.lower() not in PUBLIC_EXTENSIONS:
        return False
    return (len(parts) == 1 and parts[0] in PUBLIC_ROOT_FILES) or (
        len(parts) > 1 and parts[0] in PUBLIC_DIRECTORIES
    )


def resolve_public_path(request_path: str, root: Path = ROOT) -> tuple[Path, str]:
    """Resolve a URL without ever exposing private files or listing a directory."""
    parsed = urlsplit(request_path)
    if parsed.scheme or parsed.netloc:
        raise ValueError('Absolute request URLs are not supported')
    decoded = unquote(parsed.path, errors='strict')
    if not decoded.startswith('/') or any(char in decoded for char in ('\\', '\x00', '%')):
        raise ValueError('Invalid path')
    if any(part in ('.', '..') for part in decoded.split('/')):
        raise ValueError('Path traversal is not allowed')
    relative = Path(decoded.lstrip('/') or 'index.html')
    candidate = root / relative
    if candidate.is_dir():
        candidate = candidate / 'index.html'
        relative = relative / 'index.html'
    if not is_public_path(relative):
        raise PermissionError('Not a public website asset')
    resolved = candidate.resolve()
    try:
        resolved_relative = resolved.relative_to(root.resolve())
    except ValueError as exc:
        raise PermissionError('Symlink escape is not allowed') from exc
    if not is_public_path(resolved_relative):
        raise PermissionError('Symlink target is not a public website asset')
    if not resolved.is_file():
        raise FileNotFoundError('Public asset does not exist')
    return resolved, relative.as_posix()


def inject_legacy_guard(content: bytes) -> bytes:
    source = content.decode('utf-8')
    head = re.search(r'<head\b[^>]*>', source, flags=re.IGNORECASE)
    if head:
        source = source[:head.end()] + LEGACY_GUARD + source[head.end():]
    else:
        source = LEGACY_GUARD + source
    return source.encode('utf-8')


class PreviewHandler(BaseHTTPRequestHandler):
    server_version = 'OakbaseLocalPreview/1.0'

    def end_headers(self) -> None:
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def do_GET(self) -> None:
        self.serve_public_file(head_only=False)

    def do_HEAD(self) -> None:
        self.serve_public_file(head_only=True)

    def serve_public_file(self, head_only: bool) -> None:
        # Reject foreign Host headers to avoid using this loopback server through
        # DNS rebinding. No wildcard interface or hostname is accepted.
        expected_hosts = {'127.0.0.1', 'localhost'}
        host = self.headers.get('Host', '').lower()
        if host not in expected_hosts and host not in {
            f'{name}:{self.server.server_port}' for name in expected_hosts
        }:
            self.send_error(403, 'This preview accepts localhost requests only')
            return
        try:
            path, relative = resolve_public_path(self.path)
            parsed = urlsplit(self.path)
            if not parsed.path.endswith('/') and relative.endswith('/index.html') \
                    and not parsed.path.endswith('/index.html'):
                self.send_response(308)
                location = parsed.path + '/' + (('?' + parsed.query) if parsed.query else '')
                self.send_header('Location', location)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return
            content = path.read_bytes()
            if path.suffix.lower() == '.html' and not relative.startswith('v2/'):
                content = inject_legacy_guard(content)
        except (ValueError, UnicodeError):
            self.send_error(400, 'Invalid path')
            return
        except PermissionError:
            self.send_error(403, 'Not a public website asset')
            return
        except (FileNotFoundError, IsADirectoryError):
            self.send_error(404, 'Public asset not found')
            return
        content_type = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        if path.suffix.lower() in ('.js', '.mjs'):
            content_type = 'text/javascript'
        if content_type.startswith('text/') or content_type == 'image/svg+xml':
            content_type += '; charset=utf-8'
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        if not head_only:
            self.wfile.write(content)

    def reject_method(self) -> None:
        self.send_response(405)
        self.send_header('Allow', 'GET, HEAD')
        self.send_header('Content-Length', '0')
        self.end_headers()

    do_POST = do_PUT = do_PATCH = do_DELETE = do_OPTIONS = do_TRACE = do_CONNECT = reject_method


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4176, help='Loopback port (default: 4176)')
    arguments = parser.parse_args()
    if not 1 <= arguments.port <= 65535:
        parser.error('--port must be between 1 and 65535')
    with ThreadingHTTPServer(('127.0.0.1', arguments.port), PreviewHandler) as server:
        print(f'Current site: http://127.0.0.1:{arguments.port}/', flush=True)
        print(f'New homepage: http://127.0.0.1:{arguments.port}/v2/', flush=True)
        print('Local preview only. Outbound connections and form submission are disabled.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nLocal preview stopped.', flush=True)


if __name__ == '__main__':
    main()
