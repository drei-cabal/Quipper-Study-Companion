(() => {
  globalThis.QSH = globalThis.QSH || {};

  function createUiState(elements) {
    function hasQuestionText() {
      return Boolean(elements.questionText.value.trim());
    }

    function hasReasoningText() {
      return Boolean(elements.reasoningText.value.trim());
    }

    function sync() {
      const questionReady = hasQuestionText();
      const reasoningReady = hasReasoningText();

      elements.copyRawTextButton.disabled = !questionReady;
      elements.copyVerifyPromptButton.disabled = !questionReady;
      elements.promptButtons.forEach((button) => {
        button.disabled = !questionReady || (button.dataset.promptMode === "check_reasoning" && !reasoningReady);
      });
    }

    function setLoading(isLoading) {
      elements.readPageButton.disabled = isLoading;
      [
        elements.copyRawTextButton,
        elements.copyVerifyPromptButton,
        ...elements.promptButtons
      ].forEach((button) => {
        button.disabled = isLoading || button.disabled;
      });

      if (!isLoading) sync();
    }

    function clearText() {
      elements.questionText.value = "";
      elements.reasoningText.value = "";
      sync();
    }

    return {
      clearText,
      setLoading,
      sync
    };
  }

  globalThis.QSH.uiState = {
    createUiState
  };
})();
