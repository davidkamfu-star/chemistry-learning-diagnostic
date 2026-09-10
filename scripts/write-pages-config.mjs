import { writeFile } from "node:fs/promises";

const config = {
  visionApiUrl: String(process.env.VISION_API_URL || "https://chemistry-learning-diagnostic.vercel.app/api/analyze").trim(),
  maxVisionPages: 30,
  visionPagesPerBatch: 2,
};

await writeFile(
  new URL("../docs/config.js", import.meta.url),
  `window.CHEM_DIAGNOSTIC_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`,
  "utf8",
);
