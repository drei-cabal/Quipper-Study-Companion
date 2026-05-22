# Manual QA Checklist

Run this after pulling changes or before sharing the extension with another device.

## Setup

1. Open `chrome://extensions`.
2. Confirm Developer mode is on.
3. Confirm `Quipper Study Helper` is loaded from this project folder.
4. Click Reload on the extension card.

## Read Flow

1. Open a Quipper multiple-choice question.
2. Open the Study Helper side panel.
3. Click Read.
4. Confirm the status says `Read multiple-choice question.`
5. Confirm the detected text includes `Question` and `Choices`.

## Short-Answer Flow

1. Open a Quipper short-answer question.
2. Click Read.
3. Confirm the status says `Read short-answer question.`
4. Confirm the detected text includes `Answer format` and `Short answer`.

## Selection Fallback

1. Select only the visible question text on the Quipper page.
2. Click Read.
3. Confirm the status says `Read selected text.`
4. Confirm only the selected text appears in Detected text.

## Button States

1. Click Clear.
2. Confirm detected text and reasoning are empty.
3. Confirm copy prompt buttons are disabled until detected text exists.
4. Add reasoning text.
5. Confirm `Copy reasoning prompt` enables only when both detected text and reasoning exist.

## Copy Actions

1. Click `Copy raw` and confirm the status says `Copied raw text.`
2. Click `Copy verify prompt` and confirm the status says `Copied verify prompt.`
3. Click a study prompt button and confirm the status says `Copied Prompt`.
