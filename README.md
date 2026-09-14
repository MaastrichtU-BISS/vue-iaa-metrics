# Vue IAA Metrics

A **Vue component library, distributed as an npm package**, for browsing
per-annotator annotations and computing inter-annotator agreement (IAA)
metrics over a shared document set. Extracted from
[Lawnotation](https://lawnotation.org)'s task metrics page so the same UI and
orchestration logic can be reused by other projects, decoupled from
Lawnotation's own data model (Supabase/tRPC) and UI stack (PrimeVue/Tailwind).

---

## 1. What this package does

Given a set of documents that one or more annotators have labelled (spans of
text, or whole-document tags) plus a per-item confidence rating, this package:

- Lets a user filter and browse the raw annotations, grouped by document.
- Sends the task — narrowed to the selected labels, documents and annotators,
  if any are selected — to an external **IAA service** (the Go tool in
  [`lawnotation-iaa`](../lawnotation-iaa)) to compute agreement metrics —
  span-matching precision/recall/F1 and coverage agreement (Krippendorff's α,
  Cohen's κ) — and displays the results.
- Lets the user download the report for the same selection as a ZIP,
  optionally anonymizing annotator identifiers first.

It does **not** talk to any backend directly. Everything — fetching filter
options, fetching annotations, and calling the IAA service — goes through a
single delegate interface the host implements: `MetricsSource`.

---

## 2. Usage

```vue
<script setup lang="ts">
import { MetricsPage, type MetricsSource } from "vue-iaa-metrics";
import "vue-iaa-metrics/style.css";

const source: MetricsSource = {
  /* see contract below */
};
</script>

<template>
  <MetricsPage
    :source="source"
    report-filename="my-task.zip"
    @error="(message) => toast.error(message)"
    @open-document="(doc) => router.push(`/documents/${doc.id}`)"
  />
</template>
```

### Props

| Prop | Type | Notes |
|---|---|---|
| `source` | `MetricsSource` | Required. The data/network delegate — see below. |
| `reportFilename` | `string` | Optional. Filename used when saving a downloaded report. Defaults to `iaa_report.zip`. |

### Events

| Event | Payload | Notes |
|---|---|---|
| `error` | `message: string` | Fired whenever a `MetricsSource` call rejects. The package has no built-in toast — hosts surface this however they like. |
| `open-document` | `{ id: string; name: string }` | Fired when the user clicks a document header in the annotation list. Not a real `<a href>` (the package can't assume `vue-router`/Nuxt) — the host decides how to navigate. |

---

## 3. The `MetricsSource` contract

```ts
interface MetricsSource {
  getLabels(): Promise<LabelOption[]> | LabelOption[];
  getAnnotators(): Promise<string[]> | string[];
  getDocuments(): Promise<DocumentOption[]> | DocumentOption[];
  getAnnotations(filters: AnnotationFilters): Promise<RichAnnotation[]>;
  getIaaInputData(): Promise<IaaInputData>;
  computeMetrics(input: IaaInputData, params: IaaParams): Promise<IaaMetricsResponse>;
  downloadReport(input: IaaInputData, params: IaaParams): Promise<Blob>;
}
```

- **`getLabels` / `getAnnotators` / `getDocuments`** — populate the filter
  dropdowns. Called once, on mount.
- **`getAnnotations(filters)`** — the browsable, filtered annotation list.
  `filters` arrays are empty when nothing's selected for that facet (empty
  means "all", not "none"). Called on mount and again whenever a filter
  changes.
- **`getIaaInputData()`** — the *whole* task (unfiltered), in the shape the
  IAA service expects. Called once on mount and cached for the rest of the
  session; also where `annotation_level` is read to decide whether to show
  the span-matching criterion/granularity toggles (hidden for document-level
  tasks).

  The package applies the selected filters to this input itself before
  calling `computeMetrics`/`downloadReport` (see `subsetIaaInput`), so those
  receive only the selected subset. For that to work:
  - each document's `id` must be the same value as its `DocumentOption.value`
    — without ids, selecting a document filter reports an error instead of
    computing;
  - each assignment's `annotator` must be the same string `getAnnotators`
    returns, and each annotation's `label` the same name `getLabels` returns.

  Selections that can't produce meaningful metrics — no matching documents,
  or fewer than two annotators left (when the task has at least two) — are
  reported through the `error` event without calling the service.
- **`computeMetrics` / `downloadReport`** — **host-implemented on purpose.**
  The IAA Go service has no CORS or auth handling (see its own README), so
  it's never meant to be called directly from a browser. Hosts proxy it
  through their own backend — see Lawnotation's `/api/iaa/metrics` and
  `/api/iaa/report-zip` server routes for a reference implementation (a thin
  `fetch` pass-through with error normalization).

### `IaaInputData` (the IAA service's input schema)

```json
{
  "labelset": { "labels": [{ "name": "Actors" }] },
  "documents": [
    {
      "id": "1",
      "name": "doc_001.txt",
      "full_text": "The full document text.",
      "assignments": [
        {
          "annotator": "alice@example.com",
          "difficulty_rating": 4,
          "annotations": [{ "start": 4, "end": 26, "label": "Actors", "text": "..." }]
        }
      ]
    }
  ],
  "annotation_level": "document"
}
```

`annotation_level` is omitted for span-level tasks; `"document"` for
whole-document tagging (no `start`/`end`, one annotation per label). `id` is
only used by the package, for the document filter; the IAA service ignores it.

### `IaaMetricsResponse` (the IAA service's output schema)

See `src/types.ts` for the full shape (`IaaReport` per label —
`span_matching` + `coverage_agreement` — plus `confidence_metrics`, a
`DifficultyRatingSummary`). Matches the Go service's `/metrics` response
verbatim; the package never transforms it, only renders it.

---

## 4. Architecture

- **No backend assumptions.** `computeMetrics`/`downloadReport` are the
  host's problem — the package doesn't know or care whether that's a proxy
  route, a direct fetch, or something else.
- **Self-contained UI.** Own scoped CSS + CSS custom properties
  (`--iaa-accent`, `--iaa-border`, etc.), no PrimeVue/Tailwind/other UI-kit
  dependency — drop it into any Vue 3 app.
- **The IAA JSON is the contract.** `IaaInputData`/`IaaMetricsResponse` match
  the Go service's schema exactly; hosts map their own data model into/out of
  it (see `RichAnnotation`, `LabelOption`, `DocumentOption` for the pieces the
  UI itself needs).

---

## 5. Development

```bash
pnpm install
pnpm dev      # serves src/dev/App.vue against a mock MetricsSource
```

`src/dev/mockSource.ts` proxies `computeMetrics`/`downloadReport` straight to
`http://localhost:8080`, so run `lawnotation-iaa` locally to exercise real
computation:

```bash
cd ../lawnotation-iaa
go run main.go iaa.go server.go --serve --port 8080
```

```bash
pnpm test     # unit tests (vitest)
pnpm build    # type-checks (vue-tsc) then builds dist/ in library mode
```
