(() => {
  globalThis.QSH = globalThis.QSH || {};

  async function restoreLastQuestion() {
    const saved = await chrome.storage.local.get(["lastQuestionText"]);
    return saved.lastQuestionText || "";
  }

  async function saveLastQuestion(result) {
    await chrome.storage.local.set({
      lastPageTitle: result.title,
      lastPageUrl: result.url,
      lastQuestionText: result.text,
      lastQuestionType: result.questionType
    });
  }

  async function clearLastQuestion() {
    await chrome.storage.local.remove(["lastQuestionText", "lastPageTitle", "lastPageUrl", "lastQuestionType"]);
  }

  globalThis.QSH.storage = {
    clearLastQuestion,
    restoreLastQuestion,
    saveLastQuestion
  };
})();
