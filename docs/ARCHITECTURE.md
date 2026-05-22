# Architecture

## Main Flow

1. The user opens a Quipper quiz page.
2. The user opens the Study Helper side panel.
3. `src/popup/popup.js` finds the active Quipper tab and sends `QSH_EXTRACT_TEXT`.
4. `src/content/content.js` returns selected text or extracted visible question text.
5. `src/popup/popup.js` stores the last extracted text and copies the selected study prompt.

## Module Responsibilities

### `src/background/background.js`

Owns Chrome side-panel startup behavior. It should stay small and only handle extension-level browser events.

### `src/popup/`

Owns side-panel interaction:

- locating the Quipper tab
- sending extraction messages
- restoring the last extracted text
- validating required text or reasoning
- building safe study prompts
- copying text to the clipboard

It should not parse Quipper page DOM directly.

### `src/content/content.js`

Owns Quipper page extraction:

- selected text has first priority
- multiple-choice pages are read from `Question` and `Select your answer`
- short-answer pages are read from `Question` and `Enter your answer into the box`
- question-only fallback keeps the extension useful when Quipper layout changes

Quipper layout fixes should usually be added here and covered by `tests/content-extraction.test.js`.

### `tests/content-extraction.test.js`

Runs the content script in a small VM-backed Chrome-message fixture. Add cases here when Quipper shows a new question layout.

## Folder Layout

- `src/background/` contains extension-level Chrome event wiring.
- `src/content/` contains Quipper page extraction code.
- `src/popup/` contains the side-panel HTML, CSS, and interaction code.
- `tests/` contains Node-based behavior checks.
- `docs/` contains project architecture notes.

## Device Consistency

Unpacked Chrome extensions do not automatically reload after files change. After pulling updates on any device:

1. Open `chrome://extensions`.
2. Find `Quipper Study Helper`.
3. Click Reload.
4. Reopen the Quipper page or click Read again.

## Removed Server Path

The old local OpenAI server path was removed because the popup no longer has direct API mode. Keeping server files, localhost permissions, and start scripts would make setup look harder than it is and create a false cross-device dependency.
