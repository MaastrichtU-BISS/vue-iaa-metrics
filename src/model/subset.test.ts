import { describe, expect, it } from "vitest";
import type { IaaAssignment, IaaInputData } from "../types";
import { subsetIaaInput, subsetProblem, subsetScope } from "./subset";

const none = { labels: [], documents: [], annotators: [] };

function assignment(annotator: string, labels: string[], rating = 3): IaaAssignment {
  return {
    annotator,
    difficulty_rating: rating,
    annotations: labels.map((label, i) => ({ start: i, end: i + 1, label, text: "x" })),
  };
}

function task(): IaaInputData {
  return {
    labelset: { labels: [{ name: "A" }, { name: "B" }, { name: "C" }] },
    documents: [
      { id: "1", name: "d1", full_text: "one", assignments: [assignment("alice", ["A", "B"]), assignment("bob", ["A"])] },
      { id: "2", name: "d2", full_text: "two", assignments: [assignment("alice", ["C"]), assignment("carol", ["B"])] },
      { id: "3", name: "d3", full_text: "three", assignments: [assignment("bob", ["B"]), assignment("carol", ["A", "C"])] },
    ],
  };
}

const names = (input: IaaInputData) => input.documents.map((d) => d.name);
const annotatorsOf = (input: IaaInputData) => input.documents.map((d) => d.assignments.map((a) => a.annotator));

describe("subsetIaaInput", () => {
  it("returns the input unchanged when no filter is selected", () => {
    const input = task();
    expect(subsetIaaInput(input, none)).toEqual(input);
  });

  it("keeps annotation_level", () => {
    const input = { ...task(), annotation_level: "document" as const };
    expect(subsetIaaInput(input, { ...none, labels: ["A"] }).annotation_level).toBe("document");
  });

  it("keeps only the selected documents, matched by id", () => {
    const result = subsetIaaInput(task(), { ...none, documents: ["1", "3"] });
    expect(names(result)).toEqual(["d1", "d3"]);
    expect(result.documents[0].assignments).toHaveLength(2);
  });

  it("throws if a document filter is selected but documents have no id", () => {
    const input = task();
    delete input.documents[1].id;
    expect(() => subsetIaaInput(input, { ...none, documents: ["1"] })).toThrow(/id/);
  });

  it("does not need ids when no document filter is selected", () => {
    const input = task();
    for (const doc of input.documents) delete doc.id;
    expect(names(subsetIaaInput(input, { ...none, labels: ["A"] }))).toEqual(["d1", "d2", "d3"]);
  });

  it("trims the labelset and the other labels' annotations", () => {
    const result = subsetIaaInput(task(), { ...none, labels: ["A", "C"] });
    expect(result.labelset.labels.map((l) => l.name)).toEqual(["A", "C"]);
    const labelsUsed = result.documents.flatMap((d) => d.assignments.flatMap((a) => a.annotations.map((x) => x.label)));
    expect(new Set(labelsUsed)).toEqual(new Set(["A", "C"]));
  });

  it("keeps assignments whose annotations the label filter empties", () => {
    const result = subsetIaaInput(task(), { ...none, labels: ["C"] });
    const d1 = result.documents[0];
    expect(d1.assignments.map((a) => a.annotator)).toEqual(["alice", "bob"]);
    expect(d1.assignments.every((a) => a.annotations.length === 0)).toBe(true);
    expect(d1.assignments[0].difficulty_rating).toBe(3);
  });

  it("keeps only the selected annotators' assignments and drops documents left without any", () => {
    const result = subsetIaaInput(task(), { ...none, annotators: ["alice", "bob"] });
    expect(names(result)).toEqual(["d1", "d2", "d3"]);
    expect(annotatorsOf(result)).toEqual([["alice", "bob"], ["alice"], ["bob"]]);

    const onlyAlice = subsetIaaInput(task(), { ...none, annotators: ["alice"] });
    expect(names(onlyAlice)).toEqual(["d1", "d2"]);
  });

  it("combines all three filters", () => {
    const result = subsetIaaInput(task(), { labels: ["B"], documents: ["2", "3"], annotators: ["carol", "bob"] });
    expect(result.labelset.labels).toEqual([{ name: "B" }]);
    expect(names(result)).toEqual(["d2", "d3"]);
    expect(annotatorsOf(result)).toEqual([["carol"], ["bob", "carol"]]);
    expect(result.documents[1].assignments.map((a) => a.annotations.length)).toEqual([1, 0]);
  });

  it("does not mutate the input", () => {
    const input = task();
    const snapshot = structuredClone(input);
    subsetIaaInput(input, { labels: ["A"], documents: ["1"], annotators: ["bob"] });
    expect(input).toEqual(snapshot);
  });
});

describe("subsetProblem", () => {
  it("accepts a subset with documents, labels and two annotators", () => {
    const full = task();
    expect(subsetProblem(full, subsetIaaInput(full, { ...none, documents: ["1"] }))).toBeUndefined();
  });

  it("rejects an empty document set", () => {
    const full = task();
    const subset = subsetIaaInput(full, { ...none, documents: ["nope"] });
    expect(subsetProblem(full, subset)).toMatch(/No documents/);
  });

  it("rejects a subset without labels", () => {
    const full = task();
    const subset = subsetIaaInput(full, { ...none, labels: ["Z"] });
    expect(subsetProblem(full, subset)).toMatch(/labels/);
  });

  it("rejects filters that leave fewer than two annotators", () => {
    const full = task();
    expect(subsetProblem(full, subsetIaaInput(full, { ...none, annotators: ["alice"] }))).toMatch(/two annotators/);
    // d2 is annotated by alice and carol, but only carol is selected.
    const subset = subsetIaaInput(full, { ...none, documents: ["2"], annotators: ["carol", "bob"] });
    expect(subsetProblem(full, subset)).toMatch(/two annotators/);
  });

  it("does not block a task that only ever had one annotator", () => {
    const full: IaaInputData = {
      labelset: { labels: [{ name: "A" }] },
      documents: [{ id: "1", name: "d1", full_text: "x", assignments: [assignment("alice", ["A"])] }],
    };
    expect(subsetProblem(full, subsetIaaInput(full, none))).toBeUndefined();
  });
});

describe("subsetScope", () => {
  it("counts selected against total documents, annotators and labels", () => {
    const full = task();
    const subset = subsetIaaInput(full, { labels: ["B"], documents: ["2", "3"], annotators: ["carol", "bob"] });
    expect(subsetScope(full, subset)).toEqual({
      documents: { selected: 2, total: 3 },
      annotators: { selected: 2, total: 3 },
      labels: { selected: 1, total: 3 },
    });
  });
});

describe("hybrid tasks", () => {
  function hybrid(): IaaInputData {
    const ass = (annotator: string, spans: string[], docs: string[]): IaaAssignment => ({
      ...assignment(annotator, spans),
      document_annotations: docs.map((label) => ({ label })),
    });
    return {
      annotation_level: "hybrid",
      labelset: { labels: [{ name: "A" }, { name: "B" }] },
      document_labelset: { labels: [{ name: "Relevant" }, { name: "A" }] },
      documents: [
        { id: "1", name: "d1", full_text: "one", assignments: [ass("alice", ["A", "B"], ["Relevant", "A"]), ass("bob", ["A"], ["A"])] },
      ],
    };
  }

  it("filters span labels without touching document labels", () => {
    const out = subsetIaaInput(hybrid(), { ...none, labels: ["A"] });
    expect(out.labelset.labels).toEqual([{ name: "A" }]);
    expect(out.document_labelset!.labels).toHaveLength(2);
    const alice = out.documents[0].assignments[0];
    expect(alice.annotations.map((a) => a.label)).toEqual(["A"]);
    expect(alice.document_annotations!.map((a) => a.label)).toEqual(["Relevant", "A"]);
  });

  it("filters document labels without touching span labels", () => {
    const out = subsetIaaInput(hybrid(), { ...none, documentLabels: ["Relevant"] });
    expect(out.labelset.labels).toHaveLength(2);
    expect(out.document_labelset!.labels).toEqual([{ name: "Relevant" }]);
    const alice = out.documents[0].assignments[0];
    expect(alice.annotations).toHaveLength(2);
    expect(alice.document_annotations!.map((a) => a.label)).toEqual(["Relevant"]);
  });

  it("keeps annotation_level and returns the input unchanged without filters", () => {
    const input = hybrid();
    expect(subsetIaaInput(input, none)).toEqual(input);
  });

  it('"None" for span labels leaves only the document annotations', () => {
    const out = subsetIaaInput(hybrid(), { ...none, noSpanLabels: true });
    expect(out.labelset.labels).toEqual([]);
    expect(out.document_labelset!.labels).toHaveLength(2);
    for (const a of out.documents[0].assignments) {
      expect(a.annotations).toEqual([]);
      expect(a.document_annotations!.length).toBeGreaterThan(0);
    }
  });

  it('"None" for document labels leaves only the span annotations', () => {
    const out = subsetIaaInput(hybrid(), { ...none, noDocumentLabels: true });
    expect(out.document_labelset!.labels).toEqual([]);
    expect(out.labelset.labels).toHaveLength(2);
    for (const a of out.documents[0].assignments) {
      expect(a.document_annotations).toEqual([]);
      expect(a.annotations.length).toBeGreaterThan(0);
    }
  });

  it("None wins over selected labels of the same kind", () => {
    const out = subsetIaaInput(hybrid(), { ...none, labels: ["A"], noSpanLabels: true });
    expect(out.labelset.labels).toEqual([]);
  });

  it("choosing None for both kinds leaves nothing to compute", () => {
    const input = hybrid();
    const out = subsetIaaInput(input, { ...none, noSpanLabels: true, noDocumentLabels: true });
    expect(subsetProblem(input, out)).toMatch(/labels/);
  });

  it("counts labels from both labelsets in the scope", () => {
    const input = hybrid();
    const scope = subsetScope(input, subsetIaaInput(input, { ...none, labels: ["A"], documentLabels: ["Relevant"] }));
    expect(scope.labels).toEqual({ selected: 2, total: 4 });
  });
});
