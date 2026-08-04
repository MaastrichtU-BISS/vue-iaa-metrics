<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { IaaReport, LabelOption } from "../types";
import { formatNullableFloat, stripAnnotatorPrefix } from "../model/format";

const props = defineProps<{
  report: IaaReport | undefined;
  labelsOptions: LabelOption[];
  loading: boolean;
}>();

const labels = computed(() => Object.keys(props.report?.per_label ?? {}));
const selectedLabel = ref<string>();

watch(
  labels,
  (newLabels) => {
    if (!selectedLabel.value || !newLabels.includes(selectedLabel.value)) {
      selectedLabel.value = newLabels[0];
    }
  },
  { immediate: true },
);

const currentLabel = computed(() => {
  if (!selectedLabel.value) return undefined;
  return props.report?.per_label[selectedLabel.value];
});

const formatPairName = (pair: string): string =>
  pair
    .split("_vs_")
    .map((a) => stripAnnotatorPrefix(a))
    .join(" vs ");

const formatReference = (direction: string): string =>
  stripAnnotatorPrefix(direction.replace(/_as_reference$/, ""));

const formatOtherAnnotator = (pair: string, direction: string): string => {
  const reference = direction.replace(/_as_reference$/, "");
  const [a, b] = pair.split("_vs_");
  return stripAnnotatorPrefix((reference === a ? b : a) ?? "");
};
</script>

<template>
  <div v-if="!loading" class="results-agreement">
    <div v-if="!labels.length" class="results-agreement__empty">No metrics computed yet.</div>
    <template v-else>
      <div class="results-agreement__picker">
        <label class="results-agreement__picker-label">Label</label>
        <select v-model="selectedLabel" class="results-agreement__select">
          <option v-for="name in labels" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>

      <div v-if="currentLabel" class="results-agreement__sections">
        <div>
          <h4 class="results-agreement__heading">Coverage Agreement ({{ report!.meta.granularity }})</h4>
          <table class="results-agreement__table">
            <thead>
              <tr>
                <th>Pair</th>
                <th class="results-agreement__center">Cohen's kappa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">All annotators</th>
                <td class="results-agreement__center">
                  {{ formatNullableFloat(currentLabel.coverage_agreement.krippendorff_alpha) }}
                  <span class="results-agreement__note">(Krippendorff's α)</span>
                </td>
              </tr>
              <tr v-for="(value, pair) in currentLabel.coverage_agreement.cohen_kappa_pairs" :key="pair">
                <th scope="row">{{ formatPairName(pair) }}</th>
                <td class="results-agreement__center">{{ formatNullableFloat(value) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="results-agreement__footnote">{{ report!.meta.notes.coverage_agreement }}</p>
        </div>

        <div>
          <h4 class="results-agreement__heading">
            Span Matching ({{ report!.meta.criterion }})
            <span class="results-agreement__subtle">
              — Macro F1: {{ formatNullableFloat(currentLabel.span_matching.macro_f1) }}
            </span>
          </h4>
          <table v-if="currentLabel.span_matching.pairs" class="results-agreement__table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Compared to</th>
                <th class="results-agreement__center">Precision</th>
                <th class="results-agreement__center">Recall</th>
                <th class="results-agreement__center">F1</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(directions, pair) in currentLabel.span_matching.pairs" :key="pair">
                <tr v-for="(result, direction) in directions" :key="direction">
                  <th scope="row">{{ formatReference(direction) }}</th>
                  <td>{{ formatOtherAnnotator(pair, direction) }}</td>
                  <td class="results-agreement__center">{{ formatNullableFloat(result.precision) }}</td>
                  <td class="results-agreement__center">{{ formatNullableFloat(result.recall) }}</td>
                  <td class="results-agreement__center">{{ formatNullableFloat(result.f1) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="results-agreement__subtle">N/A (not applicable at document annotation level)</div>
          <p v-if="report!.meta.notes.span_matching" class="results-agreement__footnote">
            {{ report!.meta.notes.span_matching }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.results-agreement__empty {
  text-align: center;
  color: var(--iaa-muted, #6b7280);
  padding: 2.5rem 0;
}
.results-agreement__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.results-agreement__picker-label {
  font-size: 0.85rem;
  font-weight: 600;
}
.results-agreement__select {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  width: 65%;
}
.results-agreement__sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.results-agreement__heading {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}
.results-agreement__subtle {
  font-weight: 400;
  color: var(--iaa-muted, #6b7280);
}
.results-agreement__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}
.results-agreement__table th,
.results-agreement__table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
}
.results-agreement__table thead th {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--iaa-muted, #6b7280);
  background: rgba(0, 0, 0, 0.03);
}
.results-agreement__center {
  text-align: center;
}
.results-agreement__note {
  font-size: 0.72rem;
  color: var(--iaa-muted, #6b7280);
}
.results-agreement__footnote {
  font-size: 0.75rem;
  font-style: italic;
  color: var(--iaa-muted, #6b7280);
  margin: 0.5rem 0 0;
}
</style>
