import type { NullableFloat, RichAnnotation } from "../types";

export function stripAnnotatorPrefix(annotator: string): string {
  return annotator.startsWith("annotator_") ? annotator.slice("annotator_".length) : annotator;
}

export function formatNullableFloat(value: NullableFloat, digits: number = 3): string {
  return value == null ? "N/A" : value.toFixed(digits);
}

export function sortByDocumentAndRange(ranges: RichAnnotation[]): void {
  ranges.sort((x, y) => {
    if (x.doc_id < y.doc_id) {
      return -1;
    } else if (x.doc_id == y.doc_id) {
      if (x.start < y.start) {
        return -1;
      } else if (x.start == y.start) {
        return x.end <= y.end ? -1 : 1;
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  });
}
