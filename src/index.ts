// Public entry point for the package.
export { default as MetricsPage } from "./components/MetricsPage.vue";
export * from "./types";
export * from "./model/source";
export { useMetricsPage } from "./model/useMetricsPage";
export { anonymizeAnnotators } from "./model/anonymize";
export { stripAnnotatorPrefix, formatNullableFloat, sortByDocumentAndRange } from "./model/format";
