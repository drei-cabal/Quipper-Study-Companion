(() => {
  globalThis.QSH = globalThis.QSH || {};

  const { cleanText } = globalThis.QSH.text;
  const TEXT_BLOCK_SELECTOR = [
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

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 0 &&
      rect.height > 0;
  }

  function hasVisibleTextChild(element) {
    return Array.from(element.children).some((child) => {
      if (!isVisible(child)) return false;
      return cleanText(child.innerText || child.textContent || child.getAttribute("aria-label")).length >= 2;
    });
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
    return Array.from(document.body.querySelectorAll(TEXT_BLOCK_SELECTOR))
      .filter((node) => isVisible(node) && !hasVisibleTextChild(node))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          node,
          text: cleanText(node.innerText || node.textContent || node.getAttribute("aria-label")),
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

  function collectVisibleText() {
    const seen = new Set();
    const blocks = [];

    for (const node of document.body.querySelectorAll(TEXT_BLOCK_SELECTOR)) {
      if (!isVisible(node)) continue;

      const text = cleanText(node.innerText || node.textContent || node.getAttribute("aria-label"));
      if (text.length < 2 || text.length > 1200 || seen.has(text)) continue;

      const parentText = cleanText(node.parentElement?.innerText);
      if (parentText && parentText !== text && parentText.length < 1200 && seen.has(parentText)) continue;

      seen.add(text);
      blocks.push(text);

      if (blocks.join("\n").length > 9000) break;
    }

    return blocks.join("\n");
  }

  globalThis.QSH.dom = {
    collectTextBlocks,
    collectVisibleText,
    uniqueByText
  };
})();
