(() => {
  const elements = {
    clearTextButton: document.querySelector("#clearText"),
    copyRawTextButton: document.querySelector("#copyRawText"),
    copyVerifyPromptButton: document.querySelector("#copyVerifyPrompt"),
    pageStatus: document.querySelector("#pageStatus"),
    promptButtons: Array.from(document.querySelectorAll("[data-prompt-mode]")),
    questionText: document.querySelector("#questionText"),
    readPageButton: document.querySelector("#readPage"),
    reasoningText: document.querySelector("#reasoningText")
  };

  const status = globalThis.QSH.status.createStatusController(elements.pageStatus);
  const uiState = globalThis.QSH.uiState.createUiState(elements);

  async function readPage() {
    uiState.setLoading(true);
    status.reading();

    try {
      const result = await globalThis.QSH.extractionClient.readFromTargetTab();
      if (!result?.text) {
        throw new Error("Could not read the visible question. Select the question text, then click Read.");
      }

      elements.questionText.value = result.text;
      await globalThis.QSH.storage.saveLastQuestion(result);
      status.extractionComplete(result.questionType);
    } catch (error) {
      status.set(error.message, true);
    } finally {
      uiState.setLoading(false);
    }
  }

  async function copyRawText() {
    const text = elements.questionText.value.trim();
    if (!text) return status.set("Add or read question text first.", true);

    await navigator.clipboard.writeText(text);
    status.copiedRawText();
  }

  async function copyVerifyPrompt() {
    const text = elements.questionText.value.trim();
    if (!text) return status.set("Add or read question text first.", true);

    await navigator.clipboard.writeText(globalThis.QSH.prompts.buildVerifyPrompt(text));
    status.copiedVerifyPrompt();
  }

  async function copyStudyPrompt(mode) {
    const text = elements.questionText.value.trim();
    const reasoning = elements.reasoningText.value.trim();

    if (!text) return status.set("Add or read question text first.", true);
    if (mode === "check_reasoning" && !reasoning) {
      return status.set("Add your attempt before copying a reasoning prompt.", true);
    }

    const prompt = globalThis.QSH.prompts.buildStudyPrompt(mode, text, reasoning);
    await navigator.clipboard.writeText(prompt);
    status.copiedPrompt();
  }

  async function clearText() {
    uiState.clearText();
    await globalThis.QSH.storage.clearLastQuestion();
    status.set("Cleared text.");
  }

  async function restoreLastText() {
    elements.questionText.value = await globalThis.QSH.storage.restoreLastQuestion();
    uiState.sync();
  }

  elements.readPageButton.addEventListener("click", readPage);
  elements.copyRawTextButton.addEventListener("click", copyRawText);
  elements.copyVerifyPromptButton.addEventListener("click", copyVerifyPrompt);
  elements.clearTextButton.addEventListener("click", clearText);
  elements.questionText.addEventListener("input", uiState.sync);
  elements.reasoningText.addEventListener("input", uiState.sync);
  elements.promptButtons.forEach((button) => {
    button.addEventListener("click", () => copyStudyPrompt(button.dataset.promptMode));
  });

  restoreLastText();
})();
