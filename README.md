# Chemistry Learning Diagnostic Centre

An English and Traditional Chinese learning-diagnostic system for chemistry teachers and students. It organises marked-paper evidence into:

1. strengths supported by correct work;
2. weakness detection with likely causes and exact knowledge points; and
3. a prioritised remediation pathway with keywords, formulas, practice actions, and completion checks.

## Public GitHub Pages edition

The `docs/` directory contains a privacy-first static edition designed for GitHub Pages. Selected PDFs remain inside the visitor's browser and are not uploaded. The edition provides:

- marked student paper as the only required PDF;
- optional original paper and marking reference;
- local PDF selection and size validation;
- teacher-guided error classification;
- English / Traditional Chinese interface and diagnostic-report generation;
- question-specific wrong-answer evidence: question reference, primary cause, exact knowledge point, and marked-paper evidence;
- expanded reports with mastery judgement, demonstrated skill, assessment impact, observed-versus-expected response, root-cause reasoning, correction steps, diagnostic checks, prerequisite knowledge, formula conditions, three-stage practice, spaced review, and measurable success criteria;
- automatic in-browser text extraction for text-based uploaded PDFs;
- automatic local OCR for scan-only pages, using English and Traditional Chinese recognition;
- optional, consent-based page-image review for handwriting, teacher ticks/crosses, chemical structures, diagrams and graphs through a separately deployed secure backend;
- batched compressed-page transfer, so large marked papers can be reviewed without putting an API key in the browser;
- automatic mapping to all HKDSE Chemistry Topics I–XV, with ranked subtopics, revision keywords, formulas/rules, targeted practice, and measurable topic success checks;
- explicit evidence-source and confidence states: text layer, local OCR, teacher evidence, or visual AI;
- browser-local report history; and
- print or Save as PDF output.

Without a configured backend, the static edition remains honest about its limits and produces only a local OCR/teacher-guided preliminary report. With the backend enabled, it renders every marked-paper page in the browser, sends small compressed batches for high-detail visual inspection, and synthesises the verified observations into the detailed report. The API credential remains server-side.

## Enable hybrid OCR + visual AI

The `backend/` directory is a dependency-free Vercel Function. It never writes uploaded pages to application storage. The browser sends up to two compressed page images per request, the function asks a vision-capable OpenAI model to extract page evidence, and a final text-only request synthesises the whole-paper report.

1. Import this GitHub repository into Vercel and set **Root Directory** to `backend`.
2. Add the Vercel environment variable `OPENAI_API_KEY`.
3. Add `ALLOWED_ORIGINS=https://davidkamfu-star.github.io`.
4. Optionally set `OPENAI_MODEL`; the default is `gpt-5.6`.
5. Deploy and copy the endpoint, for example `https://your-project.vercel.app/api/analyze`.
6. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and create `VISION_API_URL` with that endpoint.
7. Run the **Deploy GitHub Pages** workflow again.

The public page will show **Secure backend ready** when the connection succeeds. Visual review is opt-in for every report. Configure Vercel Firewall/rate limits and OpenAI project spend limits before broad public distribution.

The backend intentionally splits page inspection from report synthesis. This avoids Vercel's per-request payload limit while retaining page-level evidence across a marked paper. The default frontend cap is 30 pages per PDF and can be changed in `docs/config.js`.

## Full Sites edition

The root application is a Vinext/Cloudflare Worker project with D1 and R2 bindings. It supports server-side case records, PDF storage, and an optional visual-analysis model configured through protected runtime environment variables.

## Repository structure

- `docs/` — hybrid local OCR + GitHub Pages frontend
- `backend/` — secure visual-analysis Vercel Function
- `.github/workflows/pages.yml` — automatic Pages deployment
- `app/` — full Vinext application and diagnostic API
- `db/` and `drizzle/` — diagnostic case schema and migration
- `.openai/hosting.json` — Sites runtime bindings

## Local preview of the public edition

Serve the `docs/` directory with any static web server, for example:

```sh
python3 -m http.server 4173 --directory docs
```

Then open `http://localhost:4173/`.

## Privacy

Use student codes instead of names. Selectable text and OCR stay in the browser. When visual review is explicitly enabled, compressed page images and local OCR text are transmitted to the configured backend and model provider for analysis; the application backend does not persist them. Report metadata saved in browser local storage remains on that device until it is deleted.
