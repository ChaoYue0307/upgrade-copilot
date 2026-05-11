export async function generateLlmAnalysis(scan, {
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL || "gpt-4.1-mini"
} = {}) {
  if (!apiKey) {
    return {
      enabled: false,
      model,
      markdown: null,
      note: "OPENAI_API_KEY is not set, so deterministic scanner output was returned without LLM analysis."
    };
  }

  const prompt = buildPrompt(scan);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "You are Upgrade Copilot, a senior migration engineer. Produce concise, repo-specific upgrade risk analysis. Focus on evidence, PR boundaries, validation commands, and commercial usefulness. Do not invent files that were not provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI API returned ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  return {
    enabled: true,
    model,
    markdown: extractText(data),
    usage: data.usage || null
  };
}

function buildPrompt(scan) {
  const compact = {
    repository: scan.metadata,
    readiness: scan.readiness,
    summary: scan.summary,
    evidence: scan.evidence,
    topDependencies: scan.dependencies.slice(0, 20),
    findings: scan.findings,
    deterministicPrPlan: scan.prPlan,
    validationCommands: scan.validationCommands
  };

  return [
    "Create an Upgrade Copilot premium report from this scanner JSON.",
    "",
    "Output Markdown with these sections:",
    "1. Executive summary",
    "2. Highest-risk upgrade surfaces",
    "3. Suggested PR sequence",
    "4. Validation commands",
    "5. What a paid backend should inspect next",
    "",
    "Scanner JSON:",
    JSON.stringify(compact, null, 2)
  ].join("\n");
}

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}
