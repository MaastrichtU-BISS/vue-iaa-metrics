import type { IaaInputData } from "../types";
import type { AnnotationFilters } from "./source";

/**
 * Narrows the whole-task IAA input to the selected labels, documents and
 * annotators, so the IAA service only computes over that subset. As
 * everywhere else in the package, an empty filter array means "all".
 *
 * - Labels: trims the labelset and drops the other labels' annotations.
 *   Every metric is computed per label, so no label reads another's data.
 * - Documents: matched on `IaaDocument.id` against `DocumentOption.value`.
 * - Annotators: drops the other annotators' assignments, then any document
 *   none of the selected annotators is assigned to.
 *
 * Assignments are kept even when the label filter empties their annotations:
 * being assigned a document without applying a label is itself a data point
 * for that label's agreement.
 */
export function subsetIaaInput(input: IaaInputData, filters: AnnotationFilters): IaaInputData {
  const labels = new Set(filters.labels);
  const documents = new Set(filters.documents);
  const annotators = new Set(filters.annotators);

  let docs = input.documents;
  if (documents.size) {
    if (docs.some((doc) => doc.id === undefined)) {
      throw new Error("filtering by document requires every IaaDocument to have an id");
    }
    docs = docs.filter((doc) => documents.has(doc.id!));
  }
  if (annotators.size || labels.size) {
    docs = docs.map((doc) => ({
      ...doc,
      assignments: doc.assignments
        .filter((ass) => !annotators.size || annotators.has(ass.annotator))
        .map((ass) =>
          labels.size ? { ...ass, annotations: ass.annotations.filter((a) => labels.has(a.label)) } : ass,
        ),
    }));
  }
  if (annotators.size) {
    docs = docs.filter((doc) => doc.assignments.length > 0);
  }

  return {
    ...input,
    labelset: labels.size
      ? { labels: input.labelset.labels.filter((l) => labels.has(l.name)) }
      : input.labelset,
    documents: docs,
  };
}

function countAnnotators(input: IaaInputData): number {
  const set = new Set<string>();
  for (const doc of input.documents) for (const ass of doc.assignments) set.add(ass.annotator);
  return set.size;
}

/**
 * Why a subset can't produce meaningful metrics, or undefined if it can. The
 * annotator check only fires when the filters caused the shortfall — a task
 * that has a single annotator to begin with still gets its span counts and
 * confidence summary, as before filtering existed.
 */
export function subsetProblem(full: IaaInputData, subset: IaaInputData): string | undefined {
  if (subset.documents.length === 0) {
    return "No documents match the selected filters.";
  }
  if (subset.labelset.labels.length === 0) {
    return "None of the selected labels are in the task's labelset.";
  }
  if (countAnnotators(subset) < 2 && countAnnotators(full) >= 2) {
    return "Agreement needs at least two annotators, but the selected filters leave fewer than two assigned to the selected documents.";
  }
  return undefined;
}

export type SubsetScope = {
  documents: { selected: number; total: number };
  annotators: { selected: number; total: number };
  labels: { selected: number; total: number };
};

/** How much of the whole task a subset covers, for display alongside results. */
export function subsetScope(full: IaaInputData, subset: IaaInputData): SubsetScope {
  return {
    documents: { selected: subset.documents.length, total: full.documents.length },
    annotators: { selected: countAnnotators(subset), total: countAnnotators(full) },
    labels: { selected: subset.labelset.labels.length, total: full.labelset.labels.length },
  };
}
