import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bordfodbold/ui", "@bordfodbold/domain"],
  sassOptions: {
    // The copied djui stylesheets resolve `@use "styles/..."` and the theme
    // seams by load path; the ui package's source root is that path.
    loadPaths: [join(here, "..", "ui", "src")],
  },
};

export default nextConfig;
