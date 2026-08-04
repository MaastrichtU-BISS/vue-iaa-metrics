<script setup lang="ts">
import { ref } from "vue";
import type { IaaMetricsResponse, LabelOption } from "../types";
import ResultsAgreement from "./ResultsAgreement.vue";
import ResultsConfidence from "./ResultsConfidence.vue";
import Spinner from "./Spinner.vue";

const visible = defineModel<boolean>("visible", { required: true });

defineProps<{
  metricResults: IaaMetricsResponse | undefined;
  labelsOptions: LabelOption[];
  loading: boolean;
}>();

const activeTab = ref<"agreement" | "confidence">("agreement");
</script>

<template>
  <div v-if="visible" class="results-modal__overlay" @click.self="visible = false">
    <div class="results-modal" role="dialog" aria-modal="true" aria-label="Results">
      <div class="results-modal__header">
        <h3 class="results-modal__title">Results</h3>
        <button type="button" class="results-modal__close" aria-label="Close" @click="visible = false">×</button>
      </div>

      <div v-if="loading" class="results-modal__loading">
        <Spinner :size="48" />
      </div>
      <template v-else>
        <div class="results-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="results-modal__tab"
            :class="{ 'results-modal__tab--active': activeTab === 'agreement' }"
            @click="activeTab = 'agreement'"
          >
            Inter-Annotator Agreement
          </button>
          <button
            type="button"
            role="tab"
            class="results-modal__tab"
            :class="{ 'results-modal__tab--active': activeTab === 'confidence' }"
            @click="activeTab = 'confidence'"
          >
            Confidence
          </button>
        </div>
        <div class="results-modal__panel">
          <ResultsAgreement
            v-if="activeTab === 'agreement'"
            :report="metricResults?.annotation_metrics"
            :labels-options="labelsOptions"
            :loading="loading"
          />
          <ResultsConfidence v-else :results="metricResults?.confidence_metrics" :loading="loading" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.results-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: system-ui, sans-serif;
}
.results-modal {
  background: #fff;
  border-radius: 10px;
  width: min(640px, calc(100% - 2rem));
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.results-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
}
.results-modal__title {
  margin: 0;
  font-size: 1.05rem;
}
.results-modal__close {
  border: none;
  background: none;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--iaa-muted, #6b7280);
}
.results-modal__loading {
  min-height: 26rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.results-modal__tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
}
.results-modal__tab {
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.7rem 0.4rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  color: var(--iaa-muted, #6b7280);
}
.results-modal__tab--active {
  color: var(--iaa-accent, #1e4e79);
  border-bottom-color: var(--iaa-accent, #1e4e79);
}
.results-modal__panel {
  padding: 1.25rem;
  overflow-y: auto;
  min-height: 26rem;
}
</style>
