# Quipper Study Helper

A Chrome extension that reads visible page text and creates ready-to-paste ChatGPT study prompts. It can also use an optional local API server for direct responses.

## What it does

- Reads selected text or visible text from the active page.
- Opens as a sticky Chrome side panel, so it stays visible while you switch tabs.
- Lets you edit the extracted text before sending it.
- Creates ChatGPT prompts for choice explanations, hints, concept help, reasoning checks, or similar practice.
- Works in hybrid mode with ChatGPT Plus and no API key.
- Optional: direct API mode keeps the OpenAI API key in a local server instead of inside the extension.

## Setup for hybrid mode

1. Open Chrome Extensions:
   - Go to `chrome://extensions`
   - Enable Developer mode
   - Click Load unpacked
   - Select this project folder
   - After code changes, click Reload on the extension card

No API key or local server is needed for hybrid mode.

## Optional API setup

1. Copy `server/.env.example` to `server/.env`.
2. Add your `OPENAI_API_KEY`.
3. Start the local server. Easiest option on Windows:

   ```powershell
   .\start-server.cmd
   ```

   PowerShell option:

   ```powershell
   .\start-server.ps1
   ```

## Usage

1. Open the page with the question.
2. Optionally select just the question and choices.
3. Click the extension icon.
4. Click the read button.
5. Click one of the copy prompt buttons.
6. Paste the copied prompt into ChatGPT Plus.

For direct API responses, open Optional API mode in the popup and choose an API action.

## Notes

- The server defaults to `gpt-5.4-mini`; change `OPENAI_MODEL` in `server/.env` if needed.
- `ENABLE_WEB_SEARCH=true` can be used for source-aware concept verification, but the tutor prompt still blocks final answer selection.
- This is intentionally a learning assistant, not an answer selector.
