# Oakbase production deployment

The public production website is https://oakbase.ai. GitHub Pages remains a separate preview. Both are authored from `v2/` on `codex/operational-memory-v2`.

## Build and publish

1. Validate with `python3 tools/validate_v2.py` and commit the source changes.
2. Run `python3 tools/build_production.py /path/to/empty/output`. The builder includes only explicitly approved public files, sets canonical and social URLs to oakbase.ai, and generates the current sitemap. It preserves `security.txt` and produces current crawler summaries and a branded 404.
3. Copy that output into an isolated checkout of `codex/oakbase-ai-release` using `rsync -ac --delete --exclude='.git' OUTPUT/ RELEASE_CHECKOUT/`, commit and push. This branch contains only the generated public website. Do not copy the source repository into it.
4. In Hostinger VPS `1572557`, project `agentia-website`, deploy `deploy/docker-compose.production.yml`. Set `DOMAIN=oakbase.ai`, `LEGACY_DOMAIN=agentialabs.ai`, `CONTENT_REF` to the full generated release commit, and `CONFIG_REF` to the full source commit recorded in its `build-info.json`.
5. The existing `oakbase-website` nginx container downloads that immutable public archive and the source revision's `deploy/nginx.production.conf`. It checks the source reference and nginx configuration before starting. Existing Traefik network, router, certificate resolver and domains are preserved. No other VPS project or persistent volume is changed.
6. Verify HTTPS, `build-info.json`, all seven current routes, local assets, ES/EN, graph, FAQ controls, `robots.txt`, `sitemap.xml`, `security.txt`, www redirects and retired-route redirects. Confirm a missing URL returns a real 404.

## Rollback

Before the first new-brand deployment, the live project used the root `docker-compose.hostinger.yml` with `CONTENT_REF=bf685bfbe2bf58293b0486c7b838f8b3c8ac1ba6`, `DOMAIN=oakbase.ai` and `LEGACY_DOMAIN=agentialabs.ai`. This was read directly from the Hostinger YAML editor on 1 October 2026. Restore that compose file from that revision and those environment values to return to the prior website.

For later releases, keep the same production compose and restore the previous paired `CONTENT_REF` and `CONFIG_REF`. The configuration reference must match the source commit in the selected artifact's `build-info.json`.

## Routes and hosting disclosures

Current routes are `/`, `/legal/`, `/terms/`, `/privacy/`, `/security/`, `/security/reporting/` and `/subprocessors/`. Retired law-firm, wealth-management, time-capture and industries URLs redirect to the new homepage or the relevant section. Existing legal URLs remain available.

Privacy and provider disclosures distinguish oakbase.ai on Hostinger from the GitHub Pages preview. The contact action opens an email application; it does not submit the legacy contact form.
