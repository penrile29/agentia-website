#!/usr/bin/env python3
"""Check that the public marketing site's robots policy allows every crawler."""

from __future__ import annotations

import argparse
from pathlib import Path
from urllib.robotparser import RobotFileParser


ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://oakbase.ai'
AGENTS = (
    'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
    'Googlebot', 'Google-Extended', 'GoogleOther',
    'bingbot', 'PerplexityBot', 'Perplexity-User', 'Applebot',
    'UnknownMarketingCrawler',
)
PATHS = (
    '/', '/es/', '/en/', '/robots.txt', '/sitemap.xml',
    '/llms.txt', '/llms-full.txt',
    '/v2.js', '/v2.css', '/firm-graph.js', '/firm-layout.js',
    '/assets/favicon.svg', '/assets/firm-knowledge/dm-sans-latin-1.woff2',
)


def check(content: str) -> list[str]:
    """Evaluate access and reject exclusions beyond the representative URL set."""
    errors = []
    directives = []
    for number, raw in enumerate(content.splitlines(), 1):
        line = raw.split('#', 1)[0].strip()
        if not line:
            continue
        if ':' not in line:
            errors.append(f'line {number}: malformed robots directive')
            continue
        key, value = line.split(':', 1)
        key, value = key.strip().lower(), value.strip()
        directives.append((key, value))
        # The policy covers all public paths and agents, including future ones.
        # This catches an exclusion for an unlisted bot or an untested path.
        if key == 'disallow' and value:
            errors.append(f'line {number}: public marketing content must not be excluded ({value})')

    if ('user-agent', '*') not in directives:
        errors.append('missing wildcard user-agent group for unlisted crawlers')
    sitemaps = [value for key, value in directives if key == 'sitemap']
    if sitemaps != [ORIGIN + '/sitemap.xml']:
        errors.append('expected one sitemap pointing to https://oakbase.ai/sitemap.xml')

    policy = RobotFileParser(ORIGIN + '/robots.txt')
    policy.parse(content.splitlines())
    for agent in AGENTS:
        for path in PATHS:
            if not policy.can_fetch(agent, ORIGIN + path):
                errors.append(f'{agent} cannot fetch {path}')
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('robots', nargs='?', type=Path, default=ROOT / 'robots.txt',
                        help='path to source or generated robots.txt')
    args = parser.parse_args()
    try:
        errors = check(args.robots.read_text(encoding='utf-8'))
    except (OSError, UnicodeError) as error:
        raise SystemExit(f'Cannot read robots.txt: {error}') from error
    if errors:
        raise SystemExit('Robots check failed:\n' + '\n'.join(f'- {error}' for error in errors))
    print(f'Robots check passed: {len(AGENTS)} crawlers × {len(PATHS)} public paths; no exclusions; canonical sitemap.')


if __name__ == '__main__':
    main()
