(() => {
  globalThis.QSH = globalThis.QSH || {};

  const { EXTRACT_TEXT } = globalThis.QSH.messages;
  const contentScriptFiles = globalThis.QSH.contentScripts;

  async function sendExtractMessage(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: contentScriptFiles
      });
      return await chrome.tabs.sendMessage(tabId, { type: EXTRACT_TEXT });
    } catch (_error) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: contentScriptFiles
      });
      return chrome.tabs.sendMessage(tabId, { type: EXTRACT_TEXT });
    }
  }

  async function readFromTargetTab() {
    const tab = await globalThis.QSH.tabs.getTargetTab();
    return sendExtractMessage(tab.id);
  }

  globalThis.QSH.extractionClient = {
    readFromTargetTab
  };
})();
