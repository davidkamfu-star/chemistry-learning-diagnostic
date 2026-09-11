const MAX_BODY_BYTES = 4_400_000;
const MAX_PAGES_PER_BATCH = 3;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const requestWindows = new Map();

const DSE_TOPICS = `I Planet Earth; II Microscopic World I; III Metals; IV Acids and Bases; V Fossil Fuels and Carbon Compounds; VI Microscopic World II; VII Redox Reactions, Chemical Cells and Electrolysis; VIII Chemical Reactions and Energy; IX Rate of Reaction; X Chemical Equilibrium; XI Chemistry of Carbon Compounds; XII Patterns in the Chemical World; XIII Industrial Chemistry; XIV Materials Chemistry; XV Analytical Chemistry.`;

const itemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questionRef: { type: "string" },
    result: { type: "string", enum: ["correct", "incorrect", "partial", "unclear"] },
    marks: { type: "string" },
    studentResponse: { type: "string" },
    markerEvidence: { type: "string" },
    expectedIdea: { type: "string" },
    cause: { type: "string", enum: ["concept", "careless", "calculation", "language", "equation", "experimental", "unclear"] },
    knowledgePoint: { type: "string" },
    dseTopicId: { type: "string" },
    dseTopicName: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["questionRef", "result", "marks", "studentResponse", "markerEvidence", "expectedIdea", "cause", "knowledgePoint", "dseTopicId", "dseTopicName", "confidence"],
};

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pageEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          pageNumber: { type: "integer" },
          role: { type: "string" },
          readability: { type: "string", enum: ["clear", "partial", "unreadable"] },
          summary: { type: "string" },
          items: { type: "array", items: itemSchema },
        },
        required: ["pageNumber", "role", "readability", "summary", "items"],
      },
    },
  },
  required: ["pageEvidence"],
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    summary: {
      type: "object",
      additionalProperties: false,
      properties: { strengths: { type: "integer" }, weaknesses: { type: "integer" }, topCause: { type: "string" } },
      required: ["strengths", "weaknesses", "topCause"],
    },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          concept: { type: "string" }, evidence: { type: "string" }, confidence: { type: "string" }, mastery: { type: "string" }, demonstratedSkill: { type: "string" }, nextStep: { type: "string" },
        },
        required: ["concept", "evidence", "confidence", "mastery", "demonstratedSkill", "nextStep"],
      },
    },
    weaknesses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          questionRef: { type: "string" }, classification: { type: "string" }, knowledgePoint: { type: "string" }, impact: { type: "string" }, evidence: { type: "string" }, expectedIdea: { type: "string" }, whyWrong: { type: "string" }, whyClassification: { type: "string" }, correction: { type: "string" }, correctionSteps: { type: "array", items: { type: "string" } }, diagnosticCheck: { type: "string" },
        },
        required: ["questionRef", "classification", "knowledgePoint", "impact", "evidence", "expectedIdea", "whyWrong", "whyClassification", "correction", "correctionSteps", "diagnosticCheck"],
      },
    },
    dseTopics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" }, name: { type: "string" }, subtopic: { type: "string" }, why: { type: "string" }, evidence: { type: "string" }, confidence: { type: "string" }, keywords: { type: "array", items: { type: "string" } }, formula: { type: "string" }, practice: { type: "string" }, success: { type: "string" },
        },
        required: ["id", "name", "subtopic", "why", "evidence", "confidence", "keywords", "formula", "practice", "success"],
      },
    },
    remediation: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          priority: { type: "integer" }, focus: { type: "string" }, keywords: { type: "array", items: { type: "string" } }, formulas: { type: "array", items: { type: "string" } }, prerequisite: { type: "string" }, formulaConditions: { type: "string" }, practiceStages: { type: "array", items: { type: "string" } }, action: { type: "string" }, reviewSchedule: { type: "string" }, successCheck: { type: "string" },
        },
        required: ["priority", "focus", "keywords", "formulas", "prerequisite", "formulaConditions", "practiceStages", "action", "reviewSchedule", "successCheck"],
      },
    },
  },
  required: ["overview", "summary", "strengths", "weaknesses", "dseTopics", "remediation"],
};

function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || "https://davidkamfu-star.github.io,http://localhost:4173")
    .split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins();
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function json(request, value, status = 200) {
  return Response.json(value, { status, headers: corsHeaders(request) });
}

function clientKey(request) {
  return (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

function rateLimited(request) {
  const now = Date.now(), key = clientKey(request), current = requestWindows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) { requestWindows.set(key, { startedAt: now, count: 1 }); return false; }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function outputText(payload) {
  return (payload.output || []).flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text || "").join("\n");
}

async function openAIResponse({ input, schema, schemaName, maxOutputTokens }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the backend.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input,
      max_output_tokens: maxOutputTokens,
      text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Model request failed (${response.status}).`);
  const text = outputText(payload);
  if (!text) throw new Error("The model returned no report data.");
  return JSON.parse(text);
}

async function extractPages(body) {
  if (!Array.isArray(body.pages) || body.pages.length < 1 || body.pages.length > MAX_PAGES_PER_BATCH) throw new Error("Each visual batch must contain 1–3 pages.");
  const content = [{
    type: "input_text",
    text: `You are a senior HKDSE Chemistry examiner reading ${body.role || "a marked student paper"}. Inspect every supplied page image at high detail. Printed OCR text is supporting evidence only and may be wrong. Read handwritten working, chemical equations, structures, diagrams, graphs, ticks, crosses, circles, awarded marks, corrections and teacher comments.

HKDSE topics: ${DSE_TOPICS}

Rules:
- Record a correct item only when a tick, awarded mark, or visibly valid answer supports it.
- For lost marks, separate observed evidence from the likely cause. Use cause "unclear" when the cause cannot be justified.
- If the original question or marking scheme is absent, do not invent its wording or marking points. Leave expectedIdea empty unless the correction or chemistry requirement is visually clear.
- Preserve chemical formulae, charges, state symbols, units and question references.
- Mark uncertain handwriting as low confidence. If it cannot be read reliably, set readability to unreadable and do not guess.
- Use the exact pageNumber values supplied in the adjacent page labels.

Context: ${JSON.stringify(body.context || {})}`,
  }];
  for (const page of body.pages) {
    if (!Number.isInteger(page.pageNumber) || typeof page.image !== "string" || !page.image.startsWith("data:image/jpeg;base64,")) throw new Error("Invalid page image payload.");
    content.push({ type: "input_text", text: `Page ${page.pageNumber}; local source=${page.localSource || "none"}; local OCR/text (may contain errors):\n${String(page.localText || "").slice(0, 12000)}` });
    content.push({ type: "input_image", image_url: page.image, detail: "high" });
  }
  return openAIResponse({ input: [{ role: "user", content }], schema: extractionSchema, schemaName: "marked_paper_page_evidence", maxOutputTokens: 4000 });
}

async function synthesizeReport(body) {
  if (!Array.isArray(body.pageEvidence) || !body.pageEvidence.length) throw new Error("No page evidence was supplied for synthesis.");
  const language = body.language === "zh-Hant" ? "Traditional Chinese (Hong Kong usage)" : "English";
  const prompt = `You are a senior Chemistry teacher and experienced HKDSE examiner. Carefully read all evidence extracted from the uploaded PDFs and create one detailed Learning Diagnostic Report in ${language}.

Input framing:
- The upload may contain lesson/textbook content, a marked student paper, or both.
- The marked student paper is the primary evidence for student performance. Read the student's actual responses, handwritten working, ticks, crosses, awarded marks, corrections, diagrams, graphs, structures and teacher comments.
- The original examination paper and marking reference are optional supporting context. The original paper may be unavailable; the report must still assess the marked paper without inventing missing wording, answers, marks or marking points.

The report MUST follow exactly these three parts:

1. Strengths Analysis / 強項分析
Identify the Chemistry concepts the student has demonstrably mastered. For every strength, cite the question/page evidence, state the mastery judgement and demonstrated skill, and give a suitable next extension. Do not infer mastery from the total score alone.

2. Weakness Detection and Causes of Lost Marks / 弱點及失分原因
This is the priority section. Analyse every supported wrong, crossed, incomplete or partially correct answer. Separate what is visibly observed from the inferred cause. For each item:
- identify the exact question/page and marks lost when available;
- quote or accurately describe the student's response and the marker evidence;
- state the expected Chemistry idea only when supported;
- decide whether the main cause is conceptual misunderstanding, carelessness/question reading, calculation logic, equation/notation, scientific-language keywords, or experimental/graph skill;
- explain precisely why that classification fits and name the exact knowledge point where the student became stuck;
- provide step-by-step correction and one quick diagnostic check.
If evidence is unreadable or insufficient, state that limitation and use low confidence instead of guessing.

3. Remediation Pathway / 補救路徑
Rank the HKDSE Chemistry topics and subtopics that need strengthening. Use the official Topic I–XV identifiers and names only when supported: ${DSE_TOPICS}
For every priority, provide:
- revision keywords;
- the exact formula, rule or required scientific wording and its conditions of use;
- prerequisite knowledge;
- three practice stages: recall, guided correction of the marked error, and unfamiliar HKDSE exam transfer;
- a spaced-review schedule; and
- a measurable success requirement before moving on.

Evidence and language rules:
- Base every diagnosis on uploaded-file evidence or explicit teacher-entered evidence.
- Preserve chemical formulae, ionic charges, state symbols, units, significant figures and question references exactly.
- Cite page/question evidence inside the report but omit private names.
- Use clear teacher-facing language in the selected report language only.
- Give 1–6 strengths, 1–10 weaknesses, 1–5 DSE topics and 1–5 remediation priorities.
- If the original paper is absent, clearly distinguish verified observations from reasonable but unverified interpretation.

Case context: ${JSON.stringify(body.context || {})}
Teacher-entered evidence: ${JSON.stringify(body.teacherEvidence || {})}
Local topic screening: ${JSON.stringify(body.localTopics || [])}
Visual page evidence: ${JSON.stringify(body.pageEvidence).slice(0, 500000)}`;
  const report = await openAIResponse({ input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }], schema: reportSchema, schemaName: "hkdse_chemistry_diagnostic_report", maxOutputTokens: 8000 });
  return { report };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method === "GET") return json(request, { ok: true, service: "chemistry-diagnostic-vision", modelConfigured: Boolean(process.env.OPENAI_API_KEY) });
    if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
    const origin = request.headers.get("origin") || "";
    if (origin && !allowedOrigins().includes(origin)) return json(request, { error: "Origin is not allowed." }, 403);
    if (rateLimited(request)) return json(request, { error: "Analysis rate limit reached. Please try again later." }, 429);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) return json(request, { error: "Visual batch is too large." }, 413);
    try {
      const body = await request.json();
      const result = body.mode === "extract" ? await extractPages(body) : body.mode === "synthesize" ? await synthesizeReport(body) : null;
      if (!result) return json(request, { error: "Unknown analysis mode." }, 400);
      return json(request, result);
    } catch (error) {
      console.error("Analysis request failed", error);
      return json(request, { error: error instanceof Error ? error.message : "Analysis failed." }, 500);
    }
  },
};
