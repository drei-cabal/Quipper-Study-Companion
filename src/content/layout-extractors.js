(() => {
  globalThis.QSH = globalThis.QSH || {};

  const { cleanLines, formatChoices, formatQuestion, isNoiseText } = globalThis.QSH.text;
  const { collectTextBlocks, collectVisibleText, uniqueByText } = globalThis.QSH.dom;

  function collectChoiceLines(lines, startIndex) {
    const choices = [];

    for (let index = startIndex; index < lines.length && choices.length < 8; index += 1) {
      const line = lines[index];
      if (/^(Answer|Question|Select your answer\.?|\d+\s+point\s*Answer?)$/i.test(line)) break;
      if (isNoiseText(line) || line.length > 240) continue;
      choices.push(line);
    }

    return choices;
  }

  function findMultipleChoiceCandidate(lines) {
    const candidates = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const questionLines = [];
      let answerIndex = -1;

      if (/^Question$/i.test(line)) {
        for (let scan = index + 1; scan < Math.min(lines.length, index + 12); scan += 1) {
          if (/^Select your answer\.?$/i.test(lines[scan])) {
            answerIndex = scan;
            break;
          }
          if (!isNoiseText(lines[scan])) questionLines.push(lines[scan]);
        }
      } else if (/^Question\s+.+/i.test(line) && !/^Question\s+\d+$/i.test(line)) {
        questionLines.push(line.replace(/^Question\s+/i, "").trim());

        for (let scan = index + 1; scan < Math.min(lines.length, index + 8); scan += 1) {
          if (/^Select your answer\.?$/i.test(lines[scan])) {
            answerIndex = scan;
            break;
          }
        }
      }

      if (answerIndex === -1 || !questionLines.length) continue;

      const choiceLines = collectChoiceLines(lines, answerIndex + 1);
      if (choiceLines.length >= 2) candidates.push({ questionLines, choiceLines });
    }

    return candidates[candidates.length - 1] || null;
  }

  function collectQuestionAndChoicesFromBodyText() {
    const candidate = findMultipleChoiceCandidate(cleanLines(document.body?.innerText));
    return candidate ? formatChoices(candidate.questionLines, candidate.choiceLines) : "";
  }

  function collectQuestionAndChoicesFromBroadText() {
    const candidate = findMultipleChoiceCandidate(cleanLines(collectVisibleText()));
    return candidate ? formatChoices(candidate.questionLines, candidate.choiceLines) : "";
  }

  function collectQuestionAndChoicesFromTextFlow() {
    const lines = collectTextBlocks()
      .map((block) => block.text)
      .filter((text) => text && text.length <= 500);

    const candidate = findMultipleChoiceCandidate(lines);
    return candidate ? formatChoices(candidate.questionLines, candidate.choiceLines) : "";
  }

  function collectShortAnswerQuestionFromBodyText() {
    const lines = cleanLines(document.body?.innerText);
    const candidates = [];

    for (let index = 0; index < lines.length; index += 1) {
      if (!/^Question$/i.test(lines[index])) continue;

      const questionLines = [];
      let hasShortAnswerMarker = false;

      // Short-answer Quipper pages use this marker instead of a choice list.
      for (let scan = index + 1; scan < Math.min(lines.length, index + 14); scan += 1) {
        const line = lines[scan];
        if (/^Enter your answer into the box\.?$/i.test(line)) {
          hasShortAnswerMarker = true;
          break;
        }
        if (!isNoiseText(line)) questionLines.push(line);
      }

      if (hasShortAnswerMarker && questionLines.length) candidates.push({ questionLines });
    }

    const candidate = candidates[candidates.length - 1];
    if (!candidate) return "";

    return [
      formatQuestion(candidate.questionLines),
      "",
      "Answer format",
      "Short answer"
    ].join("\n");
  }

  function collectQuestionOnlyFallback() {
    const lines = cleanLines(document.body?.innerText);
    const questionIndex = lines.findIndex((line) => /^Question$/i.test(line));
    if (questionIndex === -1) return "";

    const questionLines = [];
    for (let scan = questionIndex + 1; scan < Math.min(lines.length, questionIndex + 10); scan += 1) {
      const line = lines[scan];
      if (/^(Select your answer\.?|Enter your answer into the box\.?|Answer)$/i.test(line)) break;
      if (/^\d+\s+point(\s+Answer)?$/i.test(line)) break;
      if (!isNoiseText(line)) questionLines.push(line);
    }

    // This keeps Read useful when Quipper changes labels or hides answer controls.
    return questionLines.length ? formatQuestion(questionLines) : "";
  }

  function collectQuestionAndChoicesFromTwoColumnLayout() {
    const blocks = collectTextBlocks();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;
    const answerLabel = blocks.find((block) => {
      return /^Select your answer\.?$/i.test(block.text) &&
        block.left > viewportWidth * 0.35 &&
        block.top < viewportHeight * 0.35;
    });
    const questionLabel = blocks.find((block) => /^Question$/i.test(block.text));

    if (!questionLabel || !answerLabel) return "";

    const columnGap = Math.max(24, (answerLabel.left - questionLabel.left) * 0.08);
    const questionRightEdge = answerLabel.left - columnGap;
    const contentTop = Math.min(questionLabel.top, answerLabel.top) - 8;
    const contentBottom = Math.min(viewportHeight - 16, Math.max(questionLabel.top, answerLabel.top) + viewportHeight * 0.82);

    const questionBlocks = uniqueByText(blocks.filter((block) => {
      if (block === questionLabel || block === answerLabel || isNoiseText(block.text)) return false;
      if (block.top < questionLabel.bottom - 4 || block.top < contentTop || block.top > contentBottom) return false;
      if (block.left < questionLabel.left - 12 || block.left >= questionRightEdge) return false;
      if (block.height < 10 || block.height > 220) return false;
      return block.width >= 40 && block.width <= Math.max(520, questionRightEdge - questionLabel.left + 80);
    }));

    const choiceBlocks = uniqueByText(blocks.filter((block) => {
      if (block === questionLabel || block === answerLabel || isNoiseText(block.text)) return false;
      if (block.top < answerLabel.bottom - 4 || block.top < contentTop || block.top > contentBottom) return false;
      if (block.left < answerLabel.left - 12 || block.height < 20 || block.height > 180) return false;
      if (block.text.length > 240) return false;
      return block.width >= 80 && block.width <= Math.max(680, viewportWidth - answerLabel.left + 80);
    })).slice(0, 8);

    return questionBlocks.length && choiceBlocks.length
      ? formatChoices(questionBlocks.map((block) => block.text), choiceBlocks.map((block) => block.text))
      : "";
  }

  globalThis.QSH.extract = {
    collectQuestionAndChoicesFromBodyText,
    collectQuestionAndChoicesFromBroadText,
    collectQuestionAndChoicesFromTextFlow,
    collectQuestionAndChoicesFromTwoColumnLayout,
    collectQuestionOnlyFallback,
    collectShortAnswerQuestionFromBodyText
  };
})();
