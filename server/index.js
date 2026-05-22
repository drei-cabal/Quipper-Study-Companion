const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 8787);
const ENV_PATH = path.join(__dirname, ".env");

loadEnvFile(ENV_PATH);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const ENABLE_WEB_SEARCH = String(process.env.ENABLE_WEB_SEARCH || "false").toLowerCase() === "true";

const MODES = {
  explain_choices:
    "Explain the question and each answer choice. For each choice, explain what would make it plausible and what the learner should verify. Do not rank choices, eliminate down to one, or reveal a final option.",
  hint:
    "Give one or two useful hints that help the learner decide independently. Do not discuss which option is best.",
  concept:
    "Identify the underlying concept, summarize the relevant rule or idea, and give a compact worked example that is not the same as the user's question.",
  check_reasoning:
    "Evaluate the learner's reasoning for soundness. Point out strong steps and gaps. Do not state the final answer label; if the reasoning arrives at a choice, focus on whether the reasoning is justified.",
  practice:
    "Create one similar practice question with choices, but do not solve it. Include a short hint after the choices."
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(html);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 120_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function buildInstructions(mode) {
  return [
    "You are a study tutor for a learner reviewing quiz or mock-test material.",
    "You may explain concepts, clarify wording, compare what each choice is testing, and give hints.",
    "You must not provide the final selected answer, answer letter, answer number, or direct instruction to choose a specific option.",
    "Do not rank the choices from best to worst. Do not eliminate choices so aggressively that only one option remains.",
    "If the user asks for the answer or if the text appears to be from an active exam, keep the response in learning mode.",
    "If a choice is factually wrong or plausible, explain the condition or principle involved without announcing the final pick.",
    "Keep the response concise and useful.",
    "",
    `Requested mode: ${MODES[mode] || MODES.explain_choices}`
  ].join("\n");
}

function buildInput({ mode, questionText, userReasoning }) {
  const sections = [
    `Question or page text:\n${questionText}`,
    userReasoning ? `Learner's attempted reasoning:\n${userReasoning}` : ""
  ].filter(Boolean);

  return sections.join("\n\n");
}

function extractText(openaiPayload) {
  if (typeof openaiPayload.output_text === "string") {
    return openaiPayload.output_text;
  }

  const chunks = [];
  for (const item of openaiPayload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function revealsFinalAnswer(text) {
  const patterns = [
    /\b(the\s+)?(correct|best|right)\s+(answer|choice|option)\s+(is|:)\s*[A-D1-9]\b/i,
    /\b(answer|choice|option)\s+[A-D1-9]\s+(is|seems|appears)\s+(correct|best|right)\b/i,
    /\bchoose\s+(answer\s+)?(choice\s+|option\s+)?[A-D1-9]\b/i,
    /\bselect\s+(answer\s+)?(choice\s+|option\s+)?[A-D1-9]\b/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

async function callOpenAI({ mode, questionText, userReasoning }) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it to server/.env.");
  }

  const requestBody = {
    model: OPENAI_MODEL,
    instructions: buildInstructions(mode),
    input: buildInput({ mode, questionText, userReasoning }),
    max_output_tokens: 900
  };

  if (ENABLE_WEB_SEARCH) {
    requestBody.tools = [{ type: "web_search_preview" }];
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `OpenAI request failed with ${response.status}.`;
    throw new Error(message);
  }

  const text = extractText(payload);

  if (revealsFinalAnswer(text)) {
    return [
      "I need to keep this in study mode, so I won't name or select a final option.",
      "",
      "Use this instead:",
      "- Restate what the question is asking in your own words.",
      "- For each choice, ask what condition would make it true.",
      "- Compare each choice against the key rule, definition, formula, or evidence from the prompt.",
      "- Write your tentative pick and reasoning in the reasoning box, then use Check reasoning for feedback."
    ].join("\n");
  }

  return text;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/") {
    sendHtml(response, 200, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Study Helper Server</title>
    <style>
      body { margin: 0; font: 15px/1.5 system-ui, sans-serif; color: #1f2933; background: #f7f8fb; }
      main { max-width: 760px; margin: 48px auto; padding: 0 20px; }
      section { background: #fff; border: 1px solid #d8dde6; border-radius: 8px; padding: 22px; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      code { background: #eef2f7; padding: 2px 5px; border-radius: 4px; }
      li { margin: 7px 0; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Study Helper server is running</h1>
        <p>This page is only the local backend. Use the Chrome extension popup for the actual study helper UI.</p>
        <ol>
          <li>Keep this server window open.</li>
          <li>Load the project folder in <code>chrome://extensions</code> with Developer mode enabled.</li>
          <li>Open a Quipper page, click the extension icon, then click <code>Read</code>.</li>
        </ol>
        <p>Health check: <a href="/health">/health</a></p>
      </section>
    </main>
  </body>
</html>`);
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      model: OPENAI_MODEL,
      webSearchEnabled: ENABLE_WEB_SEARCH
    });
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/study") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const mode = MODES[body.mode] ? body.mode : "explain_choices";
    const questionText = String(body.questionText || "").trim();
    const userReasoning = String(body.userReasoning || "").trim();

    if (!questionText) {
      sendJson(response, 400, { error: "questionText is required." });
      return;
    }

    const text = await callOpenAI({ mode, questionText, userReasoning });
    sendJson(response, 200, { text });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Study Helper server listening on http://localhost:${PORT}`);
});
