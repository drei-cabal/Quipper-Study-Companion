const MESSAGE_TYPE = "QSH_EXTRACT_TEXT";

const readPageButton = document.querySelector("#readPage");
const pageStatus = document.querySelector("#pageStatus");
const questionText = document.querySelector("#questionText");
const reasoningText = document.querySelector("#reasoningText");
const copyRawTextButton = document.querySelector("#copyRawText");
const copyVerifyPromptButton = document.querySelector("#copyVerifyPrompt");
const promptButtons = Array.from(document.querySelectorAll("[data-prompt-mode]"));
const CONTENT_SCRIPT_FILES = [
  "src/content/text-utils.js",
  "src/content/dom-blocks.js",
  "src/content/layout-extractors.js",
  "src/content/content.js"
];

const MODE_INSTRUCTIONS = {
  explain_choices:
    "Explain the question and each answer choice. For each choice, explain what would make it plausible and what I should verify. Do not rank choices, eliminate down to one, or reveal a final option.",
  hint:
    "Give one or two useful hints that help me decide independently. Do not discuss which option is best.",
  concept:
    "Identify the underlying concept, summarize the relevant rule or idea, and give a compact worked example that is not the same as my question.",
  check_reasoning:
    "Evaluate my reasoning for soundness. Point out strong steps and gaps. Do not state the final answer label; if my reasoning arrives at a choice, focus on whether the reasoning is justified.",
  practice:
    "Create one similar practice question with choices, but do not solve it. Include a short hint after the choices."
};

function setStatus(message, isError = false) {
  pageStatus.textContent = message;
  pageStatus.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  readPageButton.disabled = isLoading;
  // Disable prompt buttons while page extraction is running to avoid stale text copies.
  promptButtons.forEach((button) => {
    button.disabled = isLoading;
  });
}

function isQuipperUrl(url) {
  try {
    return new URL(url).hostname.endsWith("quipper.com");
  } catch (_error) {
    return false;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }
  return tab;
}

async function getTargetTab() {
  const activeTab = await getActiveTab();
  if (isQuipperUrl(activeTab.url)) {
    return activeTab;
  }

  const currentWindowQuipperTabs = await chrome.tabs.query({
    currentWindow: true,
    url: ["https://*.quipper.com/*"]
  });

  if (currentWindowQuipperTabs.length) {
    return currentWindowQuipperTabs[currentWindowQuipperTabs.length - 1];
  }

  const anyQuipperTabs = await chrome.tabs.query({
    url: ["https://*.quipper.com/*"]
  });

  if (anyQuipperTabs.length) {
    return anyQuipperTabs[anyQuipperTabs.length - 1];
  }

  throw new Error("Open a Quipper question tab first, then click Read.");
}

async function sendExtractMessage(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPT_FILES
    });
    return await chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPE });
  } catch (_error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPT_FILES
    });
    return chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPE });
  }
}

async function readPage() {
  setLoading(true);
  setStatus("Reading visible page text...");

  try {
    const tab = await getTargetTab();
    const result = await sendExtractMessage(tab.id);

    if (!result?.text) {
      throw new Error("Could not read the visible question. Select the question text, then click Read.");
    }

    questionText.value = result.text;
    await chrome.storage.local.set({
      lastQuestionText: result.text,
      lastPageUrl: result.url,
      lastPageTitle: result.title,
      lastQuipperTabId: tab.id
    });

    setStatus(result.usedSelection ? "Read selected text from the Quipper tab." : "Read visible text from the Quipper tab.");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}

function buildChatGptPrompt(mode, text, reasoning) {
  return [
    "You are my study tutor. Help me learn from this quiz/mock-test item.",
    "",
    "Important rules:",
    "- Do not provide the final selected answer, answer letter, answer number, or direct instruction to choose a specific option.",
    "- Do not rank choices from best to worst.",
    "- Do not eliminate choices so aggressively that only one option remains.",
    "- Explain concepts, wording, and reasoning so I can decide independently.",
    "",
    `Task: ${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.explain_choices}`,
    "",
    "Question or page text:",
    text,
    reasoning ? `\nMy attempt or reasoning:\n${reasoning}` : ""
  ].filter(Boolean).join("\n");
}

async function copyChatGptPrompt(mode) {
  const text = questionText.value.trim();
  const reasoning = reasoningText.value.trim();

  if (!text) {
    setStatus("Add or read question text first.", true);
    return;
  }

  if (mode === "check_reasoning" && !reasoning) {
    setStatus("Add your attempt before copying a reasoning prompt.", true);
    return;
  }

  const prompt = buildChatGptPrompt(mode, text, reasoning);
  await navigator.clipboard.writeText(prompt);
  setStatus("Copied Prompt");
}

async function restoreLastText() {
  const saved = await chrome.storage.local.get(["lastQuestionText"]);
  if (saved.lastQuestionText) {
    questionText.value = saved.lastQuestionText;
  }
}

readPageButton.addEventListener("click", readPage);
copyRawTextButton.addEventListener("click", async () => {
  const text = questionText.value.trim();
  if (!text) {
    setStatus("No detected text to copy yet.", true);
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus("Copied raw detected text.");
});
copyVerifyPromptButton.addEventListener("click", async () => {
  const text = questionText.value.trim();
  if (!text) {
    setStatus("No detected text to copy yet.", true);
    return;
  }

  const prompt = [
    "Check this quiz/mock-test item carefully.",
    "Explain the relevant concept and reasoning, but do not provide the final answer letter, answer number, or direct instruction to choose a specific option.",
    "Point out what I should verify before deciding.",
    "",
    text
  ].join("\n");

  await navigator.clipboard.writeText(prompt);
  setStatus("Copied verification prompt.");
});
promptButtons.forEach((button) => {
  button.addEventListener("click", () => copyChatGptPrompt(button.dataset.promptMode));
});

restoreLastText();
