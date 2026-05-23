# Release ZIP Contents

This is the minimum file set needed for students to unzip, load the folder in `chrome://extensions`, and use the extension immediately.

## Required Runtime Files

```text
manifest.json
src/
  shared/
    messages.js
  background/
    background.js
  content/
    text-utils.js
    dom-blocks.js
    layout-extractors.js
    content.js
  popup/
    popup.html
    popup.css
    content-scripts.js
    extraction-client.js
    prompt-builder.js
    status.js
    storage.js
    tab-targeting.js
    ui-state.js
    popup.js
```

## Optional User Help Files

Include these if the ZIP should also contain install and troubleshooting instructions:

```text
README.md
docs/
  INSTALL_UNPACKED.md
docs/
  QA.md
```

## Development-Only Files

These are not required for students to run the extension:

```text
.git/
.gitignore
CONTEXT.md
docs/ARCHITECTURE.md
docs/RELEASE_CONTENTS.md
package.json
tests/
```

## Release Readiness Checks

Run these before creating a GitHub Release ZIP:

```powershell
npm run check
npm test
npm run package
```

Then manually verify:

1. Load the release folder in `chrome://extensions`.
2. Open a Quipper quiz page.
3. Click Read.
4. Confirm multiple-choice, short-answer, selected-text, Clear, and copy-prompt flows work.
