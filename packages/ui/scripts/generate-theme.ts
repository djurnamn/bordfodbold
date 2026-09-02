import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { generateAll } from "../src/config/generator";
import { bordfodboldTheme } from "../src/themes/bordfodbold";

const here = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(here, "..", "src", "styles", "generated");

mkdirSync(outputDirectory, { recursive: true });
for (const [fileName, content] of Object.entries(generateAll(bordfodboldTheme))) {
  writeFileSync(join(outputDirectory, fileName), content);
  console.log(`wrote styles/generated/${fileName}`);
}
