"use strict";

const weaknessLibrary = {
  equation: {
    classification: "Concept and notation error",
    knowledgePoint: "Balancing equations, state symbols, and reaction conditions",
    whyWrong: "The student may remember the reactants and products without systematically checking conservation of atoms and charge. State symbols and conditions may also be treated as optional details.",
    correction: "Use a five-step check: write the skeleton equation, count atoms, add coefficients, verify charge, then add states and conditions."
  },
  oxidation: {
    classification: "Conceptual misunderstanding",
    knowledgePoint: "Oxidation numbers, ionic charge, and electron transfer",
    whyWrong: "The student may confuse the oxidation number of one atom with the total charge of an ion, or may not connect oxidation-number changes to electron loss and gain.",
    correction: "Assign oxidation numbers first, identify increases and decreases, then verify that electrons lost equal electrons gained."
  },
  equilibrium: {
    classification: "Calculation-logic error",
    knowledgePoint: "Kc expressions, equilibrium concentrations, and ICE tables",
    whyWrong: "A likely blockage is treating stoichiometric coefficients as multipliers instead of powers, or substituting initial concentrations before finding equilibrium concentrations.",
    correction: "Start from the balanced equation, build an Initial–Change–Equilibrium table, and substitute equilibrium concentrations only."
  },
  calculation: {
    classification: "Calculation process or careless error",
    knowledgePoint: "Amount of substance, unit conversion, and significant figures",
    whyWrong: "Skipping formulas and unit conversions makes the logic difficult to check. The final answer may also use an inappropriate number of significant figures.",
    correction: "Show one operation per line, retain units throughout, and finish with dimensional, order-of-magnitude, and significant-figure checks."
  },
  wording: {
    classification: "Scientific-language omission",
    knowledgePoint: "Particle-level cause-and-effect explanations",
    whyWrong: "The response may state only the macroscopic conclusion without explaining the particle change, mechanism, and resulting observation required by the marking points.",
    correction: "Use a four-part structure: changed condition, particle-level effect, direct consequence, and observed result."
  },
  reading: {
    classification: "Question-reading or careless error",
    knowledgePoint: "Command words, data transcription, and answer scope",
    whyWrong: "The student may overlook command words or copy an exponent, sign, or unit incorrectly, producing an answer outside the requested scope.",
    correction: "Circle command and limiting words before starting, then run a 20-second sign, unit, requirement, and estimate check."
  }
};

const remedyLibrary = {
  equation: { focus: "Conservation-based equation training", keywords: ["atom conservation", "charge conservation", "state symbols", "reaction conditions"], formulas: [], action: "Complete eight scaffolded equation questions. Use two colours to check atom and charge conservation.", successCheck: "Balance six consecutive equations with all charges, states, and conditions correct." },
  oxidation: { focus: "Redox reasoning chain", keywords: ["oxidation number", "electron loss", "electron gain", "oxidising agent", "reducing agent"], formulas: ["oxidation number rises → oxidation; oxidation number falls → reduction"], action: "Complete ten oxidation-number quick checks followed by four half-equation balancing questions.", successCheck: "Identify the agents and number of transferred electrons within 30 seconds." },
  equilibrium: { focus: "Kc expressions and ICE tables", keywords: ["equilibrium concentration", "stoichiometric coefficient", "power", "ICE table"], formulas: ["Kc = product of [products]^coefficient ÷ product of [reactants]^coefficient"], action: "Write six Kc expressions without calculation, then complete three full ICE-table questions.", successCheck: "Write five consecutive Kc expressions correctly within 90 seconds and use equilibrium concentrations only." },
  calculation: { focus: "Unit-led calculation workflow", keywords: ["mol", "concentration", "molar mass", "unit conversion", "significant figures"], formulas: ["n = m ÷ M", "c = n ÷ V"], action: "Redo six previous errors using four lines: formula, substitution, units, and final answer.", successCheck: "Complete four consecutive calculations without unit, exponent, or significant-figure errors." },
  wording: { focus: "Marking-keyword explanation template", keywords: ["particle level", "effective collision", "activation energy", "equilibrium shift", "causal chain"], formulas: [], action: "Rewrite five explanations using condition, mechanism, and result. Highlight each marking point.", successCheck: "Meet every marking point in five explanation questions instead of stating only the conclusion." },
  reading: { focus: "Question reading and final checking", keywords: ["command word", "limiting word", "sign", "unit", "order of magnitude"], formulas: [], action: "Circle the command and constraints before each question; finish with a 20-second S-U-R-E check.", successCheck: "Complete a 20-mark quiz without copying data incorrectly or answering outside the requested scope." }
};

const demoReport = {
  overview: "The student shows secure recognition of basic ionic reactions and equilibrium direction, but loses marks when translating balanced equations into Kc expressions and when completing scientific explanations.",
  strengths: [
    { concept: "Acid–base and ionic reactions", evidence: "Correctly identifies the reacting ions and writes the net ionic equation in Q2.", confidence: "Verified teacher evidence" },
    { concept: "Qualitative equilibrium shifts", evidence: "Correctly predicts the direction of shift after a concentration change in Q5(a).", confidence: "Verified teacher evidence" }
  ],
  weaknesses: [
    { questionRef: "Q6(b)(ii)", classification: "Calculation-logic error", knowledgePoint: "The form of a Kc expression and its powers", whyWrong: "The stoichiometric coefficient was used as a multiplier instead of as the power of concentration. This indicates that the definition of Kc is not fully internalised.", evidence: "Teacher evidence: 2[NO₂] ÷ [N₂O₄] was written instead of [NO₂]² ÷ [N₂O₄].", correction: "Start from the balanced equation, write each concentration term, convert coefficients into powers, and omit pure solids and liquids." },
    { questionRef: "Q8(a)", classification: "Scientific-language omission", knowledgePoint: "Collision theory and reaction rate", whyWrong: "The answer states only that collisions increase. It does not specify that the frequency of effective collisions involving sufficient energy increases.", evidence: "Teacher evidence: correct direction, but the marking keywords were incomplete.", correction: "Use a three-part explanation: particle change → effective-collision frequency → reaction rate." }
  ],
  remediation: [
    { priority: 1, focus: "Rebuild Kc expressions", keywords: ["equilibrium concentration", "coefficient", "power", "omit pure solids and liquids"], formulas: ["Kc = product of [products]^coefficient ÷ product of [reactants]^coefficient"], action: "Complete six Kc-expression questions, followed by three ICE-table questions.", successCheck: "Write five consecutive Kc expressions correctly within 90 seconds." },
    { priority: 2, focus: "Complete scientific marking keywords", keywords: ["effective collision", "sufficient energy", "frequency", "activation energy"], formulas: [], action: "Rewrite five explanations using condition, mechanism, and result. Highlight each marking point.", successCheck: "Meet every marking point in five similar explanation questions." }
  ]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const historyKey = "chemistry-diagnostic-history-v1";
let currentReport = demoReport;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function addLabelledText(parent, label, text, className = "") {
  const paragraph = node("p", className);
  paragraph.append(node("span", "label", `${label} `), document.createTextNode(text));
  parent.append(paragraph);
}

function renderReport(report, meta = {}) {
  currentReport = report;
  const student = meta.student || "Sample Student";
  const detail = meta.detail || "HKDSE · Demonstration report";
  $("#report-heading").textContent = student;
  $("#reportMeta").textContent = detail;
  $("#printStudent").textContent = student;
  $("#printMeta").textContent = detail;
  $("#reportStatus").textContent = meta.status || "Demonstration";
  $("#overviewText").textContent = report.overview;

  const strengths = $("#strengthsList");
  strengths.replaceChildren();
  report.strengths.forEach((item) => {
    const card = node("article", "report-card");
    const top = node("div", "report-card-top");
    top.append(node("h4", "", item.concept), node("span", "badge", item.confidence));
    card.append(top);
    addLabelledText(card, "Evidence", item.evidence, "evidence");
    strengths.append(card);
  });

  const weaknesses = $("#weaknessesList");
  weaknesses.replaceChildren();
  report.weaknesses.forEach((item) => {
    const card = node("article", "report-card");
    const top = node("div", "report-card-top");
    top.append(node("h4", "", `${item.questionRef} · ${item.knowledgePoint}`), node("span", "badge red", item.classification));
    card.append(top);
    addLabelledText(card, "Why the mark was lost", item.whyWrong);
    addLabelledText(card, "Evidence", item.evidence, "evidence");
    addLabelledText(card, "Correction", item.correction);
    weaknesses.append(card);
  });

  const remediation = $("#remediationList");
  remediation.replaceChildren();
  report.remediation.forEach((item) => {
    const card = node("article", "report-card");
    const top = node("div", "report-card-top");
    top.append(node("h4", "", `${item.priority}. ${item.focus}`), node("span", "badge amber", `Priority ${item.priority}`));
    card.append(top);
    const keywords = node("div", "keyword-row");
    item.keywords.forEach((word) => keywords.append(node("span", "keyword", word)));
    card.append(keywords);
    item.formulas.forEach((formula) => card.append(node("p", "formula", formula)));
    addLabelledText(card, "Practice action", item.action);
    addLabelledText(card, "Completion standard", item.successCheck);
    remediation.append(card);
  });
}

function getFiles() {
  return {
    paper: $("#paperFile").files[0] || null,
    student: $("#studentFile").files[0] || null,
    marking: $("#markingFile").files[0] || null
  };
}

function validatePdf(file) {
  return file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && file.size <= 15 * 1024 * 1024;
}

function selectedSignals() {
  return $$('#signalGrid input[type="checkbox"]:checked').map((input) => input.value);
}

function buildGuidedReport(data) {
  const keys = data.signals.length ? data.signals : ["wording", "calculation"];
  const evidenceSuffix = data.notes ? ` Teacher observation: ${data.notes}` : " Add precise question references in the teacher observations to strengthen the evidence trail.";
  const scoreText = data.score ? ` The marked score is ${data.score.awarded}/${data.score.total} (${data.score.percentage.toFixed(1)}%).` : "";
  const sourceText = data.hasOriginal
    ? "The original paper was also supplied for context."
    : "The original paper was unavailable, so question wording and unshown marking points cannot be independently verified.";
  const strengths = data.strengths.length
    ? data.strengths.map((evidence, index) => ({ concept: `Verified strength ${index + 1}`, evidence, confidence: "Teacher-verified" }))
    : [{ concept: "Marked performance recorded", evidence: data.score ? `The marked paper records ${data.score.awarded} marks out of ${data.score.total}. Add correct question references above before labelling a chemistry concept as mastered.` : "The marked student paper was selected. Add correct question references above before labelling a chemistry concept as mastered.", confidence: "Awaiting concept evidence" }];
  return {
    overview: `This marked-paper diagnosis covers “${data.scope || "Whole paper"}” and is based on ${keys.length} teacher-selected error pattern${keys.length === 1 ? "" : "s"}.${scoreText} ${sourceText} The PDFs stayed on this device and were not automatically inspected.${evidenceSuffix}`,
    strengths,
    weaknesses: keys.slice(0, 4).map((key) => ({
      questionRef: "Teacher flag",
      ...weaknessLibrary[key],
      evidence: data.notes ? `Teacher observation: ${data.notes}` : "This pattern was selected by the teacher. Add a question reference and the student’s actual working before treating it as a final conclusion."
    })),
    remediation: keys.slice(0, 3).map((key, index) => ({ priority: index + 1, ...remedyLibrary[key] }))
  };
}

function readHistory() {
  try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); }
  catch { return []; }
}

function saveHistory(entry) {
  const next = [entry, ...readHistory().filter((item) => item.id !== entry.id)].slice(0, 12);
  localStorage.setItem(historyKey, JSON.stringify(next));
  renderHistory();
}

function renderHistory() {
  const list = $("#historyList");
  list.replaceChildren();
  const history = readHistory();
  if (!history.length) {
    list.append(node("p", "empty-history", "No saved reports on this device yet."));
    return;
  }
  history.forEach((item) => {
    const row = node("div", "history-item");
    const open = node("button");
    open.type = "button";
    open.append(node("strong", "", `${item.student} · ${item.exam}`), node("small", "", new Date(item.createdAt).toLocaleString()));
    open.addEventListener("click", () => {
      renderReport(item.report, { student: item.student, detail: `${item.level} · ${item.exam}`, status: "Saved locally" });
      $("#reportPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const remove = node("button", "text-button danger", "Delete");
    remove.type = "button";
    remove.style.flex = "0 0 auto";
    remove.addEventListener("click", () => {
      localStorage.setItem(historyKey, JSON.stringify(readHistory().filter((entry) => entry.id !== item.id)));
      renderHistory();
    });
    row.append(open, remove);
    list.append(row);
  });
}

function updateFileCard(input, metaId) {
  const file = input.files[0];
  const meta = $(metaId);
  const card = input.closest(".file-card");
  card.classList.toggle("has-file", Boolean(file));
  if (!file) return;
  meta.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
}

$("#diagnosticForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const error = $("#formError");
  error.textContent = "";
  const student = $("#studentCode").value.trim();
  const exam = $("#examTitle").value.trim();
  const files = getFiles();
  if (!student || !exam) {
    error.textContent = "Enter a student code and examination title.";
    return;
  }
  if (!validatePdf(files.student) || (files.paper && !validatePdf(files.paper)) || (files.marking && !validatePdf(files.marking))) {
    error.textContent = "Select a valid marked student paper. Each selected PDF must be 15 MB or smaller.";
    return;
  }
  const total = Object.values(files).reduce((sum, file) => sum + (file ? file.size : 0), 0);
  if (total > 40 * 1024 * 1024) {
    error.textContent = "The combined PDF size must not exceed 40 MB.";
    return;
  }
  const awarded = Number($("#marksAwarded").value);
  const totalMarks = Number($("#totalMarks").value);
  const hasAnyScore = $("#marksAwarded").value !== "" || $("#totalMarks").value !== "";
  if (hasAnyScore && (!(awarded >= 0) || !(totalMarks > 0) || awarded > totalMarks)) {
    error.textContent = "Enter both score fields and ensure marks awarded do not exceed total marks.";
    return;
  }
  const data = {
    student,
    exam,
    level: $("#studentLevel").value,
    scope: $("#topicFocus").value.trim(),
    notes: $("#teacherNotes").value.trim(),
    strengths: $("#strengthEvidence").value.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    signals: selectedSignals(),
    hasOriginal: Boolean(files.paper),
    score: hasAnyScore ? { awarded, total: totalMarks, percentage: awarded / totalMarks * 100 } : null
  };
  const report = buildGuidedReport(data);
  const scoreLabel = data.score ? ` · ${data.score.percentage.toFixed(1)}%` : "";
  renderReport(report, { student, detail: `${data.level} · ${exam}${scoreLabel}`, status: "Marked-paper guided" });
  saveHistory({ id: crypto.randomUUID(), student, exam, level: data.level, createdAt: new Date().toISOString(), report });
  $("#reportPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#diagnosticForm").addEventListener("reset", () => {
  window.setTimeout(() => {
    $$(".file-card").forEach((card) => card.classList.remove("has-file"));
    $("#paperMeta").textContent = "Optional when unavailable";
    $("#studentMeta").textContent = "Include marks, ticks, corrections and teacher comments";
    $("#markingMeta").textContent = "Optional PDF · maximum 15 MB";
    $("#formError").textContent = "";
  }, 0);
});

$("#paperFile").addEventListener("change", (event) => updateFileCard(event.target, "#paperMeta"));
$("#studentFile").addEventListener("change", (event) => updateFileCard(event.target, "#studentMeta"));
$("#markingFile").addEventListener("change", (event) => updateFileCard(event.target, "#markingMeta"));
$("#printButton").addEventListener("click", () => window.print());
$("#clearHistoryButton").addEventListener("click", () => {
  if (confirm("Delete all locally saved reports from this browser?")) {
    localStorage.removeItem(historyKey);
    renderHistory();
  }
});
$("#sampleButton").addEventListener("click", () => {
  renderReport(demoReport, { student: "Sample Student", detail: "HKDSE · Chemical Equilibrium Test", status: "Demonstration" });
  $("#reportPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

renderReport(demoReport);
renderHistory();
