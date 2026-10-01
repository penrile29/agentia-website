# Oakbase on GitHub Pages

Public website: https://penrile29.github.io/agentia-website/

The authored source lives on `codex/operational-memory-v2`, under `v2/`. GitHub Pages serves the generated files from the root of `gh-pages`. This makes V2 the Pages homepage while keeping the original website and its Hostinger configuration in the source repository unchanged.

## Build

```sh
python3 tools/validate_v2.py
python3 tools/build_pages.py /path/to/an/empty/directory
```

The build publishes the homepage, its `v2.css` and `v2.js`, and six local bilingual policy pages: `/legal/`, `/privacy/`, `/terms/`, `/security/`, `/security/reporting/` and `/subprocessors/`. Their shared stylesheet and language-switching script live in `/legal/`. All published source pages are explicitly listed in `PUBLIC_FILES` in `tools/build_pages.py`; the original root policy pages are retained only in the source repository. Fonts, icons and logos are served locally from `assets/firm-knowledge/` and `assets/favicon.svg`. Older brain scripts, the shared legacy stylesheet, CRM, development notes, local tools and test outputs are excluded. The output has `.nojekyll` and `build-info.json`, which records the source commit.

Local asset paths are rewritten for the GitHub project URL and checked relative to each referring HTML, CSS and JavaScript file, including nested routes, font stylesheets and logos assigned by JavaScript. Directory links resolve to their `index.html`; page fragments are validated. Policy links stay on the same published website; the contact buttons open `hello@oakbase.ai` in the visitor’s email application. Graph data and agent actions are illustrative. The homepage is public and indexable.

Generated HTML versions its `v2.css`, `v2.js`, `legal.css` and `legal.js` URLs with the short source commit, for example `v2.css?v=3632f53`. Each release therefore requests fresh page styles and behavior without changing the published filenames.

The homepage also publishes versioned `i18n.js`, `i18n-static.js` and `i18n-dynamic.js`. Its ES/EN switch translates both page copy and interactive examples without resetting the selected graph or role. The homepage and policy pages share the `oakbase-language` preference; `?lang=es` or `?lang=en` takes precedence over that saved choice, with the browser language used on a first visit.

## Publish

Commit and push `codex/operational-memory-v2` first, then build from that commit into an empty directory. Review the generated website locally. Replace the published files in a checkout of the existing `gh-pages` branch with the generated directory, preserving `.git` and removing obsolete published assets. Commit that update and push `gh-pages` without force.

When copying with rsync, use `rsync -ac --delete --exclude='.git' GENERATED/ PAGES_CHECKOUT/`. The checksum comparison is necessary: same-size files such as `build-info.json` can change within one timestamp interval and otherwise be skipped.

Pages is configured to build `gh-pages` from `/`, with no custom domain. Artifact pushes trigger a new Pages build. Confirm the latest Pages build succeeds and that `https://penrile29.github.io/agentia-website/build-info.json` has the expected source commit. Check the live homepage, loaded assets and section links. The source branch and original Hostinger configuration do not need to be merged or deployed for this publication.

For rollback, restore the desired earlier generated files from `gh-pages` history in a new commit, then push normally. Keep the matching source commit from that release’s `build-info.json` for reproducibility.
