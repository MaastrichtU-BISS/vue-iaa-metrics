import type {
  DocumentOption,
  IaaInputData,
  IaaMetricsResponse,
  LabelOption,
  RichAnnotation,
} from "../types";

export type AnnotationFilters = {
  /** Span labels (or the only labels, for non-hybrid tasks). */
  labels: string[];
  documents: string[];
  annotators: string[];
  /** Hybrid tasks only: the selected whole-document labels. Empty/absent means all. */
  documentLabels?: string[];
  /** Hybrid tasks only: leave out span annotations altogether ("None" picked
   * for the span labels). `labels` is then ignored. */
  noSpanLabels?: boolean;
  /** Hybrid tasks only: leave out document annotations altogether ("None"
   * picked for the document labels). `documentLabels` is then ignored. */
  noDocumentLabels?: boolean;
};

export type IaaParams = {
  criterion: "exact" | "contained";
  granularity: "char" | "word";
};

/**
 * The host's data-access contract. The package only ever asks for filter
 * options, a filtered annotation list, the whole-task IAA input, and to
 * compute/download a report — whether those resolve via tRPC + Supabase, a
 * REST API, or an in-memory fixture is entirely up to the implementation.
 *
 * computeMetrics/downloadReport are host-implemented on purpose: the IAA Go
 * service has no CORS or auth handling, so it's never meant to be called
 * directly from the browser — hosts proxy it through their own backend.
 */
export interface MetricsSource {
  getLabels(): Promise<LabelOption[]> | LabelOption[];
  /** Hybrid tasks only: the whole-document labelset. Omit for other tasks. */
  getDocumentLabels?(): Promise<LabelOption[]> | LabelOption[];
  getAnnotators(): Promise<string[]> | string[];
  getDocuments(): Promise<DocumentOption[]> | DocumentOption[];
  /** The browsable, filtered annotation list for the right-hand panel. */
  getAnnotations(filters: AnnotationFilters): Promise<RichAnnotation[]>;
  /**
   * The whole-task IAA input — always unfiltered, built once and cached by
   * the package for the rest of the session (a refresh drops the cache).
   */
  getIaaInputData(): Promise<IaaInputData>;
  computeMetrics(input: IaaInputData, params: IaaParams): Promise<IaaMetricsResponse>;
  downloadReport(input: IaaInputData, params: IaaParams): Promise<Blob>;
}
