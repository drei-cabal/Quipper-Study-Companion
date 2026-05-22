(() => {
  const MESSAGE_TYPE = "QSH_EXTRACT_TEXT";
  const { cleanText } = globalThis.QSH.text;
  const {
    collectQuestionAndChoicesFromBodyText,
    collectQuestionAndChoicesFromBroadText,
    collectQuestionAndChoicesFromTextFlow,
    collectQuestionAndChoicesFromTwoColumnLayout,
    collectQuestionOnlyFallback,
    collectShortAnswerQuestionFromBodyText
  } = globalThis.QSH.extract;

  function extractVisibleQuestionText() {
    const selection = cleanText(window.getSelection()?.toString());
    if (selection) {
      return {
        questionType: "selected_text",
        text: selection,
        usedSelection: true
      };
    }

    const extractionStrategies = [
      ["multiple_choice", collectQuestionAndChoicesFromBodyText],
      ["short_answer", collectShortAnswerQuestionFromBodyText],
      ["multiple_choice", collectQuestionAndChoicesFromBroadText],
      ["multiple_choice", collectQuestionAndChoicesFromTextFlow],
      ["multiple_choice", collectQuestionAndChoicesFromTwoColumnLayout],
      ["fallback", collectQuestionOnlyFallback]
    ];

    for (const [questionType, extractText] of extractionStrategies) {
      const text = extractText();
      if (text) return { questionType, text, usedSelection: false };
    }

    return { questionType: "none", text: "", usedSelection: false };
  }

  if (globalThis.__QSH_MESSAGE_HANDLER__) {
    chrome.runtime.onMessage.removeListener(globalThis.__QSH_MESSAGE_HANDLER__);
  }

  globalThis.__QSH_MESSAGE_HANDLER__ = (message, _sender, sendResponse) => {
    if (message?.type !== MESSAGE_TYPE) return false;

    sendResponse({
      title: document.title,
      url: window.location.href,
      ...extractVisibleQuestionText()
    });

    return true;
  };

  chrome.runtime.onMessage.addListener(globalThis.__QSH_MESSAGE_HANDLER__);
})();
