import { env } from "cloudflare:workers";

import { getDb } from "@/db";
import { diagnosticCases, diagnosticFiles } from "@/db/schema";

export const runtime = "edge";

type Report = {
  overview: string;
  strengths: Array<{ concept: string; evidence: string; confidence: string }>;
  weaknesses: Array<{
    questionRef: string;
    classification: string;
    knowledgePoint: string;
    whyWrong: string;
    evidence: string;
    correction: string;
  }>;
  remediation: Array<{
    priority: number;
    focus: string;
    keywords: string[];
    formulas: string[];
    action: string;
    successCheck: string;
  }>;
};

const weaknessLibrary: Record<string, Report["weaknesses"][number]> = {
  equation: {
    questionRef: "Teacher flag",
    classification: "Concept and notation error",
    knowledgePoint: "Balancing equations, state symbols, and reaction conditions",
    whyWrong: "The student may remember the reactants and products without systematically checking conservation of atoms and charge. State symbols and conditions may also be treated as optional details.",
    evidence: "The teacher flagged equations or state symbols as a recurring issue. A final conclusion requires question-by-question visual review.",
    correction: "Use a five-step check: write the skeleton equation, count atoms, add coefficients, verify charge, then add states and conditions.",
  },
  oxidation: {
    questionRef: "Teacher flag",
    classification: "Conceptual misunderstanding",
    knowledgePoint: "Oxidation numbers, ionic charge, and electron transfer",
    whyWrong: "The student may confuse the oxidation number of one atom with the total charge of an ion, and may not connect changes in oxidation number to electron loss or gain.",
    evidence: "The teacher flagged oxidation numbers, charge, or electron transfer. A final conclusion requires question-by-question review.",
    correction: "Assign oxidation numbers first, identify increases and decreases, then verify that the number of electrons lost equals the number gained.",
  },
  equilibrium: {
    questionRef: "Teacher flag",
    classification: "Calculation-logic error",
    knowledgePoint: "Kc expressions, equilibrium concentrations, and ICE tables",
    whyWrong: "A common blockage is treating stoichiometric coefficients as multipliers instead of powers, or substituting initial concentrations before finding equilibrium concentrations.",
    evidence: "The teacher flagged Kc or equilibrium calculations as a recurring issue. The actual working must be checked in the uploaded response.",
    correction: "Start from the balanced equation, build an Initial–Change–Equilibrium table, and substitute equilibrium concentrations only.",
  },
  calculation: {
    questionRef: "Teacher flag",
    classification: "Calculation process or careless error",
    knowledgePoint: "Amount of substance, unit conversion, and significant figures",
    whyWrong: "The student may skip formulas and unit conversions, making errors difficult to detect. The final number may also use inappropriate significant figures.",
    evidence: "The teacher flagged calculation steps, units, or significant figures.",
    correction: "Show one operation per line and retain units throughout. Finish with dimensional, order-of-magnitude, and significant-figure checks.",
  },
  wording: {
    questionRef: "Teacher flag",
    classification: "Scientific-language or marking-point omission",
    knowledgePoint: "Particle-level cause-and-effect explanations",
    whyWrong: "The answer may state only the macroscopic conclusion without explaining the particle change, collision or equilibrium mechanism, and resulting observation.",
    evidence: "The teacher flagged incomplete explanation keywords as a recurring issue.",
    correction: "Use a four-part structure: changed condition, particle-level effect, direct consequence, and observed result.",
  },
  reading: {
    questionRef: "Teacher flag",
    classification: "Question-reading or careless error",
    knowledgePoint: "Command words, data transcription, and answer scope",
    whyWrong: "The student may overlook command words such as calculate, explain, or deduce, or may copy an exponent, sign, or unit incorrectly.",
    evidence: "The teacher flagged misreading, incorrect data transcription, or answers outside the requested scope.",
    correction: "Circle command and limiting words before starting, then run a 20-second sign, unit, requirement, and estimate check.",
  },
};

const remedyLibrary: Record<string, Report["remediation"][number]> = {
  equation: {
    priority: 1,
    focus: "Conservation-based equation training",
    keywords: ["atom conservation", "charge conservation", "state symbols", "reaction conditions"],
    formulas: [],
    action: "Complete eight scaffolded equation questions. Use two colours to check atom and charge conservation.",
    successCheck: "Balance six consecutive equations with all charges, states, and conditions correct.",
  },
  oxidation: {
    priority: 1,
    focus: "Redox reasoning chain",
    keywords: ["oxidation number", "electron loss", "electron gain", "oxidising agent", "reducing agent"],
    formulas: ["oxidation number rises → oxidation; oxidation number falls → reduction"],
    action: "Complete ten oxidation-number quick checks followed by four half-equation balancing questions.",
    successCheck: "Identify the oxidising agent, reducing agent, and number of transferred electrons within 30 seconds.",
  },
  equilibrium: {
    priority: 1,
    focus: "Kc expressions and ICE tables",
    keywords: ["equilibrium concentration", "stoichiometric coefficient", "power", "ICE table"],
    formulas: ["Kc = product of [products]^coefficient ÷ product of [reactants]^coefficient"],
    action: "Write six Kc expressions without calculation, then complete three full ICE-table questions.",
    successCheck: "Write five consecutive Kc expressions correctly within 90 seconds and use equilibrium concentrations only.",
  },
  calculation: {
    priority: 1,
    focus: "Unit-led calculation workflow",
    keywords: ["mol", "concentration", "molar mass", "unit conversion", "significant figures"],
    formulas: ["n = m / M", "c = n / V"],
    action: "Redo six previous errors using four lines: formula, substitution, units, and final answer.",
    successCheck: "Complete four consecutive calculations without unit, exponent, or significant-figure errors.",
  },
  wording: {
    priority: 1,
    focus: "Marking-keyword explanation template",
    keywords: ["particle level", "effective collision", "activation energy", "equilibrium shift", "causal chain"],
    formulas: [],
    action: "Rewrite five one-mark explanations using condition, mechanism, and result. Highlight each marking point.",
    successCheck: "Hit every marking point in five explanation questions instead of stating only the conclusion.",
  },
  reading: {
    priority: 1,
    focus: "Question reading and final checking",
    keywords: ["command word", "limiting word", "sign", "unit", "order of magnitude"],
    formulas: [],
    action: "Circle the command and constraints before each question; finish with a 20-second S-U-R-E check.",
    successCheck: "Complete a 20-mark quiz without copying data incorrectly or answering outside the requested scope.",
  },
};

function textValue(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function isPdf(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && (value.type === "application/pdf" || value.name.toLowerCase().endsWith(".pdf"));
}

function safeName(name: string) {
  return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-100) || "document.pdf";
}

function guidedReport(signals: string[], topicFocus: string, notes: string): Report {
  const keys = signals.filter((key) => weaknessLibrary[key]);
  const selected = keys.length ? keys : ["wording", "calculation"];
  return {
    overview: `This preliminary diagnosis is based on teacher-selected indicators for “${topicFocus || "Whole paper"}”. ${notes ? `Teacher observation: ${notes}` : "Question-level evidence still requires visual PDF analysis."}`,
    strengths: [
      {
        concept: "A traceable chemistry response record is available",
        evidence: "The examination paper and student response have been stored together for later comparison of methods, notation, working, and marking points. The system does not claim a mastered concept before visual verification.",
        confidence: "Pending question-level review",
      },
    ],
    weaknesses: selected.slice(0, 4).map((key) => weaknessLibrary[key]),
    remediation: selected.slice(0, 3).map((key, index) => ({ ...remedyLibrary[key], priority: index + 1 })),
  };
}

function bytesToDataUrl(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return `data:application/pdf;base64,${btoa(binary)}`;
  });
}

function extractOutputText(payload: unknown): string {
  const data = payload as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return (data.output ?? []).flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("\n");
}

function parseReport(raw: string): Report {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const value = JSON.parse(cleaned) as Report;
  if (!value?.overview || !Array.isArray(value.strengths) || !Array.isArray(value.weaknesses) || !Array.isArray(value.remediation)) {
    throw new Error("The analysis returned an incomplete report format.");
  }
  return value;
}

async function analyzeWithOpenAI(
  files: Array<{ kind: string; file: File }>,
  context: { level: string; examTitle: string; topicFocus: string; teacherNotes: string },
): Promise<Report> {
  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: `You are a senior secondary chemistry teacher and an experienced HKDSE examiner. Compare the original examination paper, the student's response, and the marking reference when supplied. Diagnose every answer using direct evidence.

Student level: ${context.level}
Examination: ${context.examTitle}
Analysis scope: ${context.topicFocus}
Teacher observation: ${context.teacherNotes || "None"}

Rules:
1. Identify strengths only when supported by a correct answer or valid working step. Never infer mastery from the total score alone.
2. For every wrong answer, classify the main cause: conceptual misunderstanding, careless/question-reading error, calculation logic, scientific language/marking-keyword omission, or graph/experimental skill.
3. State the exact knowledge point, quote or paraphrase the student's evidence, explain why it is wrong, and give the correction.
4. Prioritise remediation by prerequisite knowledge and mark impact. Include keywords, formulas, a specific practice action, and a measurable success check.
5. Write the entire report in clear English. Keep chemical formulas, equations, symbols, and terminology exact.
6. If a page or handwritten answer cannot be read reliably, state “Unable to read reliably” instead of guessing.

Return valid JSON only, without Markdown:
{"overview":string,"strengths":[{"concept":string,"evidence":string,"confidence":string}],"weaknesses":[{"questionRef":string,"classification":string,"knowledgePoint":string,"whyWrong":string,"evidence":string,"correction":string}],"remediation":[{"priority":number,"focus":string,"keywords":string[],"formulas":string[],"action":string,"successCheck":string}]}`,
    },
  ];

  for (const item of files) {
    content.push({ type: "input_text", text: `PDF role: ${item.kind}` });
    content.push({
      type: "input_file",
      filename: `${item.kind}-${safeName(item.file.name)}`,
      file_data: await bytesToDataUrl(item.file),
      detail: "high",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-5.6", input: [{ role: "user", content }] }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`OpenAI analysis failed (${response.status})`);
  return parseReport(extractOutputText(payload));
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const studentName = textValue(form, "studentName");
    const level = textValue(form, "level") || "HKDSE";
    const examTitle = textValue(form, "examTitle");
    const topicFocus = textValue(form, "topicFocus") || "Whole paper";
    const teacherNotes = textValue(form, "teacherNotes");
    const paper = form.get("paper");
    const student = form.get("student");
    const marking = form.get("marking");

    if (!studentName || !examTitle) return Response.json({ error: "Enter a student code and examination title." }, { status: 400 });
    if (!isPdf(paper) || !isPdf(student)) return Response.json({ error: "The original paper and student response must be PDF files." }, { status: 400 });

    const uploaded = [
      { kind: "Original examination paper", keyKind: "paper", file: paper },
      { kind: "Student response", keyKind: "student", file: student },
      ...(isPdf(marking) ? [{ kind: "Marking reference", keyKind: "marking", file: marking }] : []),
    ];
    const totalBytes = uploaded.reduce((sum, item) => sum + item.file.size, 0);
    if (uploaded.some((item) => item.file.size > 15 * 1024 * 1024) || totalBytes > 40 * 1024 * 1024) {
      return Response.json({ error: "PDF size limit exceeded: 15 MB per file and 40 MB in total." }, { status: 413 });
    }
    if (!env.BUCKET) throw new Error("PDF storage is temporarily unavailable.");

    const caseId = crypto.randomUUID();
    const ownerId = `public:${caseId}`;
    const fileRows = [];
    for (const item of uploaded) {
      const r2Key = `anonymous/${caseId}/${item.keyKind}-${safeName(item.file.name)}`;
      await env.BUCKET.put(r2Key, item.file.stream(), { httpMetadata: { contentType: "application/pdf" } });
      fileRows.push({ id: crypto.randomUUID(), caseId, ownerId, kind: item.keyKind, filename: item.file.name, r2Key, sizeBytes: item.file.size });
    }

    let signalValues: string[] = [];
    try {
      const parsed = JSON.parse(textValue(form, "signals") || "[]");
      signalValues = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      signalValues = [];
    }

    let reportSource: "ai" | "guided" = "guided";
    let report: Report;
    let notice = "A preliminary teacher-guided diagnosis has been generated. Connect visual analysis for full question-by-question verification.";
    if (env.OPENAI_API_KEY) {
      try {
        report = await analyzeWithOpenAI(uploaded.map(({ kind, file }) => ({ kind, file })), { level, examTitle, topicFocus, teacherNotes });
        reportSource = "ai";
        notice = "The PDFs have been compared page by page and the diagnostic report is ready.";
      } catch {
        report = guidedReport(signalValues, topicFocus, teacherNotes);
        notice = "The PDFs were stored safely. Visual analysis was temporarily unavailable, so a teacher-guided report was generated.";
      }
    } else {
      report = guidedReport(signalValues, topicFocus, teacherNotes);
    }

    const db = getDb();
    await db.insert(diagnosticCases).values({
      id: caseId,
      ownerId,
      studentName,
      level,
      examTitle,
      topicFocus,
      teacherNotes,
      status: "reported",
      reportSource,
      reportJson: JSON.stringify(report),
    });
    if (fileRows.length) await db.insert(diagnosticFiles).values(fileRows);

    return Response.json({ caseId, studentName, reportSource, report, notice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The diagnostic could not be processed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
