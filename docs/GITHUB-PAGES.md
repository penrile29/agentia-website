# Oakbase on GitHub Pages

Public website: https://penrile29.github.io/agentia-website/

The authored source lives on `codex/operational-memory-v2`, under `v2/`. GitHub Pages serves the generated files from the root of `gh-pages`. This makes V2 the Pages homepage while keeping the original website and its Hostinger configuration in the source repository unchanged.

## Build

```sh
python3 tools/validate_v2.py
python3 tools/build_pages.py /path/to/an/empty/directory
```

The build publishes exactly `v2/index.html`, `v2/v2.css`, `v2/v2.js`, `assets/firm-knowledge/` and `assets/favicon.svg`. Fonts, icons and logos are served locally. Older brain scripts, the shared stylesheet, CRM, development notes, local tools and test outputs are excluded. The output has `.nojekyll` and `build-info.json`, which records the source commit.

Local asset paths are rewritten for the GitHub project URL and checked in HTML, CSS and JavaScript, including logos assigned by JavaScript. Policy links lead to oakbase.ai; the contact buttons open `hello@oakbase.ai` in the visitor’s email application. Graph data and agent actions are illustrative. The homepage is public and indexable.

The generated homepage versions its `v2.css` and `v2.js` URLs with the short source commit, for example `v2.css?v=3632f53`. Each release therefore requests fresh page styles and behavior without changing the published filenames.

## Publish

Commit and push `codex/operational-memory-v2` first, then build from that commit into an empty directory. Review the generated website locally. Replace the published files in a checkout of the existing `gh-pages` branch with the generated directory, preserving `.git` and removing obsolete published assets. Commit that update and push `gh-pages` without force.

Pages is configured to build `gh-pages` from `/`, with no custom domain. Artifact pushes trigger a new Pages build. Confirm the latest Pages build succeeds and that `https://penrile29.github.io/agentia-website/build-info.json` has the expected source commit. Check the live homepage, loaded assets and section links. The source branch and original Hostinger configuration do not need to be merged or deployed for this publication.

For rollback, restore the desired earlier generated files from `gh-pages` history in a new commit, then push normally. Keep the matching source commit from that release’s `build-info.json` for reproducibility.
