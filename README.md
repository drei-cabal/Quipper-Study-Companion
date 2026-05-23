# Quipper Study Helper

A Chrome extension that reads visible page text and creates ready-to-paste ChatGPT study prompts.

## What it does

- Reads selected text or visible text from the active page.
- Opens as a sticky Chrome side panel, so it stays visible while you switch tabs.
- Lets you edit the extracted text before sending it.
- Creates ChatGPT prompts for choice explanations, hints, concept help, reasoning checks, or similar practice.
- Works in hybrid mode with ChatGPT Plus and no API key.

## Setup for hybrid mode

1. Open Chrome Extensions:
   - Go to `chrome://extensions`
   - Enable Developer mode
   - Click Load unpacked
   - Select this project folder
   - After code changes, click Reload on the extension card

No API key or local server is needed for hybrid mode.

## Updating on another device

1. Pull the latest repo files.
2. Open `chrome://extensions`.
3. Click Reload on the `Quipper Study Helper` extension card.
4. Open a Quipper quiz page and click Read.

Chrome does not reload unpacked extension code automatically after `git pull`, so step 3 is required on every device after code changes.

## Usage

1. Open the page with the question.
2. Optionally select just the question and choices.
3. Click the extension icon.
4. Click the read button.
5. Click one of the copy prompt buttons.
6. Paste the copied prompt into ChatGPT Plus.

## Notes

- Read supports multiple-choice questions and short-answer questions that show `Enter your answer into the box`.
- If Quipper changes the page layout, select the visible question text first, then click Read.
- This is intentionally a learning assistant, not an answer selector.

## Project docs

- `CONTEXT.md` explains the project purpose and current architecture decisions.
- `docs/ARCHITECTURE.md` explains the extension flow and where future fixes should go.
- `docs/INSTALL_UNPACKED.md` explains how students install the GitHub Release ZIP.
- `docs/QA.md` provides the manual browser checklist before sharing changes.
- `docs/RELEASE_CONTENTS.md` lists the files needed in a student-ready release ZIP.

## Folder layout

- `src/background/` contains Chrome extension event wiring.
- `src/content/` contains text utilities, DOM block readers, layout extractors, and the content message handler.
- `src/popup/` contains the side-panel UI.
- `src/shared/` contains constants shared by extension contexts.
- `tests/` contains extraction behavior tests.
