const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = { globalThis: {} };
context.globalThis = context;
vm.createContext(context);

const promptBuilderScript = fs.readFileSync(path.join(__dirname, "..", "src", "popup", "prompt-builder.js"), "utf8");
vm.runInContext(promptBuilderScript, context);

const prompt = context.QSH.prompts.buildStudyPrompt(
  "check_reasoning",
  "Question\nSample question",
  "My initial reasoning"
);

assert.match(prompt, /Do not provide the final selected answer/);
assert.match(prompt, /My attempt or reasoning:\nMy initial reasoning/);
assert.doesNotMatch(prompt, /(answer is|select|pick) (A|B|C|D)\b/i);

const verifyPrompt = context.QSH.prompts.buildVerifyPrompt("Question\nSample question");

assert.match(verifyPrompt, /Check this quiz\/mock-test item carefully/);
assert.match(verifyPrompt, /do not provide the final answer letter/);

console.log("prompt builder tests passed");
