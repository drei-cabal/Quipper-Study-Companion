(() => {
  globalThis.QSH = globalThis.QSH || {};

  const MODE_INSTRUCTIONS = {
    check_reasoning:
      "Evaluate my reasoning for soundness. Point out strong steps and gaps. Do not state the final answer label; if my reasoning arrives at a choice, focus on whether the reasoning is justified.",
    concept:
      "Identify the underlying concept, summarize the relevant rule or idea, and give a compact worked example that is not the same as my question.",
    explain_choices:
      "Explain the question and each answer choice. For each choice, explain what would make it plausible and what I should verify. Do not rank choices, eliminate down to one, or reveal a final option.",
    hint:
      "Give one or two useful hints that help me decide independently. Do not discuss which option is best.",
    practice:
      "Create one similar practice question with choices, but do not solve it. Include a short hint after the choices."
  };

  function buildStudyPrompt(mode, text, reasoning) {
    return [
      "You are my study tutor. Help me learn from this quiz/mock-test item.",
      "",
      "Important rules:",
      "- Do not provide the final selected answer, answer letter, answer number, or direct instruction to choose a specific option.",
      "- Do not rank choices from best to worst.",
      "- Do not eliminate choices so aggressively that only one option remains.",
      "- Explain concepts, wording, and reasoning so I can decide independently.",
      "",
      `Task: ${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.explain_choices}`,
      "",
      "Question or page text:",
      text,
      reasoning ? `\nMy attempt or reasoning:\n${reasoning}` : ""
    ].filter(Boolean).join("\n");
  }

  function buildVerifyPrompt(text) {
    return [
      "Check this quiz/mock-test item carefully.",
      "Explain the relevant concept and reasoning, but do not provide the final answer letter, answer number, or direct instruction to choose a specific option.",
      "Point out what I should verify before deciding.",
      "",
      text
    ].join("\n");
  }

  globalThis.QSH.prompts = {
    buildStudyPrompt,
    buildVerifyPrompt
  };
})();
