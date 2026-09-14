<script setup lang="ts">
import { onMounted } from "vue";
import type { MetricsSource } from "../model/source";
import { useMetricsPage } from "../model/useMetricsPage";
import ParametersColumn from "./ParametersColumn.vue";
import AnnotationsList from "./AnnotationsList.vue";
import ResultsModal from "./ResultsModal.vue";
import ConfirmModal from "./ConfirmModal.vue";
import Spinner from "./Spinner.vue";

// Host-facing entry point: filters + Compute Metrics / Download on the
// left, the browsable filtered annotation list on the right. All data flows
// through the given MetricsSource; this component owns no persistence or
// network logic itself.
const props = defineProps<{
  source: MetricsSource;
  /** Filename used when saving a downloaded report. */
  reportFilename?: string;
}>();

const emit = defineEmits<{
  error: [message: string];
  "open-document": [doc: { id: string; name: string }];
}>();

const {
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
  metricsModalVisible,
  metricsResult,
  computingMetrics,
  computeMetrics,
  anonymizeConfirmVisible,
  resolveAnonymizeConfirm,
  downloadReport,
  downloading,
  init,
} = useMetricsPage(props.source, (message) => emit("error", message));

onMounted(() => init());
</script>

<template>
  <div class="metrics-page">
    <div class="metrics-page__body">
      <aside class="metrics-page__sidebar">
        <ParametersColumn
          v-model:selected-labels="selectedLabels"
          v-model:selected-documents="selectedDocuments"
          v-model:selected-annotators="selectedAnnotators"
          v-model:criterion="criterion"
          v-model:granularity="granularity"
          :labels-options="labelsOptions"
          :documents-options="documentsOptions"
          :annotators-options="annotatorsOptions"
          :document-level="isDocumentLevel"
          :has-filters="hasFilters"
          :computing-metrics="computingMetrics"
          :downloading="downloading"
          @compute-metrics="computeMetrics"
          @download-all="downloadReport(reportFilename)"
        />
      </aside>
      <main class="metrics-page__main">
        <AnnotationsList
          :annotations="annotations"
          :labels="labelsOptions"
          :loading="loading && !downloading"
          :document-level="isDocumentLevel"
          @open-document="(doc) => emit('open-document', doc)"
        />
        <div v-if="downloading" class="metrics-page__dimmer">
          <Spinner :size="40" />
        </div>
      </main>
    </div>

    <ResultsModal
      v-model:visible="metricsModalVisible"
      :metric-results="metricsResult"
      :labels-options="labelsOptions"
      :loading="computingMetrics"
    />

    <ConfirmModal
      v-if="anonymizeConfirmVisible"
      title="Anonymize annotators?"
      message="If &quot;Yes&quot;, annotator identifiers will be replaced with sequential numbers (starting from 1) in the downloaded report. If &quot;No&quot;, real annotator identifiers will be included."
      yes-label="Yes"
      no-label="No"
      @yes="resolveAnonymizeConfirm(true)"
      @no="resolveAnonymizeConfirm(false)"
      @cancel="resolveAnonymizeConfirm(undefined)"
    />
  </div>
</template>

<style scoped>
.metrics-page {
  /* Self-contained theme — no global styles required by consumers. */
  --iaa-accent: #1e4e79;
  --iaa-success: #16a34a;
  --iaa-danger: #dc2626;
  --iaa-border: rgba(0, 0, 0, 0.12);
  --iaa-muted: #6b7280;
  --iaa-star-empty: #d2cece;
  --iaa-star-on: #f5b301;
  --iaa-progress-track: #e2e8f0;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family: system-ui, sans-serif;
  color: #111;
  background: var(--iaa-bg, #fff);
}
.metrics-page__body {
  display: grid;
  grid-template-columns: 280px 1fr;
  flex: 1;
  min-height: 0;
}
.metrics-page__sidebar {
  border-right: 1px solid var(--iaa-border);
  padding: 0.75rem;
  overflow-y: auto;
}
.metrics-page__main {
  position: relative;
  min-height: 0;
}
.metrics-page__dimmer {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
