# Quipper Study Helper Context

## Purpose

Quipper Study Helper is a Chrome side-panel extension that copies safe study prompts from visible Quipper quiz pages.

It is a prompt-preparation tool, not an answer selector. It should help the student understand the question, hints, concepts, reasoning quality, and similar practice without choosing the final answer.

## Runtime Shape

- `manifest.json` declares the Chrome extension permissions and points Chrome to files under `src/`.
- `src/background/background.js` opens the Chrome side panel from the extension action.
- `src/popup/popup.html`, `src/popup/popup.css`, and `src/popup/popup.js` own the side-panel UI, copied prompt actions, and Chrome tab messaging.
- `src/content/content.js` owns Quipper page extraction. It reads selected text first, then known Quipper question layouts, then a conservative question-only fallback.
- `tests/content-extraction.test.js` protects extraction behavior for short-answer pages and selected text.

## Current Architecture Decisions

- The extension runs without a local server, API key, or database.
- Prompt copying is handled completely in the browser through `navigator.clipboard`.
- The content script should keep Quipper-specific page parsing in one file so layout fixes are localized.
- The popup should not know Quipper DOM details. It should only request extracted text and build safe prompts from it.
- After `git pull`, every device must reload the unpacked extension in `chrome://extensions`.
