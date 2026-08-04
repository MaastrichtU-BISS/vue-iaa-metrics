<script setup lang="ts">
import { computed } from "vue";
import type { DifficultyRatingSummary } from "../types";
import { formatNullableFloat, stripAnnotatorPrefix } from "../model/format";
import StarRating from "./StarRating.vue";

const props = defineProps<{
  results: DifficultyRatingSummary | undefined;
  loading: boolean;
}>();

const pairs = computed(() => Object.entries(props.results?.krippendorff_alpha_pairs ?? {}));

const formatPairName = (pair: string): string =>
  pair
    .split("_vs_")
    .map((a) => stripAnnotatorPrefix(a))
    .join(" vs ");

const percent = (count: number | undefined) => {
  if (!props.results?.total) return 0;
  return ((count ?? 0) / props.results.total) * 100;
};
</script>

<template>
  <div v-if="!loading && results" class="results-confidence">
    <div class="results-confidence__summary">
      <div class="results-confidence__average">
        <StarRating :value="results.mean ?? 0" />
        <span>{{ formatNullableFloat(results.mean, 2) }} average</span>
      </div>
      <div class="results-confidence__count">
        {{ results.rated }} / {{ results.total }}
        <span class="results-confidence__subtle">
          ({{ results.total ? ((results.rated / results.total) * 100).toFixed(0) : 0 }}%)
        </span>
      </div>
    </div>

    <div v-for="i in [5, 4, 3, 2, 1]" :key="i" class="results-confidence__bar-row">
      <span class="results-confidence__bar-label">{{ i }} ★</span>
      <div class="results-confidence__bar-track">
        <div class="results-confidence__bar-fill" :style="{ width: `${percent(results.counts[i])}%` }" />
      </div>
      <span class="results-confidence__subtle">
        {{ results.counts[i] ?? 0 }} ({{ percent(results.counts[i]).toFixed(1) }}%)
      </span>
    </div>

    <div class="results-confidence__alpha">
      <div class="results-confidence__alpha-total">
        Krippendorff's alpha (all annotators): {{ formatNullableFloat(results.krippendorff_alpha) }}
      </div>
      <table v-if="pairs.length" class="results-confidence__table">
        <thead>
          <tr>
            <th>Pair</th>
            <th class="results-confidence__center">Krippendorff's alpha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[pair, value] in pairs" :key="pair">
            <th scope="row">{{ formatPairName(pair) }}</th>
            <td class="results-confidence__center">{{ formatNullableFloat(value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.results-confidence {
  font-size: 0.85rem;
}
.results-confidence__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.results-confidence__average {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.results-confidence__count {
  color: var(--iaa-muted, #6b7280);
}
.results-confidence__subtle {
  color: var(--iaa-muted, #6b7280);
  font-size: 0.8rem;
}
.results-confidence__bar-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.5rem 0;
}
.results-confidence__bar-label {
  width: 2rem;
  flex-shrink: 0;
}
.results-confidence__bar-track {
  flex: 1;
  height: 0.9rem;
  background: var(--iaa-progress-track, #e2e8f0);
  border-radius: 999px;
  overflow: hidden;
}
.results-confidence__bar-fill {
  height: 100%;
  background: var(--iaa-star-on, #f5b301);
}
.results-confidence__alpha {
  text-align: center;
  margin-top: 1.25rem;
}
.results-confidence__alpha-total {
  font-weight: 700;
}
.results-confidence__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  text-align: left;
}
.results-confidence__table th,
.results-confidence__table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
}
.results-confidence__center {
  text-align: center;
}
</style>
