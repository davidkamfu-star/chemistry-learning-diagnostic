# Visual-analysis backend

This folder deploys as a standalone Vercel project and keeps the OpenAI API key out of the public GitHub Pages frontend.

Required environment variables:

- `OPENAI_API_KEY`
- `ALLOWED_ORIGINS=https://davidkamfu-star.github.io`

Optional:

- `OPENAI_MODEL` (defaults to `gpt-5.6`)

Deploy with this folder selected as the Vercel project's root directory. The public endpoint is `/api/analyze`. It supports:

- `GET` health checks;
- `POST { mode: "extract" }` for batches of one to three rendered pages; and
- `POST { mode: "synthesize" }` for the final evidence-led DSE report.

The function does not persist page images. The in-memory request counter is only a basic abuse-control layer; enable Vercel Firewall/rate limiting and OpenAI project spend limits before public use.
