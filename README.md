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
- browser-local report history; and
- print or Save as PDF output.

The static edition is deliberately honest about its limits: it does not claim to have inspected a PDF and does not expose an AI credential in client-side code.

## Full Sites edition

The root application is a Vinext/Cloudflare Worker project with D1 and R2 bindings. It supports server-side case records, PDF storage, and an optional visual-analysis model configured through protected runtime environment variables.

## Repository structure

- `docs/` — static privacy-first GitHub Pages site
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

Use student codes instead of names. The GitHub Pages edition does not transmit selected files, but report metadata saved in browser local storage remains on that device until it is deleted.
