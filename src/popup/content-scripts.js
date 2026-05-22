(() => {
  globalThis.QSH = globalThis.QSH || {};

  globalThis.QSH.contentScripts = [
    "src/shared/messages.js",
    "src/content/text-utils.js",
    "src/content/dom-blocks.js",
    "src/content/layout-extractors.js",
    "src/content/content.js"
  ];
})();
