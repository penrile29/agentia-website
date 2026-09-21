# Oakbase V2 on GitHub Pages

Public preview: https://penrile29.github.io/agentia-website/

The authored source lives on `codex/operational-memory-v2`, under `v2/`. GitHub Pages serves the generated files from the root of `gh-pages`. This makes V2 the Pages homepage while keeping the original website and its Hostinger configuration in the source repository unchanged.

## Build

```sh
python3 tools/validate_v2.py
python3 tools/build_pages.py /path/to/an/empty/directory
```

The build includes only the V2 HTML/CSS/JavaScript, shared stylesheet and public assets. It excludes the CRM, development notes, local tools and test outputs. The output has `.nojekyll` and `build-info.json`, which records the source commit. Local asset paths work under the GitHub project URL; policy and comparison links lead to oakbase.ai. Forms remain simulated and the preview keeps its noindex metadata.

## Publish

Commit and push the source branch first, then build from that commit. Commit the generated directory to `gh-pages` and push that branch. Pages is configured to build `gh-pages` from `/`; subsequent artifact pushes trigger a new Pages build. Confirm the latest Pages build succeeds and that the public `build-info.json` has the expected source commit.

Before this publication, Pages used `codex/agentic-operations-preview` at `/`, with no custom domain. That branch remains available if a rollback is needed.
