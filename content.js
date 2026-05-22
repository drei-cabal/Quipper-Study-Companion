(() => {
  const MESSAGE_TYPE = "QSH_EXTRACT_TEXT";
  const RAW_MESSAGE_TYPE = "QSH_EXTRACT_RAW_TEXT";

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function cleanText(value) {
    return value
      .replace(/\s+/g, " ")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  function cleanLines(value) {
    return value
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);
  }

  function hasVisibleTextChild(element) {
    return Array.from(element.children).some((child) => {
      if (!isVisible(child)) return false;
      return cleanText(child.innerText || child.textContent || child.getAttribute("aria-label") || "").length >= 2;
    });
  }

  function isNoiseText(text) {
    return /^(Question|Select your answer\.?|Answer|\d+\s+point|Submit Examination|Home|Course List|To-Dos)$/i.test(text) ||
      /^Question\s+\d+$/i.test(text) ||
      /^Questions:\s*\d+$/i.test(text);
  }

  function uniqueByText(blocks) {
    const seen = new Set();
    return blocks.filter((block) => {
      const key = block.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function collectTextBlocks() {
    const selector = [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "li",
      "label",
      "button",
      "[role='button']",
      "[role='radio']",
      "[role='checkbox']",
      "[aria-label]",
      "div",
      "span"
    ].join(",");

    return Array.from(document.body.querySelectorAll(selector))
      .filter((node) => isVisible(node) && !hasVisibleTextChild(node))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          node,
          text: cleanText(node.innerText || node.textContent || node.getAttribute("aria-label") || ""),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      })
      .filter((block) => block.text.length >= 2 && block.text.length <= 800)
      .sort((a, b) => a.top - b.top || a.left - b.left);
  }

  function pickQuestionLabel(blocks, answerLabel) {
    const labels = blocks.filter((block) => /^Question$/i.test(block.text));
    if (!labels.length) return null;
    if (!answerLabel) return labels[0];

    return labels
      .slice()
      .sort((a, b) => {
        const aDistance = Math.abs(a.top - answerLabel.top) + Math.abs(a.left - Math.min(a.left, answerLabel.left));
        const bDistance = Math.abs(b.top - answerLabel.top) + Math.abs(b.left - Math.min(b.left, answerLabel.left));
        return aDistance - bDistance;
      })[0];
  }

  function collectQuestionAndChoicesFromTextFlow() {
    const lines = collectTextBlocks()
      .map((block) => block.text)
      .filter((text) => text && text.length <= 500);

    const candidates = [];

    for (let answerIndex = 0; answerIndex < lines.length; answerIndex += 1) {
      if (!/^Select your answer\.?$/i.test(lines[answerIndex])) continue;

      let questionIndex = -1;
      for (let index = answerIndex - 1; index >= Math.max(0, answerIndex - 12); index -= 1) {
        if (/^Question$/i.test(lines[index])) {
          questionIndex = index;
          break;
        }
      }

      if (questionIndex === -1) continue;

      const questionLines = lines
        .slice(questionIndex + 1, answerIndex)
        .filter((line) => !isNoiseText(line));

      const choiceLines = [];
      for (let index = answerIndex + 1; index < lines.length && choiceLines.length < 8; index += 1) {
        const line = lines[index];
        if (isNoiseText(line)) break;
        if (/^(Question|Select your answer\.?)$/i.test(line)) break;
        if (line.length > 240) continue;
        choiceLines.push(line);
      }

      if (questionLines.length && choiceLines.length >= 2) {
        candidates.push({ questionLines, choiceLines });
      }
    }

    const candidate = candidates[candidates.length - 1];
    if (!candidate) return "";

    return [
      "Question",
      candidate.questionLines.join("\n"),
      "",
      "Choices",
      ...candidate.choiceLines.map((line, index) => `${String.fromCharCode(65 + index)}. ${line}`)
    ].join("\n");
  }

  function collectQuestionAndChoicesFromBroadText() {
    const broadText = collectVisibleText();
    const lines = cleanLines(broadText);

    const candidates = [];

    for (let questionIndex = 0; questionIndex < lines.length; questionIndex += 1) {
      if (!/^Question$/i.test(lines[questionIndex])) continue;

      let answerIndex = -1;
      for (let index = questionIndex + 1; index < Math.min(lines.length, questionIndex + 8); index += 1) {
        if (/^Select your answer\.?$/i.test(lines[index])) {
          answerIndex = index;
          break;
        }
      }

      if (answerIndex === -1) continue;

      const questionLines = lines
        .slice(questionIndex + 1, answerIndex)
        .filter((line) => !isNoiseText(line));

      const choiceLines = [];
      for (let index = answerIndex + 1; index < lines.length && choiceLines.length < 8; index += 1) {
        const line = lines[index];
        if (/^(Answer|Question|Select your answer\.?|\d+\s+point\s*Answer?)$/i.test(line)) break;
        if (isNoiseText(line)) break;
        if (line.length > 240) continue;
        choiceLines.push(line);
      }

      if (questionLines.length && choiceLines.length >= 2) {
        candidates.push({ questionLines, choiceLines });
      }
    }

    const candidate = candidates[candidates.length - 1];
    if (!candidate) return "";

    return [
      "Question",
      candidate.questionLines.join("\n"),
      "",
      "Choices",
      ...candidate.choiceLines.map((line, index) => `${String.fromCharCode(65 + index)}. ${line}`)
    ].join("\n");
  }

  function collectQuestionAndChoicesFromBodyText() {
    const lines = cleanLines(document.body?.innerText || "");
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
          if (!isNoiseText(lines[scan])) {
            questionLines.push(lines[scan]);
          }
        }
      } else if (/^Question\s+.+/i.test(line) && !/^Question\s+\d+$/i.test(line)) {
        const inlineQuestion = line.replace(/^Question\s+/i, "").trim();
        if (inlineQuestion) questionLines.push(inlineQuestion);

        for (let scan = index + 1; scan < Math.min(lines.length, index + 8); scan += 1) {
          if (/^Select your answer\.?$/i.test(lines[scan])) {
            answerIndex = scan;
            break;
          }
        }
      }

      if (answerIndex === -1 || !questionLines.length) continue;

      const choiceLines = [];
      for (let scan = answerIndex + 1; scan < lines.length && choiceLines.length < 8; scan += 1) {
        const choice = lines[scan];
        if (/^(Answer|Question|Select your answer\.?)$/i.test(choice)) break;
        if (/^\d+\s+point(\s+Answer)?$/i.test(choice)) break;
        if (isNoiseText(choice)) break;
        if (choice.length > 240) continue;
        choiceLines.push(choice);
      }

      if (choiceLines.length >= 2) {
        candidates.push({ questionLines, choiceLines });
      }
    }

    const candidate = candidates[candidates.length - 1];
    if (!candidate) return "";

    return [
      "Question",
      candidate.questionLines.join("\n"),
      "",
      "Choices",
      ...candidate.choiceLines.map((line, index) => `${String.fromCharCode(65 + index)}. ${line}`)
    ].join("\n");
  }

  function collectQuestionAndChoices() {
    const blocks = collectTextBlocks();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;
    const answerLabel = blocks.find((block) => {
      return /^Select your answer\.?$/i.test(block.text) &&
        block.left > viewportWidth * 0.35 &&
        block.top < viewportHeight * 0.35;
    });
    const questionLabel = pickQuestionLabel(blocks, answerLabel);

    if (!questionLabel || !answerLabel) return "";

    const columnGap = Math.max(24, (answerLabel.left - questionLabel.left) * 0.08);
    const questionRightEdge = answerLabel.left - columnGap;
    const contentTop = Math.min(questionLabel.top, answerLabel.top) - 8;
    const contentBottom = Math.min(viewportHeight - 16, Math.max(questionLabel.top, answerLabel.top) + viewportHeight * 0.82);

    const questionBlocks = uniqueByText(
      blocks.filter((block) => {
        if (block === questionLabel || block === answerLabel) return false;
        if (isNoiseText(block.text)) return false;
        if (block.top < questionLabel.bottom - 4 || block.top < contentTop) return false;
        if (block.left < questionLabel.left - 12) return false;
        if (block.left >= questionRightEdge) return false;
        if (block.top > contentBottom) return false;
        if (block.height < 10 || block.height > 220) return false;
        if (block.width < 40 || block.width > Math.max(520, questionRightEdge - questionLabel.left + 80)) return false;
        return true;
      })
    );

    const choiceBlocks = uniqueByText(
      blocks.filter((block) => {
        if (block === questionLabel || block === answerLabel) return false;
        if (isNoiseText(block.text)) return false;
        if (block.top < answerLabel.bottom - 4 || block.top < contentTop) return false;
        if (block.left < answerLabel.left - 12) return false;
        if (block.top > contentBottom) return false;
        if (block.height < 20 || block.height > 180) return false;
        if (block.width < 80 || block.width > Math.max(680, viewportWidth - answerLabel.left + 80)) return false;
        if (block.text.length > 240) return false;
        return true;
      })
    ).slice(0, 8);

    if (!questionBlocks.length || !choiceBlocks.length) return "";

    return [
      "Question",
      questionBlocks.map((block) => block.text).join("\n"),
      "",
      "Choices",
      ...choiceBlocks.map((block, index) => `${String.fromCharCode(65 + index)}. ${block.text}`)
    ].join("\n");
  }

  function collectVisibleText() {
    const selector = [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "li",
      "label",
      "button",
      "[role='button']",
      "[role='radio']",
      "[role='checkbox']",
      "[aria-label]",
      "div",
      "span"
    ].join(",");

    const seen = new Set();
    const blocks = [];
    const nodes = Array.from(document.body.querySelectorAll(selector));

    for (const node of nodes) {
      if (!isVisible(node)) continue;

      const text = cleanText(node.innerText || node.textContent || node.getAttribute("aria-label") || "");
      if (text.length < 2 || text.length > 1200) continue;
      if (seen.has(text)) continue;

      const parentText = cleanText(node.parentElement?.innerText || "");
      if (parentText && parentText !== text && parentText.length < 1200 && seen.has(parentText)) {
        continue;
      }

      seen.add(text);
      blocks.push(text);

      if (blocks.join("\n").length > 9000) break;
    }

    return blocks.join("\n");
  }

  if (globalThis.__QSH_MESSAGE_HANDLER__) {
    chrome.runtime.onMessage.removeListener(globalThis.__QSH_MESSAGE_HANDLER__);
  }

  globalThis.__QSH_MESSAGE_HANDLER__ = (message, _sender, sendResponse) => {
    if (message?.type === RAW_MESSAGE_TYPE) {
      sendResponse({
        title: document.title,
        url: window.location.href,
        text: [
          "BODY INNER TEXT",
          document.body?.innerText || "",
          "",
          "VISIBLE TEXT BLOCKS",
          collectVisibleText()
        ].join("\n")
      });

      return true;
    }

    if (message?.type !== MESSAGE_TYPE) return false;

    const selection = cleanText(window.getSelection()?.toString() || "");
    const visibleText = selection ||
      collectQuestionAndChoicesFromBodyText() ||
      collectQuestionAndChoicesFromBroadText() ||
      collectQuestionAndChoicesFromTextFlow() ||
      collectQuestionAndChoices();

    sendResponse({
      title: document.title,
      url: window.location.href,
      usedSelection: Boolean(selection),
      text: visibleText
    });

    return true;
  };

  chrome.runtime.onMessage.addListener(globalThis.__QSH_MESSAGE_HANDLER__);
})();
