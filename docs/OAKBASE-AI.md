# Oakbase production deployment

The public production website is https://oakbase.ai. GitHub Pages remains a separate preview. Both are authored from `v2/` on `codex/operational-memory-v2`.

## Build and publish

1. Validate with `python3 tools/validate_v2.py` and commit the source changes.
2. Run `python3 tools/build_production.py /path/to/empty/output` and `python3 tools/check_indexing.py /path/to/empty/output`. Python 3 and Node.js are required; no packages are installed. The builder includes only explicitly approved public files, sets canonical and social URLs to oakbase.ai, and generates the current sitemap. It preserves `security.txt` and produces current crawler summaries and a branded 404.
3. Copy that output into an isolated checkout of `codex/oakbase-ai-release` using `rsync -ac --delete --exclude='.git' OUTPUT/ RELEASE_CHECKOUT/`, commit and push. This branch contains only the generated public website. Do not copy the source repository into it.
4. In Hostinger VPS `1572557`, project `agentia-website`, deploy `deploy/docker-compose.production.yml`. Set `DOMAIN=oakbase.ai`, `LEGACY_DOMAIN=agentialabs.ai`, `CONTENT_REF` to the full generated release commit, and `CONFIG_REF` to the full source commit recorded in its `build-info.json`.
5. The existing `oakbase-website` nginx container downloads that immutable public archive and the source revision's `deploy/nginx.production.conf`. It checks the source reference and nginx configuration before starting. Existing Traefik network, router, certificate resolver and domains are preserved. No other VPS project or persistent volume is changed.
6. Verify HTTPS, `build-info.json`, all fourteen language routes, local assets, ES/EN, graph, FAQ controls, `robots.txt`, `sitemap.xml`, `security.txt`, www redirects and retired-route redirects. Confirm a missing URL returns a real 404.

## Rollback

Before the first new-brand deployment, the live project used the root `docker-compose.hostinger.yml` with `CONTENT_REF=bf685bfbe2bf58293b0486c7b838f8b3c8ac1ba6`, `DOMAIN=oakbase.ai` and `LEGACY_DOMAIN=agentialabs.ai`. This was read directly from the Hostinger YAML editor on 1 October 2026. Restore that compose file from that revision and those environment values to return to the prior website.

For later releases, keep the same production compose and restore the previous paired `CONTENT_REF` and `CONFIG_REF`. The configuration reference must match the source commit in the selected artifact's `build-info.json`.

## Routes and hosting disclosures

Canonical routes are `/es/` and `/en/`, plus `/legal/`, `/terms/`, `/privacy/`, `/security/`, `/security/reporting/` and `/subprocessors/` under each language prefix. Each version has translated initial HTML, a self canonical and reciprocal es/en/x-default alternates. The sitemap lists these fourteen routes. Root and unprefixed policy URLs permanently redirect to English by default, or Spanish when explicitly requested with `?lang=es`; language is never selected from a crawler’s IP or browser. The interactive language switch uses real links. Shared assets remain at the public root. Retired law-firm, wealth-management, time-capture and industries URLs redirect to the new homepage or the relevant section. Existing legal URLs redirect to their matching localized policy. Static fallback redirect pages also exist in the artifact.

Privacy and provider disclosures distinguish oakbase.ai on Hostinger from the GitHub Pages preview. The contact action opens an email application; it does not submit the legacy contact form.

## Indexing validation

`tools/localize_production.py` renders the existing copy catalogs and role data into both languages during the build. Role skills and the selected role example exist before JavaScript; the runtime restores interactions without duplicating rows. The legal source panels are filtered to one language per generated page. Organization and WebSite JSON-LD identify Oakbase SL using only published facts. `tools/check_indexing.py` checks canonical and language relationships, sitemap coverage, translated initial copy, role rows, structured identity and local references.

Before this indexing release, the rollback pair was `CONTENT_REF=ea8743014b8727491028816d7da25fbb168822a1` and `CONFIG_REF=3b725646552cc4bc4f06b08173fa05344471fdad`.
