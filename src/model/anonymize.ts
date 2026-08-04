import type { IaaInputData } from "../types";

/** Replaces each annotator identifier with a sequential number (first-seen
 * order, starting at 1) so a downloaded report doesn't contain real names. */
export function anonymizeAnnotators(input: IaaInputData): IaaInputData {
  const indices = new Map<string, number>();
  return {
    ...input,
    documents: input.documents.map((doc) => ({
      ...doc,
      assignments: doc.assignments.map((ass) => {
        if (!indices.has(ass.annotator)) indices.set(ass.annotator, indices.size + 1);
        return { ...ass, annotator: String(indices.get(ass.annotator)!) };
      }),
    })),
  };
}
