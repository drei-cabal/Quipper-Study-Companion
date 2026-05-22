(() => {
  globalThis.QSH = globalThis.QSH || {};

  function isQuipperUrl(url) {
    try {
      return new URL(url).hostname.endsWith("quipper.com");
    } catch (_error) {
      return false;
    }
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab found.");
    return tab;
  }

  async function getTargetTab() {
    const activeTab = await getActiveTab();
    if (isQuipperUrl(activeTab.url)) return activeTab;

    const currentWindowQuipperTabs = await chrome.tabs.query({
      currentWindow: true,
      url: ["https://*.quipper.com/*"]
    });
    if (currentWindowQuipperTabs.length) return currentWindowQuipperTabs[currentWindowQuipperTabs.length - 1];

    const anyQuipperTabs = await chrome.tabs.query({ url: ["https://*.quipper.com/*"] });
    if (anyQuipperTabs.length) return anyQuipperTabs[anyQuipperTabs.length - 1];

    throw new Error("Open a Quipper question tab first, then click Read.");
  }

  globalThis.QSH.tabs = {
    getTargetTab
  };
})();
