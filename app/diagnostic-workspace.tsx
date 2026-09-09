"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Atom,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  FlaskConical,
  Loader2,
  Globe2,
  Printer,
  Route,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

type Strength = { concept: string; evidence: string; confidence: string };
type Weakness = {
  questionRef: string;
  classification: string;
  knowledgePoint: string;
  whyWrong: string;
  evidence: string;
  correction: string;
};
type Remedy = {
  priority: number;
  focus: string;
  keywords: string[];
  formulas: string[];
  action: string;
  successCheck: string;
};
type DiagnosticReport = {
  overview: string;
  strengths: Strength[];
  weaknesses: Weakness[];
  remediation: Remedy[];
};

const demoReport: DiagnosticReport = {
  overview: "The student understands basic reaction direction and particle-level descriptions, but repeatedly loses marks in equilibrium calculations, translating question conditions, and using complete marking keywords.",
  strengths: [
    {
      concept: "Recognition of acid–base and ionic reactions",
      evidence: "The student identifies the main ions correctly and writes most net ionic equations accurately, showing a secure particle-level foundation.",
      confidence: "High confidence",
    },
    {
      concept: "Predicting shifts in chemical equilibrium",
      evidence: "The student predicts the direction of equilibrium shifts after concentration changes and generally applies Le Chatelier’s principle correctly.",
      confidence: "Medium–high confidence",
    },
  ],
  weaknesses: [
    {
      questionRef: "Q6(b)(ii)",
      classification: "Calculation-logic error",
      knowledgePoint: "The form of a Kc expression and its powers",
      whyWrong: "The stoichiometric coefficient was used as a multiplier instead of as the power of concentration. This is not a simple arithmetic slip; the definition of Kc has not been fully internalised.",
      evidence: "The student wrote 2[NO₂] ÷ [N₂O₄] instead of [NO₂]² ÷ [N₂O₄].",
      correction: "Start from the balanced equation, write each concentration term, convert coefficients into powers, and omit pure solids and liquids.",
    },
    {
      questionRef: "Q8(a)",
      classification: "Scientific-language omission",
      knowledgePoint: "Collision theory and reaction rate",
      whyWrong: "The answer states only that collisions increase, but does not explain that the frequency of effective collisions with sufficient energy increases.",
      evidence: "The scientific direction is correct, but the wording is incomplete and misses the marking point.",
      correction: "Use a three-part rate explanation: particle change → effective collision frequency → reaction rate.",
    },
  ],
  remediation: [
    {
      priority: 1,
      focus: "Rebuild Kc expressions",
      keywords: ["equilibrium concentration", "stoichiometric coefficient", "power", "omit pure solids and liquids"],
      formulas: ["Kc = product of [products]^coefficient ÷ product of [reactants]^coefficient"],
      action: "Complete six questions that require only the Kc expression, followed by three ICE-table questions.",
      successCheck: "Write five consecutive Kc expressions correctly within 90 seconds.",
    },
    {
      priority: 2,
      focus: "Complete marking keywords in explanation questions",
      keywords: ["effective collision", "sufficient energy", "frequency", "activation energy"],
      formulas: [],
      action: "Rewrite incorrect answers using observation, particle explanation, and result. Highlight each phrase that matches the marking scheme.",
      successCheck: "Meet every marking point in similar explanation questions instead of stating only the conclusion.",
    },
  ],
};

const signals = [
  ["equation", "Equation balancing or state symbols"],
  ["oxidation", "Oxidation number, charge, or electron transfer"],
  ["equilibrium", "Kc or equilibrium calculations"],
  ["calculation", "Working steps, units, or significant figures"],
  ["wording", "Incomplete explanation keywords"],
  ["reading", "Misreading, copied data, or answer scope"],
] as const;

type FileKind = "paper" | "student" | "marking";

function FileDrop({
  kind,
  title,
  hint,
  required,
  file,
  onFile,
}: {
  kind: FileKind;
  title: string;
  hint: string;
  required?: boolean;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <div className={`rounded-xl border p-3.5 transition ${file ? "border-emerald-300 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-cyan-300"}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${file ? "bg-emerald-100 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
            {file ? <FileCheck2 className="size-5" /> : <FileText className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[0.95rem] font-semibold text-slate-800">
              {title} {required && <span className="text-rose-600">*</span>}
            </p>
            <p className="text-xs leading-5 text-slate-500">{hint}</p>
          </div>
        </div>
        {file && (
          <button type="button" aria-label={`Remove ${title}`} onClick={() => onFile(null)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700">
            <X className="size-4" />
          </button>
        )}
      </div>
      {file ? (
        <p className="truncate rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-emerald-800">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-sky-50">
          <UploadCloud className="size-4" /> Choose PDF
          <input
            className="sr-only"
            type="file"
            name={kind}
            accept="application/pdf,.pdf"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

export default function DiagnosticWorkspace() {
  const [files, setFiles] = useState<Record<FileKind, File | null>>({ paper: null, student: null, marking: null });
  const [level, setLevel] = useState("HKDSE");
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [report, setReport] = useState<DiagnosticReport>(demoReport);
  const [studentLabel, setStudentLabel] = useState("Sample Student");
  const [source, setSource] = useState<"demo" | "ai" | "guided">("demo");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalSize = useMemo(
    () => Object.values(files).reduce((sum, file) => sum + (file?.size ?? 0), 0),
    [files],
  );

  function setFile(kind: FileKind, file: File | null) {
    if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file && file.size > 15 * 1024 * 1024) {
      toast.error("Each PDF must be no larger than 15 MB.");
      return;
    }
    setFiles((current) => ({ ...current, [kind]: file }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.student) {
      toast.error("Upload the marked student paper.");
      return;
    }
    if (totalSize > 40 * 1024 * 1024) {
      toast.error("The combined PDF size must not exceed 40 MB.");
      return;
    }

    const form = new FormData(event.currentTarget);
    form.set("level", level);
    form.set("signals", JSON.stringify(selectedSignals));
    form.set("student", files.student);
    if (files.paper) form.set("paper", files.paper);
    if (files.marking) form.set("marking", files.marking);

    setBusy(true);
    setProgress(18);
    const ticker = window.setInterval(() => setProgress((value) => Math.min(value + 9, 86)), 700);
    try {
      const response = await fetch("/api/diagnostics", { method: "POST", body: form });
      const payload = (await response.json()) as { error?: string; report?: DiagnosticReport; reportSource?: "ai" | "guided"; studentName?: string; notice?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "The report could not be generated.");
      setProgress(100);
      setReport(payload.report);
      setStudentLabel(payload.studentName || "Student");
      setSource(payload.reportSource || "guided");
      toast.success(payload.notice || "The learning diagnostic report is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Processing failed. Please try again.");
    } finally {
      window.clearInterval(ticker);
      window.setTimeout(() => setProgress(0), 800);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Toaster position="top-right" richColors />
      <header className="no-print border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#0e2943] text-[#7ee0cf] shadow-sm"><Atom className="size-6" /></span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">Chemistry Learning Diagnostic Centre</p>
              <p className="text-xs font-medium text-slate-500">Find the cause of every lost mark · Build the next remediation path</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:flex">
            <Globe2 className="size-3.5" /> Public access · Anonymous records
          </div>
        </div>
      </header>

      <div className="no-print mx-auto max-w-[1500px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {[
            ["01", "Upload evidence", "Paper + response"],
            ["02", "Diagnose", "Concept + cause"],
            ["03", "Build report", "Remedy + check"],
          ].map(([number, title, detail], index) => (
            <div key={number} className={`flex items-center gap-3 px-3 py-3 sm:px-5 ${index < 2 ? "border-r border-slate-200" : ""}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-black ${index === 0 ? "bg-[#0b6583] text-white" : "bg-slate-100 text-slate-500"}`}>{number}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{title}</p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">{detail}</p>
              </div>
              {index < 2 && <ChevronRight className="ml-auto hidden size-4 text-slate-300 md:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(360px,0.78fr)_minmax(580px,1.42fr)] lg:px-8">
        <section className="no-print overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,43,65,0.06)]">
          <div className="border-b border-slate-200 bg-[#0e2943] px-5 py-4 text-white">
            <div className="flex items-center gap-2"><FlaskConical className="size-5 text-[#7ee0cf]" /><h1 className="text-lg font-bold">Create a New Diagnosis</h1></div>
            <p className="mt-1 text-sm leading-6 text-slate-300">Upload the marked student paper. The original paper and marking scheme are optional supporting evidence.</p>
          </div>

          <form onSubmit={submit} className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="studentName">Student name or code</Label>
                <Input id="studentName" name="studentName" placeholder="e.g. S6-A17" required />
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={level} onValueChange={(value) => value && setLevel(value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S1-S3">Secondary 1–3 Science</SelectItem>
                    <SelectItem value="S4-S5">S4–S5 Chemistry</SelectItem>
                    <SelectItem value="HKDSE">HKDSE Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="examTitle">Test or examination title</Label>
                <Input id="examTitle" name="examTitle" placeholder="e.g. 2026 Mock Paper 1" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topicFocus">Analysis scope</Label>
                <Input id="topicFocus" name="topicFocus" placeholder="Whole paper or Topic X: Equilibrium" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between"><Label>PDF evidence</Label><span className="text-xs text-slate-500">Up to 15 MB each</span></div>
              <FileDrop kind="student" title="Marked student paper" hint="Include marks, ticks, corrections, comments, and all working steps" required file={files.student} onFile={(file) => setFile("student", file)} />
              <FileDrop kind="paper" title="Original examination paper" hint="Optional when unavailable; improves question-context checking" file={files.paper} onFile={(file) => setFile("paper", file)} />
              <FileDrop kind="marking" title="Marking reference" hint="Optional official scheme or teacher marking guide" file={files.marking} onFile={(file) => setFile("marking", file)} />
            </div>

            <div className="space-y-2.5">
              <div>
                <Label>Quick error indicators <span className="font-normal text-slate-400">(optional)</span></Label>
                <p className="mt-1 text-xs leading-5 text-slate-500">These indicators can generate a preliminary remediation report when visual analysis is unavailable.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {signals.map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-700 hover:bg-slate-50">
                    <Checkbox
                      checked={selectedSignals.includes(value)}
                      onCheckedChange={(checked) => setSelectedSignals((items) => checked ? [...items, value] : items.filter((item) => item !== value))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacherNotes">Teacher observation or analysis focus <span className="font-normal text-slate-400">(optional)</span></Label>
              <Textarea id="teacherNotes" name="teacherNotes" rows={3} placeholder="e.g. Check Q6–Q10 closely. The student often gives a conclusion without a chemical explanation." />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
              <div className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>This is a public tool. Remove identity numbers, phone numbers, addresses, and other unnecessary personal data before uploading. A student code is sufficient.</p></div>
            </div>

            {progress > 0 && <Progress value={progress} className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-[#168676]" />}
            <Button type="submit" disabled={busy} className="h-12 w-full bg-[#0b6583] text-base font-bold shadow-sm hover:bg-[#084f68]">
              {busy ? <><Loader2 className="size-5 animate-spin" />Reading and comparing PDFs…</> : <><BrainCircuit className="size-5" />Generate Learning Diagnosis</>}
            </Button>
          </form>
        </section>

        <section className="print-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,43,65,0.07)]">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0b6583]">Learning Diagnostic Report</p>
                  <Badge variant="outline" className={source === "ai" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                    {source === "ai" ? "AI deep analysis" : source === "guided" ? "Preliminary diagnosis" : "Sample report"}
                  </Badge>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{studentLabel} | Chemistry Learning Diagnostic Report</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{report.overview}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => window.print()} className="no-print shrink-0"><Printer className="size-4" />Print / Save as PDF</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-3 py-3 text-center"><p className="text-2xl font-black text-emerald-700">{report.strengths.length}</p><p className="text-xs font-semibold text-slate-500">Mastered concepts</p></div>
            <div className="border-r border-slate-200 px-3 py-3 text-center"><p className="text-2xl font-black text-rose-700">{report.weaknesses.length}</p><p className="text-xs font-semibold text-slate-500">Priority causes</p></div>
            <div className="px-3 py-3 text-center"><p className="text-2xl font-black text-[#0b6583]">{report.remediation.length}</p><p className="text-xs font-semibold text-slate-500">Remediation tasks</p></div>
          </div>

          <Tabs defaultValue="weakness" className="p-5 sm:p-7">
            <TabsList className="no-print grid h-auto w-full grid-cols-3 bg-slate-100 p-1">
              <TabsTrigger value="strength" className="py-2.5"><CheckCircle2 className="size-4" />Strengths</TabsTrigger>
              <TabsTrigger value="weakness" className="py-2.5"><AlertTriangle className="size-4" />Weaknesses</TabsTrigger>
              <TabsTrigger value="remediation" className="py-2.5"><Route className="size-4" />Remediation</TabsTrigger>
            </TabsList>

            <TabsContent value="strength" className="mt-5 space-y-3">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800"><Sparkles className="size-4" />Confirm mastery from answer evidence rather than the total score alone.</div>
              {report.strengths.map((item, index) => (
                <article key={`${item.concept}-${index}`} className="rounded-xl border border-emerald-200 bg-emerald-50/55 p-4">
                  <div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-black text-white">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{item.concept}</h3><Badge className="bg-white text-emerald-700 hover:bg-white">{item.confidence}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-650">{item.evidence}</p></div></div>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="weakness" className="mt-5 space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900"><strong>Diagnostic focus:</strong> Separate conceptual gaps, calculation logic, careless reading, and missing marking keywords, then identify exactly where the error occurred.</div>
              {report.weaknesses.map((item, index) => (
                <article key={`${item.questionRef}-${index}`} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"><Badge className="bg-[#0e2943] text-white">{item.questionRef}</Badge><Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{item.classification}</Badge><h3 className="font-bold text-slate-900">{item.knowledgePoint}</h3></div>
                  <div className="grid gap-0 md:grid-cols-2">
                    <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r"><p className="mb-1 text-xs font-black uppercase tracking-wider text-rose-700">Why it went wrong</p><p className="text-sm leading-6 text-slate-700">{item.whyWrong}</p><p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><strong>Answer evidence: </strong>{item.evidence}</p></div>
                    <div className="p-4"><p className="mb-1 text-xs font-black uppercase tracking-wider text-emerald-700">How to correct it</p><p className="text-sm leading-6 text-slate-700">{item.correction}</p></div>
                  </div>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="remediation" className="mt-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0b6583]"><Route className="size-4" />Prioritised by prerequisite knowledge and mark impact. Pass each check before moving on.</div>
              {report.remediation.map((item) => (
                <article key={`${item.priority}-${item.focus}`} className="rounded-xl border border-sky-200 bg-sky-50/45 p-4">
                  <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0b6583] text-sm font-black text-white">P{item.priority}</span><div className="min-w-0 flex-1"><h3 className="text-base font-extrabold text-slate-900">{item.focus}</h3><div className="mt-2 flex flex-wrap gap-1.5">{item.keywords.map((word) => <Badge key={word} variant="outline" className="bg-white text-slate-700">{word}</Badge>)}</div>{item.formulas.length > 0 && <div className="mt-3 rounded-lg border border-sky-100 bg-white px-3 py-2 font-mono text-sm font-semibold text-[#0b6583]">{item.formulas.join(" · ")}</div>}<p className="mt-3 text-sm leading-6 text-slate-700"><strong>Practice plan: </strong>{item.action}</p><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span><strong>Success criterion: </strong>{item.successCheck}</span></p></div></div>
                </article>
              ))}
            </TabsContent>
          </Tabs>

          <div className="border-t border-slate-200 bg-[#0e2943] px-5 py-3.5 text-xs leading-5 text-slate-300 sm:px-7">
            <div className="flex items-start gap-2"><Atom className="mt-0.5 size-4 shrink-0 text-[#7ee0cf]" /><p>This report may be generated from the marked student paper alone. When the original paper is unavailable, treat unverified question wording and marking points with lower confidence.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
