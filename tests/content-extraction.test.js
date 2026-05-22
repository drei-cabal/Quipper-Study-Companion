const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Load the same content script path that Chrome runs from manifest.json.
const contentScript = fs.readFileSync(path.join(__dirname, "..", "src", "content", "content.js"), "utf8");

function runExtraction(bodyText, selectionText = "") {
  let messageHandler;

  const context = {
    globalThis: {},
    window: {
      getSelection: () => ({
        toString: () => selectionText
      }),
      location: {
        href: "https://learn.quipper.com/quiz"
      }
    },
    document: {
      title: "Quipper Quiz",
      body: {
        innerText: bodyText,
        querySelectorAll: () => []
      },
      documentElement: {
        clientWidth: 1200,
        clientHeight: 900
      }
    },
    chrome: {
      runtime: {
        onMessage: {
          addListener: (handler) => {
            messageHandler = handler;
          },
          removeListener: () => {}
        }
      }
    }
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(contentScript, context);

  let payload;
  messageHandler({ type: "QSH_EXTRACT_TEXT" }, {}, (response) => {
    payload = response;
  });

  return payload;
}

const shortAnswerPayload = runExtraction([
  "Question",
  "They play the role of change agents in the social sector, by: adopting a mission to create and sustain social value.",
  "Enter your answer into the box.",
  "1 point",
  "Answer"
].join("\n"));

assert.match(shortAnswerPayload.text, /Question/);
assert.match(shortAnswerPayload.text, /change agents in the social sector/);
assert.match(shortAnswerPayload.text, /Answer format\nShort answer/);

const selectedPayload = runExtraction("Question\nIgnored page text", "Selected question text");

assert.equal(selectedPayload.usedSelection, true);
assert.equal(selectedPayload.text, "Selected question text");

console.log("content extraction tests passed");
