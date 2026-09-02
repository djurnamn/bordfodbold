// The default djui config IS the default theme. It is authored in
// `src/themes/default.ts` as a complete config over the palette-agnostic base;
// this module re-exports it under the historical `defaultConfig` name (the
// handle the generator, `defineConfig`, and the preview tooling resolve).
export { defaultTheme as defaultConfig } from "../themes/default";
