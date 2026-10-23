#!/usr/bin/env bash
# Publish the generated V2 + graph extension only under /v3/.
set -euo pipefail

mode="${1:---dry-run}"
case "$mode" in
  --dry-run|--publish) ;;
  *) printf 'Usage: %s [--dry-run|--publish]\n' "$0" >&2; exit 2 ;;
esac
if [[ $# -gt 1 ]]; then
  printf 'Only one mode argument is accepted.\n' >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$(cd -- "$script_dir/.." && pwd)"
repository_url='https://github.com/penrile29/agentia-website.git'
preview_url='https://penrile29.github.io/agentia-website/v3/'
for executable in python3 node git; do
  command -v "$executable" >/dev/null || {
    printf 'Missing required command: %s\n' "$executable" >&2
    exit 1
  }
done

python3 "$script_dir/build.py"
staging_dir="$(mktemp -d "${TMPDIR:-/tmp}/oakbase-graph-pages.XXXXXX")"
trap 'rm -rf -- "$staging_dir"' EXIT
checkout_dir="$staging_dir/pages"
git clone --quiet --depth 1 --single-branch --branch gh-pages "$repository_url" "$checkout_dir"
baseline_commit="$(git -C "$checkout_dir" rev-parse HEAD)"

python3 - "$source_dir" "$checkout_dir" <<'PY'
from hashlib import sha256
from html.parser import HTMLParser
import importlib.util
from pathlib import Path
import os
import shutil
import stat
import subprocess
import sys

source, checkout = map(lambda value: Path(value).resolve(), sys.argv[1:])
artifact = source / 'dist'
spec = importlib.util.spec_from_file_location('v2_pages', source.parent / 'tools/build_pages.py')
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)
public_assets = {
    'ASSET-SOURCES.md', 'LICENSE-dashboard-icons', 'LICENSE-gilbarbara-logos',
    'LICENSE-lobehub-icons', 'LICENSE-lucide', 'OFL-DM-Sans.txt',
    'calendar.svg', 'chatgpt.svg', 'claude.svg', 'clio.svg', 'copilot.svg',
    'dm-sans-latin-1.woff2', 'dm-sans.css', 'dynamics.svg', 'gmail.svg',
    'hubspot.svg', 'lucide-0.468.0.min.js', 'onenote.svg', 'outlook.svg',
    'salesforce.svg', 'slack.svg', 'teams.svg', 'whatsapp.svg',
}
public_files = set(pages.PUBLIC_FILES) | {
    '.nojekyll', 'build-info.json', 'robots.txt', 'assets/favicon.svg',
    'es/index.html', 'graph-story.css', 'graph-story.js',
} | {f'assets/firm-knowledge/{name}' for name in public_assets}

def fingerprint(root):
    result = {}
    for folder, directories, filenames in os.walk(root, followlinks=False):
        parent = Path(folder)
        if parent == root:
            directories[:] = [name for name in directories if name not in {'.git', 'v3'}]
            filenames = [name for name in filenames if name not in {'.git', 'v3'}]
        for name in list(directories) + filenames:
            path = parent / name
            relative = path.relative_to(root).as_posix()
            mode = stat.S_IMODE(path.lstat().st_mode)
            if path.is_symlink():
                result[relative] = ('link', mode, os.readlink(path))
            elif path.is_file():
                result[relative] = ('file', mode, sha256(path.read_bytes()).hexdigest())
            elif path.is_dir():
                result[relative] = ('directory', mode)
            else:
                raise SystemExit(f'Unsupported published filesystem entry: {relative}')
    return result

if artifact.is_symlink():
    raise SystemExit('Artifact must not be a symlink.')
entries = list(artifact.rglob('*'))
if any(path.is_symlink() for path in entries):
    raise SystemExit('Public artifact contains symlinks.')
actual = {path.relative_to(artifact).as_posix() for path in entries if path.is_file()}
if actual != public_files:
    raise SystemExit(f'Public allowlist mismatch: extra={sorted(actual-public_files)}, missing={sorted(public_files-actual)}')

class PreviewMetadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.noindex = False
        self.feed(text)
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.noindex = 'noindex' in attrs.get('content', '').lower()

for page in artifact.rglob('*.html'):
    if not PreviewMetadata(page.read_text()).noindex:
        raise SystemExit(f'Preview is missing noindex: {page.relative_to(artifact)}')
for script in artifact.rglob('*.js'):
    subprocess.run(['node', '--check', str(script)], check=True)
references = pages.validate_references(artifact)

before = fingerprint(checkout)
destination = checkout / 'v3'
if destination.is_symlink() or destination.is_file():
    destination.unlink()
elif destination.exists():
    shutil.rmtree(destination)
destination.mkdir()
for relative in sorted(public_files):
    target = destination / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(artifact / relative, target)
    target.chmod(0o644)
if fingerprint(checkout) != before:
    raise SystemExit('Refusing publication: an existing path outside /v3/ changed.')
pages.validate_references(destination)
print(f'Validated {len(public_files)} public files and {references} references.')
print(f'Preserved {len(before)} existing non-V3 filesystem entries byte-identically.')
PY

git -C "$checkout_dir" add -- v3
# Preserve the upstream font licence byte-for-byte, including its CRLF whitespace.
git -C "$checkout_dir" diff --cached --check -- . ':(exclude)v3/assets/firm-knowledge/OFL-DM-Sans.txt'
python3 - "$checkout_dir" <<'PY'
import subprocess
import sys
changes = subprocess.check_output(['git', '-C', sys.argv[1], 'diff', '--cached', '--name-only', '-z']).split(b'\0')
if any(path and not path.startswith(b'v3/') for path in changes):
    raise SystemExit('Refusing publication: staged changes outside /v3/.')
PY
git -C "$checkout_dir" diff --cached --stat

if git -C "$checkout_dir" diff --cached --quiet; then
  printf 'The graph preview already matches the published artifact.\n%s\n' "$preview_url"
  exit 0
fi
if [[ "$mode" == '--dry-run' ]]; then
  printf '\nDry run passed. No commit or push performed.\n'
  printf 'Publish with: %s --publish\nDestination: %s\n' "$0" "$preview_url"
  exit 0
fi

# No force: reject concurrent changes to gh-pages instead of overwriting them.
git -C "$checkout_dir" commit -m 'Remove the upper title bars from the graph experience'
git -C "$checkout_dir" push origin HEAD:gh-pages
printf '\nPublished only /v3/. Previous gh-pages commit: %s\n' "$baseline_commit"
printf 'Preview after Pages rebuild: %s?lang=es#platform\n' "$preview_url"
printf 'Inspect build: gh api repos/penrile29/agentia-website/pages/builds/latest\n'
