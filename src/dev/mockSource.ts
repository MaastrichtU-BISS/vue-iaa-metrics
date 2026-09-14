import type { AnnotationFilters, IaaParams, MetricsSource } from "../model/source";
import type { IaaInputData, RichAnnotation } from "../types";
import { sortByDocumentAndRange } from "../model/format";
import { documents, labelset } from "./fixture";

// Routed through the Vite dev server's proxy (see vite.config.ts) to
// `lawnotation-iaa --serve` running locally — see that repo's README for how
// to start it. Compute Metrics / Download All will surface a clear error
// (via the `error` event) if it isn't running. A real host would proxy
// through its own backend instead (the Go service has no CORS support).
const IAA_BASE_URL = "/iaa";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function allAnnotations(): RichAnnotation[] {
  const result: RichAnnotation[] = [];
  let id = 0;
  for (const doc of documents) {
    for (const assignment of doc.assignments) {
      for (const ann of assignment.annotations) {
        result.push({
          start: ann.start,
          end: ann.end,
          text: ann.text,
          label: ann.label,
          annotator: assignment.annotator,
          ann_id: ++id,
          doc_id: doc.id,
          doc_name: doc.name,
          confidence: ann.confidence,
          metadata: ann.metadata,
        });
      }
    }
  }
  return result;
}

async function callIaa(path: string, input: IaaInputData, params: IaaParams): Promise<Response> {
  const url = `${IAA_BASE_URL}${path}?criterion=${params.criterion}&granularity=${params.granularity}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      `Could not reach the IAA service at ${IAA_BASE_URL}. Run it locally from lawnotation-iaa: ` +
        `go run . --serve --port 8080`,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error ?? `IAA service error (${response.status})`);
  }
  return response;
}

export const mockSource: MetricsSource = {
  async getLabels() {
    await delay(150);
    return labelset;
  },

  async getAnnotators() {
    await delay(150);
    const set = new Set<string>();
    for (const doc of documents) for (const a of doc.assignments) set.add(a.annotator);
    return [...set];
  },

  async getDocuments() {
    await delay(150);
    return documents.map((d) => ({ value: d.id, label: `${d.id} - ${d.name}` }));
  },

  async getAnnotations(filters: AnnotationFilters) {
    await delay(250);
    let anns = allAnnotations();
    if (filters.labels.length) anns = anns.filter((a) => filters.labels.includes(a.label));
    if (filters.documents.length) anns = anns.filter((a) => filters.documents.includes(a.doc_id));
    if (filters.annotators.length) anns = anns.filter((a) => filters.annotators.includes(a.annotator));
    sortByDocumentAndRange(anns);
    return anns;
  },

  async getIaaInputData(): Promise<IaaInputData> {
    await delay(150);
    return {
      labelset: { labels: labelset.map((l) => ({ name: l.name })) },
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        full_text: doc.full_text,
        assignments: doc.assignments.map((ass) => ({
          annotator: ass.annotator,
          difficulty_rating: ass.difficulty_rating,
          annotations: ass.annotations.map((a) => ({
            start: a.start,
            end: a.end,
            label: a.label,
            text: a.text,
          })),
        })),
      })),
    };
  },

  async computeMetrics(input, params) {
    const response = await callIaa("/metrics", input, params);
    return response.json();
  },

  async downloadReport(input, params) {
    const response = await callIaa("/report.zip", input, params);
    return response.blob();
  },
};
