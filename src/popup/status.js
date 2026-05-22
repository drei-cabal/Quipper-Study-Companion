(() => {
  globalThis.QSH = globalThis.QSH || {};

  const TYPE_LABELS = {
    fallback: "Read question text.",
    multiple_choice: "Read multiple-choice question.",
    selected_text: "Read selected text.",
    short_answer: "Read short-answer question."
  };

  function createStatusController(statusElement) {
    return {
      copiedPrompt() {
        this.set("Copied Prompt");
      },
      copiedRawText() {
        this.set("Copied raw text.");
      },
      copiedVerifyPrompt() {
        this.set("Copied verify prompt.");
      },
      extractionComplete(questionType) {
        this.set(TYPE_LABELS[questionType] || "Read visible question.");
      },
      reading() {
        this.set("Reading visible page text...");
      },
      set(message, isError = false) {
        statusElement.textContent = message;
        statusElement.classList.toggle("error", isError);
      }
    };
  }

  globalThis.QSH.status = {
    createStatusController
  };
})();
