const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Load the same ordered content scripts that Chrome runs from manifest.json.
const contentScripts = [
  "../shared/messages.js",
  "text-utils.js",
  "dom-blocks.js",
  "layout-extractors.js",
  "content.js"
].map((fileName) => {
  return fs.readFileSync(path.join(__dirname, "..", "src", "content", fileName), "utf8");
});

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
  contentScripts.forEach((script) => vm.runInContext(script, context));

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
assert.equal(shortAnswerPayload.questionType, "short_answer");

const multipleChoicePayload = runExtraction([
  "Question",
  "Which term best describes creating social value through new solutions?",
  "Select your answer",
  "Social entrepreneurship",
  "Market segmentation",
  "Cost accounting",
  "Answer"
].join("\n"));

assert.match(multipleChoicePayload.text, /Choices/);
assert.match(multipleChoicePayload.text, /A\. Social entrepreneurship/);
assert.match(multipleChoicePayload.text, /B\. Market segmentation/);
assert.equal(multipleChoicePayload.questionType, "multiple_choice");

const selectedPayload = runExtraction("Question\nIgnored page text", "Selected question text");

assert.equal(selectedPayload.usedSelection, true);
assert.equal(selectedPayload.text, "Selected question text");
assert.equal(selectedPayload.questionType, "selected_text");

console.log("content extraction tests passed");
