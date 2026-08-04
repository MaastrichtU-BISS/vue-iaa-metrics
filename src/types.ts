// The IAA service's input schema — a set of documents, each with per-annotator
// span or whole-document annotations. Matches the JSON the Go IAA service
// (https://github.com/.../lawnotation-iaa) expects as its request body.

export type IaaAnnotation = {
  start: number;
  end: number;
  label: string;
  text: string;
};

export type IaaAssignment = {
  annotator: string;
  difficulty_rating: number;
  annotations: IaaAnnotation[];
};

export type IaaDocument = {
  name: string;
  full_text: string;
  assignments: IaaAssignment[];
};

export type IaaInputData = {
  labelset: { labels: { name: string }[] };
  documents: IaaDocument[];
  /** Omitted for span-level tasks; "document" for whole-document tagging. */
  annotation_level?: "document";
};

// The IAA service's response shape.

export type NullableFloat = number | null;

export type PairResult = {
  true_positives: number;
  ref_span_count: number;
  sys_span_count: number;
  documents_compared: number;
  precision: NullableFloat;
  recall: NullableFloat;
  f1: NullableFloat;
};

export type SpanMatchingSummary = {
  macro_f1: NullableFloat;
  // outer key "annotator_<A>_vs_annotator_<B>", inner key "annotator_<A>_as_reference" / "annotator_<B>_as_reference"
  // null entirely when annotation_level == "document"
  pairs: Record<string, Record<string, PairResult>> | null;
};

export type CoverageAgreement = {
  matrix_items: number;
  krippendorff_alpha: NullableFloat;
  // key "annotator_<A>_vs_annotator_<B>"
  cohen_kappa_pairs: Record<string, NullableFloat>;
};

export type LabelResult = {
  // key "annotator_<id>"
  span_counts_per_annotator: Record<string, number>;
  span_matching: SpanMatchingSummary;
  coverage_agreement: CoverageAgreement;
};

export type IaaMeta = {
  input_file: string;
  annotation_level: string;
  criterion: string;
  granularity: string;
  annotators: string[];
  num_documents: number;
  notes: Record<string, string>;
};

export type IaaReport = {
  meta: IaaMeta;
  per_label: Record<string, LabelResult>;
};

export type DifficultyRatingSummary = {
  total: number;
  rated: number;
  mean: NullableFloat;
  counts: Record<string, number>; // keys "1".."5"
  krippendorff_alpha: NullableFloat;
  // key "annotator_<A>_vs_annotator_<B>"
  krippendorff_alpha_pairs: Record<string, NullableFloat>;
};

export type IaaMetricsResponse = {
  annotation_metrics: IaaReport;
  confidence_metrics: DifficultyRatingSummary;
};

// UI-facing types — the browsable annotation list and filter option lists.

export type RichAnnotation = {
  start: number;
  end: number;
  text: string;
  label: string;
  annotator: string;
  ann_id: number;
  doc_id: string;
  doc_name?: string;
  confidence: number;
  metadata?: string;
};

export type LabelOption = { name: string; color: string };
export type DocumentOption = { value: string; label: string };
