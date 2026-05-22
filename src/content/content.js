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

    return {
      usedSelection: Boolean(selection),
      text: selection ||
        collectQuestionAndChoicesFromBodyText() ||
        collectShortAnswerQuestionFromBodyText() ||
        collectQuestionAndChoicesFromBroadText() ||
        collectQuestionAndChoicesFromTextFlow() ||
        collectQuestionAndChoicesFromTwoColumnLayout() ||
        collectQuestionOnlyFallback()
    };
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
