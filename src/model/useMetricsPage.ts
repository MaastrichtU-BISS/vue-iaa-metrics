import { computed, ref, watch } from "vue";
import type {
  DocumentOption,
  IaaInputData,
  IaaMetricsResponse,
  LabelOption,
  RichAnnotation,
} from "../types";
import type { AnnotationFilters, IaaParams, MetricsSource } from "./source";
import { anonymizeAnnotators } from "./anonymize";
import { subsetIaaInput, subsetProblem } from "./subset";
import { saveBlob } from "./saveBlob";

/**
 * Drives the metrics page's state and IAA orchestration through a
 * MetricsSource. Owns filter/options state, the browsable annotation list,
 * the cached whole-task IAA input, and the Compute Metrics / Download All
 * flows — the view layer only renders what this exposes.
 */
export function useMetricsPage(source: MetricsSource, onError: (message: string) => void) {
  const loadingOptions = ref(false);
  const loadingAnnotations = ref(false);
  const downloading = ref(false);
  const computingMetrics = ref(false);

  // Only reflects state that affects the page behind the results modal
  // (sidebar/annotations list) — Compute Metrics has its own loading state.
  const loading = computed(
    () => loadingAnnotations.value || downloading.value || loadingOptions.value,
  );

  const labelsOptions = ref<LabelOption[]>([]);
  const documentsOptions = ref<DocumentOption[]>([]);
  const annotatorsOptions = ref<string[]>([]);

  const selectedLabels = ref<string[]>([]);
  const selectedDocuments = ref<string[]>([]);
  const selectedAnnotators = ref<string[]>([]);

  const criterion = ref<"exact" | "contained">("exact");
  const granularity = ref<"char" | "word">("word");
  const iaaParams = computed<IaaParams>(() => ({
    criterion: criterion.value,
    granularity: granularity.value,
  }));

  const filters = computed<AnnotationFilters>(() => ({
    labels: selectedLabels.value,
    documents: selectedDocuments.value,
    annotators: selectedAnnotators.value,
  }));
  const hasFilters = computed(
    () => filters.value.labels.length + filters.value.documents.length + filters.value.annotators.length > 0,
  );

  const annotations = ref<RichAnnotation[]>([]);

  async function refreshAnnotations() {
    loadingAnnotations.value = true;
    try {
      annotations.value = await source.getAnnotations(filters.value);
    } catch (error) {
      onError(`Failed to load annotations: ${error}`);
    } finally {
      loadingAnnotations.value = false;
    }
  }

  watch([selectedLabels, selectedDocuments, selectedAnnotators], refreshAnnotations);

  // The whole-task IAA input. Fetched once on init (needed up front to know
  // whether this is a document-level task, for the granularity/criterion
  // toggles) and reused for the rest of the session.
  const iaaInput = ref<IaaInputData>();
  const isDocumentLevel = computed(() => iaaInput.value?.annotation_level === "document");

  // Compute Metrics / Download apply the same filters as the list: the
  // cached input is narrowed in the browser, so the IAA service only ever
  // receives - and computes over - the selected subset. Reports a subset
  // that can't be computed through onError and returns undefined.
  function filteredInput(): IaaInputData | undefined {
    if (!iaaInput.value) return undefined;
    let subset: IaaInputData;
    try {
      subset = subsetIaaInput(iaaInput.value, filters.value);
    } catch (error) {
      onError(`Failed to apply filters: ${error}`);
      return undefined;
    }
    const problem = subsetProblem(iaaInput.value, subset);
    if (problem) {
      onError(problem);
      return undefined;
    }
    return subset;
  }

  const metricsModalVisible = ref(false);
  const metricsResult = ref<IaaMetricsResponse>();

  async function computeMetrics() {
    const input = filteredInput();
    if (!input) return;
    metricsModalVisible.value = true;
    computingMetrics.value = true;
    try {
      metricsResult.value = await source.computeMetrics(input, iaaParams.value);
    } catch (error) {
      onError(`Failed to compute metrics: ${error}`);
      metricsModalVisible.value = false;
    } finally {
      computingMetrics.value = false;
    }
  }

  // "Download All" gates on an anonymize choice first. The modal is shown by
  // the component; resolveAnonymizeChoice lets it hand the answer back here.
  const anonymizeConfirmVisible = ref(false);
  let resolveAnonymizeChoice: ((choice: boolean | undefined) => void) | null = null;

  function resolveAnonymizeConfirm(choice: boolean | undefined) {
    anonymizeConfirmVisible.value = false;
    resolveAnonymizeChoice?.(choice);
    resolveAnonymizeChoice = null;
  }

  async function downloadReport(filename = "iaa_report.zip") {
    const filtered = filteredInput();
    if (!filtered) return;
    anonymizeConfirmVisible.value = true;
    const anonymize = await new Promise<boolean | undefined>((resolve) => {
      resolveAnonymizeChoice = resolve;
    });
    if (anonymize === undefined) return; // dismissed without choosing

    downloading.value = true;
    try {
      const input = anonymize ? anonymizeAnnotators(filtered) : filtered;
      const blob = await source.downloadReport(input, iaaParams.value);
      saveBlob(blob, filename);
    } catch (error) {
      onError(`Failed to download report: ${error}`);
    } finally {
      downloading.value = false;
    }
  }

  async function init() {
    loadingOptions.value = true;
    try {
      const [labels, annotators, documents, input] = await Promise.all([
        source.getLabels(),
        source.getAnnotators(),
        source.getDocuments(),
        source.getIaaInputData(),
      ]);
      labelsOptions.value = labels;
      annotatorsOptions.value = annotators;
      documentsOptions.value = documents;
      iaaInput.value = input;
    } catch (error) {
      onError(`Failed to load metrics page: ${error}`);
    } finally {
      loadingOptions.value = false;
    }
    await refreshAnnotations();
  }

  return {
    loading,
    labelsOptions,
    documentsOptions,
    annotatorsOptions,
    selectedLabels,
    selectedDocuments,
    selectedAnnotators,
    hasFilters,
    criterion,
    granularity,
    isDocumentLevel,
    annotations,
    loadingAnnotations,
    metricsModalVisible,
    metricsResult,
    computingMetrics,
    computeMetrics,
    anonymizeConfirmVisible,
    resolveAnonymizeConfirm,
    downloadReport,
    downloading,
    init,
  };
}
