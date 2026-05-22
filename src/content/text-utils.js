(() => {
  globalThis.QSH = globalThis.QSH || {};

  const NOISE_TEXT_PATTERN =
    /^(Question|Select your answer\.?|Enter your answer into the box\.?|Answer|\d+\s+point|Submit Examination|Home|Course List|To-Dos)$/i;

  function cleanText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);
  }

  function isNoiseText(text) {
    return NOISE_TEXT_PATTERN.test(text) ||
      /^Question\s+\d+$/i.test(text) ||
      /^Questions:\s*\d+$/i.test(text);
  }

  function formatQuestion(questionLines) {
    return ["Question", questionLines.join("\n")].join("\n");
  }

  function formatChoices(questionLines, choiceLines) {
    return [
      formatQuestion(questionLines),
      "",
      "Choices",
      ...choiceLines.map((line, index) => `${String.fromCharCode(65 + index)}. ${line}`)
    ].join("\n");
  }

  globalThis.QSH.text = {
    cleanLines,
    cleanText,
    formatChoices,
    formatQuestion,
    isNoiseText
  };
})();
